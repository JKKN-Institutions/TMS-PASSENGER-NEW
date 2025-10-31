-- Enhance attendance table with better presence tracking
-- Run this migration after create_attendance_table.sql

-- Add more detailed presence tracking columns
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS marked_absent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marked_absent_by TEXT,
ADD COLUMN IF NOT EXISTS boarding_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_boarding_time TIME,
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS attendance_method TEXT CHECK (attendance_method IN ('qr_scan', 'manual_entry', 'auto_marked', 'bulk_mark')) DEFAULT 'qr_scan';

-- Create function to auto-mark absences for no-shows
CREATE OR REPLACE FUNCTION auto_mark_absences(
  p_route_id UUID,
  p_trip_date DATE,
  p_marked_by TEXT
)
RETURNS TABLE(
  booking_id UUID,
  student_name TEXT,
  roll_number TEXT,
  boarding_stop TEXT
) AS $$
BEGIN
  -- Mark all confirmed bookings as absent if not already scanned
  INSERT INTO attendance (
    booking_id,
    student_id,
    route_id,
    schedule_id,
    trip_date,
    boarding_stop,
    status,
    scanned_by,
    marked_absent_at,
    marked_absent_by,
    qr_code,
    booking_reference,
    attendance_method,
    notes
  )
  SELECT
    b.id,
    b.student_id,
    b.route_id,
    b.schedule_id,
    b.trip_date,
    b.boarding_stop,
    'absent'::TEXT,
    p_marked_by,
    NOW(),
    p_marked_by,
    b.qr_code,
    b.booking_reference,
    'auto_marked'::TEXT,
    'Auto-marked absent - no scan recorded'
  FROM bookings b
  WHERE b.route_id = p_route_id
    AND b.trip_date = p_trip_date
    AND b.status IN ('confirmed', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.booking_id = b.id
        AND a.trip_date = b.trip_date
    )
  RETURNING
    attendance.booking_id,
    (SELECT student_name FROM students WHERE id = attendance.student_id),
    (SELECT roll_number FROM students WHERE id = attendance.student_id),
    attendance.boarding_stop;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark presence manually
CREATE OR REPLACE FUNCTION mark_student_present(
  p_booking_id UUID,
  p_staff_email TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_booking RECORD;
BEGIN
  -- Get booking details
  SELECT
    b.id,
    b.student_id,
    b.route_id,
    b.schedule_id,
    b.trip_date,
    b.boarding_stop,
    b.booking_reference,
    b.qr_code,
    s.student_name,
    s.roll_number
  INTO v_booking
  FROM bookings b
  JOIN students s ON b.student_id = s.id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  -- Check if attendance already exists
  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE booking_id = p_booking_id
      AND trip_date = v_booking.trip_date
  ) THEN
    -- Update existing attendance to present
    UPDATE attendance
    SET
      status = 'present',
      scanned_at = NOW(),
      scanned_by = p_staff_email,
      boarding_time = NOW(),
      attendance_method = 'manual_entry',
      notes = COALESCE(p_notes, notes)
    WHERE booking_id = p_booking_id
      AND trip_date = v_booking.trip_date;
  ELSE
    -- Create new attendance record
    INSERT INTO attendance (
      booking_id,
      student_id,
      route_id,
      schedule_id,
      trip_date,
      boarding_stop,
      status,
      scanned_by,
      scanned_at,
      boarding_time,
      qr_code,
      booking_reference,
      attendance_method,
      notes
    ) VALUES (
      p_booking_id,
      v_booking.student_id,
      v_booking.route_id,
      v_booking.schedule_id,
      v_booking.trip_date,
      v_booking.boarding_stop,
      'present',
      p_staff_email,
      NOW(),
      NOW(),
      v_booking.qr_code,
      v_booking.booking_reference,
      'manual_entry',
      p_notes
    );
  END IF;

  -- Return success with student details
  RETURN json_build_object(
    'success', true,
    'student_name', v_booking.student_name,
    'roll_number', v_booking.roll_number,
    'boarding_stop', v_booking.boarding_stop
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to mark student absent manually
CREATE OR REPLACE FUNCTION mark_student_absent(
  p_booking_id UUID,
  p_staff_email TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_booking RECORD;
BEGIN
  -- Get booking details
  SELECT
    b.id,
    b.student_id,
    b.route_id,
    b.schedule_id,
    b.trip_date,
    b.boarding_stop,
    b.booking_reference,
    s.student_name,
    s.roll_number
  INTO v_booking
  FROM bookings b
  JOIN students s ON b.student_id = s.id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  -- Check if attendance already exists
  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE booking_id = p_booking_id
      AND trip_date = v_booking.trip_date
  ) THEN
    -- Update existing attendance to absent
    UPDATE attendance
    SET
      status = 'absent',
      marked_absent_at = NOW(),
      marked_absent_by = p_staff_email,
      attendance_method = 'manual_entry',
      notes = COALESCE(p_notes, notes)
    WHERE booking_id = p_booking_id
      AND trip_date = v_booking.trip_date;
  ELSE
    -- Create new attendance record as absent
    INSERT INTO attendance (
      booking_id,
      student_id,
      route_id,
      schedule_id,
      trip_date,
      boarding_stop,
      status,
      marked_absent_at,
      marked_absent_by,
      booking_reference,
      attendance_method,
      notes
    ) VALUES (
      p_booking_id,
      v_booking.student_id,
      v_booking.route_id,
      v_booking.schedule_id,
      v_booking.trip_date,
      v_booking.boarding_stop,
      'absent',
      NOW(),
      p_staff_email,
      v_booking.booking_reference,
      'manual_entry',
      p_notes
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'student_name', v_booking.student_name,
    'roll_number', v_booking.roll_number
  );
END;
$$ LANGUAGE plpgsql;

-- Create view for attendance with booking details
CREATE OR REPLACE VIEW attendance_with_bookings AS
SELECT
  a.id as attendance_id,
  a.trip_date,
  a.status as attendance_status,
  a.scanned_at,
  a.scanned_by,
  a.boarding_time,
  a.marked_absent_at,
  a.marked_absent_by,
  a.attendance_method,
  a.notes,
  a.is_late,
  a.late_duration_minutes,
  -- Student details
  s.id as student_id,
  s.student_name,
  s.roll_number,
  s.email as student_email,
  s.phone as student_phone,
  -- Route details
  r.id as route_id,
  r.route_number,
  r.route_name,
  -- Booking details
  b.id as booking_id,
  b.booking_reference,
  b.seat_number,
  b.payment_status,
  b.boarding_stop,
  b.status as booking_status,
  -- Schedule details
  sch.departure_time,
  sch.arrival_time
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN routes r ON a.route_id = r.id
JOIN bookings b ON a.booking_id = b.id
LEFT JOIN schedules sch ON a.schedule_id = sch.id
ORDER BY a.scanned_at DESC;

-- Create function to get attendance overview for a route and date
CREATE OR REPLACE FUNCTION get_attendance_overview(
  p_route_id UUID,
  p_trip_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_bookings', COUNT(*),
    'present', COUNT(*) FILTER (WHERE a.status = 'present'),
    'absent', COUNT(*) FILTER (WHERE a.status = 'absent'),
    'not_marked', COUNT(*) FILTER (WHERE a.id IS NULL),
    'attendance_rate',
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0
      END,
    'late_arrivals', COUNT(*) FILTER (WHERE a.is_late = true),
    'by_stop', (
      SELECT json_object_agg(
        boarding_stop,
        json_build_object(
          'total', count(*),
          'present', count(*) FILTER (WHERE a.status = 'present'),
          'absent', count(*) FILTER (WHERE a.status = 'absent')
        )
      )
      FROM bookings b2
      LEFT JOIN attendance a2 ON a2.booking_id = b2.id AND a2.trip_date = p_trip_date
      WHERE b2.route_id = p_route_id
        AND b2.trip_date = p_trip_date
        AND b2.status IN ('confirmed', 'completed')
      GROUP BY boarding_stop
    )
  ) INTO v_result
  FROM bookings b
  LEFT JOIN attendance a ON a.booking_id = b.id AND a.trip_date = p_trip_date
  WHERE b.route_id = p_route_id
    AND b.trip_date = p_trip_date
    AND b.status IN ('confirmed', 'completed');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_status_date ON attendance(status, trip_date);
CREATE INDEX IF NOT EXISTS idx_attendance_boarding_time ON attendance(boarding_time) WHERE boarding_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(attendance_method);

-- Add comments
COMMENT ON COLUMN attendance.marked_absent_at IS 'Timestamp when student was marked absent (for no-shows)';
COMMENT ON COLUMN attendance.marked_absent_by IS 'Staff member who marked the student absent';
COMMENT ON COLUMN attendance.boarding_time IS 'Actual time when student boarded (scanned)';
COMMENT ON COLUMN attendance.is_late IS 'Whether student boarded late';
COMMENT ON COLUMN attendance.attendance_method IS 'How attendance was recorded: qr_scan, manual_entry, auto_marked, bulk_mark';
COMMENT ON FUNCTION auto_mark_absences IS 'Automatically marks all unscanned bookings as absent for a route and date';
COMMENT ON FUNCTION mark_student_present IS 'Manually marks a student as present';
COMMENT ON FUNCTION mark_student_absent IS 'Manually marks a student as absent';
COMMENT ON FUNCTION get_attendance_overview IS 'Gets comprehensive attendance statistics for a route and date';

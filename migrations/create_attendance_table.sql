-- Create attendance table for tracking student boarding
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL,
  boarding_stop TEXT NOT NULL,

  -- Attendance details
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'cancelled')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scanned_by TEXT NOT NULL, -- Staff email who scanned the ticket
  scan_location TEXT, -- Optional: GPS location where scan occurred

  -- QR Code verification
  qr_code TEXT,
  booking_reference TEXT,

  -- Additional metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one attendance record per booking per trip
  CONSTRAINT unique_attendance_per_booking UNIQUE (booking_id, trip_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_route_id ON attendance(route_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trip_date ON attendance(trip_date);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_by ON attendance(scanned_by);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_booking_id ON attendance(booking_id);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_id ON attendance(schedule_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_route_date ON attendance(route_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, trip_date);

-- Add RLS policies for attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own attendance
CREATE POLICY "Students can view own attendance"
  ON attendance
  FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Policy: Staff can view attendance for their assigned routes
CREATE POLICY "Staff can view attendance for assigned routes"
  ON attendance
  FOR SELECT
  USING (
    route_id IN (
      SELECT route_id FROM staff_route_assignments
      WHERE staff_email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

-- Policy: Staff can insert attendance for their assigned routes
CREATE POLICY "Staff can insert attendance for assigned routes"
  ON attendance
  FOR INSERT
  WITH CHECK (
    route_id IN (
      SELECT route_id FROM staff_route_assignments
      WHERE staff_email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

-- Policy: Staff can update attendance for their assigned routes
CREATE POLICY "Staff can update attendance for assigned routes"
  ON attendance
  FOR UPDATE
  USING (
    route_id IN (
      SELECT route_id FROM staff_route_assignments
      WHERE staff_email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all attendance"
  ON attendance
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin'
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_attendance_timestamp
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- Create view for attendance summary
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  a.id,
  a.trip_date,
  a.status,
  a.scanned_at,
  a.scanned_by,
  a.boarding_stop,
  s.student_name,
  s.roll_number,
  s.email as student_email,
  r.route_number,
  r.route_name,
  b.booking_reference,
  b.seat_number,
  b.payment_status
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN routes r ON a.route_id = r.id
JOIN bookings b ON a.booking_id = b.id
ORDER BY a.scanned_at DESC;

COMMENT ON TABLE attendance IS 'Records student attendance when they board the transport';
COMMENT ON COLUMN attendance.status IS 'Status: present (scanned), absent (no-show), cancelled';
COMMENT ON COLUMN attendance.scanned_by IS 'Email of the staff member who scanned the ticket';
COMMENT ON COLUMN attendance.scan_location IS 'Optional GPS coordinates where the scan occurred';

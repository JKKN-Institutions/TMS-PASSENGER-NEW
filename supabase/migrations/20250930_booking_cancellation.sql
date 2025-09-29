-- Migration: Add booking cancellation support
-- Date: 2025-09-30
-- Description: Add cancellation fields to bookings table and update booking_actions_log

-- Add cancellation fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- Add index for cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status_cancelled ON bookings(status) WHERE status = 'cancelled';

-- Update booking_actions_log to support cancellation actions
-- The table should already exist from previous migrations, just ensure it supports cancellation
INSERT INTO booking_actions_log (booking_id, student_id, action, action_details, created_at)
SELECT 
  id as booking_id,
  student_id,
  'cancelled' as action,
  jsonb_build_object(
    'cancelled_by', cancelled_by,
    'cancellation_reason', cancellation_reason,
    'cancelled_at', cancelled_at
  ) as action_details,
  cancelled_at as created_at
FROM bookings 
WHERE status = 'cancelled' 
  AND cancelled_at IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM booking_actions_log 
    WHERE booking_actions_log.booking_id = bookings.id 
    AND booking_actions_log.action = 'cancelled'
  );

-- Add comment for documentation
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when the booking was cancelled';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason for cancellation (e.g., cancelled_by_student, cancelled_by_admin)';
COMMENT ON COLUMN bookings.cancelled_by IS 'Who cancelled the booking (student, admin, system)';

-- Create a function to handle booking cancellation with proper logging
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_student_id UUID,
  p_cancelled_by TEXT DEFAULT 'student',
  p_cancellation_reason TEXT DEFAULT 'cancelled_by_student'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get the booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id 
    AND student_id = p_student_id 
    AND status = 'confirmed';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or already cancelled'
    );
  END IF;
  
  -- Update the booking status
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = p_cancellation_reason,
    cancelled_by = p_cancelled_by,
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Log the cancellation action
  INSERT INTO booking_actions_log (
    booking_id,
    student_id,
    action,
    action_details
  ) VALUES (
    p_booking_id,
    p_student_id,
    'cancelled',
    jsonb_build_object(
      'cancelled_by', p_cancelled_by,
      'cancellation_reason', p_cancellation_reason,
      'cancelled_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Booking cancelled successfully',
    'booking_id', p_booking_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;

-- Add RLS policy for cancelled bookings (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'Users can view their own cancelled bookings'
  ) THEN
    CREATE POLICY "Users can view their own cancelled bookings"
    ON bookings FOR SELECT
    USING (
      auth.uid()::text = student_id::text 
      OR status = 'cancelled'
    );
  END IF;
END $$;

-- Create a view for booking history including cancellations
CREATE OR REPLACE VIEW booking_history AS
SELECT 
  b.id,
  b.student_id,
  b.schedule_id,
  b.status,
  b.seat_number,
  b.qr_code,
  b.payment_status,
  b.created_at,
  b.updated_at,
  b.cancelled_at,
  b.cancellation_reason,
  b.cancelled_by,
  s.schedule_date,
  s.departure_time,
  r.route_name,
  r.route_number,
  st.student_name,
  st.roll_number
FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
JOIN routes r ON s.route_id = r.id
JOIN students st ON b.student_id = st.id
ORDER BY b.created_at DESC;

-- Grant access to the view
GRANT SELECT ON booking_history TO authenticated;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_student_status ON bookings(student_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_status ON bookings(schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_actions_log_booking_action ON booking_actions_log(booking_id, action);

-- Migration: Enhanced Scheduler for Multiple Daily Time Slots
-- Date: 2025-09-16
-- Description: Add time_slot support for multiple daily notification runs

-- Add time_slot column to scheduler_runs table
ALTER TABLE scheduler_runs 
ADD COLUMN IF NOT EXISTS time_slot VARCHAR(5); -- Format: '17:00', '18:00'

-- Update existing records to have a default time_slot
UPDATE scheduler_runs 
SET time_slot = '19:00' 
WHERE time_slot IS NULL;

-- Create composite index for better performance
CREATE INDEX IF NOT EXISTS idx_scheduler_runs_type_date_time ON scheduler_runs(scheduler_type, run_date, time_slot);

-- Create function to get daily scheduler status
CREATE OR REPLACE FUNCTION get_daily_scheduler_status(check_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  time_slot VARCHAR(5),
  status VARCHAR(20),
  notifications_sent INTEGER,
  last_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.time_slot,
    sr.status,
    COALESCE((sr.result_summary->>'notificationsSent')::INTEGER, 0) as notifications_sent,
    sr.completed_at as last_run
  FROM scheduler_runs sr
  WHERE sr.scheduler_type = 'booking_reminders'
    AND sr.run_date = check_date
  ORDER BY sr.time_slot;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if scheduler should run
CREATE OR REPLACE FUNCTION should_scheduler_run(
  check_time_slot VARCHAR(5),
  check_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  last_successful_run TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the last successful run for this time slot and date
  SELECT completed_at INTO last_successful_run
  FROM scheduler_runs
  WHERE scheduler_type = 'booking_reminders'
    AND run_date = check_date
    AND time_slot = check_time_slot
    AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Return true if no successful run found
  RETURN last_successful_run IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add notification preferences table for time-based settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot VARCHAR(5) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  urgency_level VARCHAR(20) DEFAULT 'normal',
  retry_attempts INTEGER DEFAULT 3,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification preferences
INSERT INTO notification_preferences (time_slot, notification_type, title_template, body_template, urgency_level) VALUES
('17:00', 'booking_reminder', '🚌 Bus Booking Reminder - Tomorrow', 'You have a scheduled trip tomorrow. Please confirm your booking to secure your seat.', 'normal'),
('18:00', 'booking_reminder', '⏰ Last Chance - Confirm Your Bus Booking', 'Final reminder: Please confirm your booking for tomorrow''s trip. Deadline approaching!', 'high')
ON CONFLICT DO NOTHING;

-- Create index for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_time_type ON notification_preferences(time_slot, notification_type);

-- Add comment for documentation
COMMENT ON TABLE notification_preferences IS 'Stores notification templates and settings for different time slots';
COMMENT ON COLUMN scheduler_runs.time_slot IS 'Time slot when the scheduler ran (format: HH:MM)';

-- Create view for scheduler monitoring
CREATE OR REPLACE VIEW scheduler_monitoring AS
SELECT 
  sr.run_date,
  sr.time_slot,
  sr.status,
  sr.started_at,
  sr.completed_at,
  (sr.result_summary->>'notificationsSent')::INTEGER as notifications_sent,
  (sr.result_summary->>'notificationsFailed')::INTEGER as notifications_failed,
  sr.error_details,
  CASE 
    WHEN sr.status = 'completed' THEN 'Success'
    WHEN sr.status = 'failed' THEN 'Failed'
    WHEN sr.status = 'running' AND sr.started_at < NOW() - INTERVAL '30 minutes' THEN 'Timeout'
    ELSE 'Running'
  END as health_status
FROM scheduler_runs sr
WHERE sr.scheduler_type = 'booking_reminders'
ORDER BY sr.run_date DESC, sr.time_slot ASC;

-- Migration: Enhanced Booking Notifications System
-- Date: 2025-09-15
-- Description: Add tables and functions for booking reminder notifications

-- Create scheduler_runs table to track automated scheduler executions
CREATE TABLE IF NOT EXISTS scheduler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduler_type VARCHAR(50) NOT NULL,
  run_date DATE NOT NULL,
  target_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  dry_run BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  result_summary JSONB,
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for scheduler_runs
CREATE INDEX IF NOT EXISTS idx_scheduler_runs_type_date ON scheduler_runs(scheduler_type, run_date);
CREATE INDEX IF NOT EXISTS idx_scheduler_runs_status ON scheduler_runs(status);

-- Create booking_actions_log table to track user responses to notifications
CREATE TABLE IF NOT EXISTS booking_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL, -- 'confirm', 'decline', 'view'
  action_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'push_notification', 'web_app', 'mobile_app'
  response_time INTERVAL, -- Time taken to respond to notification
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for booking_actions_log
CREATE INDEX IF NOT EXISTS idx_booking_actions_log_student ON booking_actions_log(student_id);
CREATE INDEX IF NOT EXISTS idx_booking_actions_log_schedule ON booking_actions_log(schedule_id);
CREATE INDEX IF NOT EXISTS idx_booking_actions_log_action_date ON booking_actions_log(action_date);
CREATE INDEX IF NOT EXISTS idx_booking_actions_log_source ON booking_actions_log(source);

-- Update notifications table to support enhanced booking notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Create index for notification metadata
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);

-- Update push_subscriptions table to support better tracking
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for push subscription tracking
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used ON push_subscriptions(last_used_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_type ON push_subscriptions(user_type, is_active);

-- Function to get students eligible for booking reminders
CREATE OR REPLACE FUNCTION get_students_for_booking_reminders(target_date DATE)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  email VARCHAR,
  mobile VARCHAR,
  allocated_route_id UUID,
  boarding_point VARCHAR,
  boarding_stop VARCHAR,
  route_name VARCHAR,
  route_number VARCHAR,
  schedules_available JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.student_name,
    s.email,
    s.mobile,
    s.allocated_route_id,
    s.boarding_point,
    s.boarding_stop,
    r.route_name,
    r.route_number,
    COALESCE(
      json_agg(
        json_build_object(
          'schedule_id', sch.id,
          'departure_time', sch.departure_time,
          'available_seats', sch.available_seats,
          'booked_seats', sch.booked_seats
        )
      ) FILTER (WHERE sch.id IS NOT NULL),
      '[]'::json
    ) as schedules_available
  FROM students s
  JOIN routes r ON s.allocated_route_id = r.id
  LEFT JOIN schedules sch ON r.id = sch.route_id 
    AND sch.schedule_date = target_date
    AND sch.status = 'scheduled'
    AND sch.booking_enabled = true
    AND sch.admin_scheduling_enabled = true
    AND sch.available_seats > COALESCE(sch.booked_seats, 0)
  WHERE s.transport_enrolled = true
    AND r.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.student_id = s.id 
        AND b.trip_date = target_date
        AND b.status IN ('confirmed', 'pending')
    )
  GROUP BY s.id, s.student_name, s.email, s.mobile, s.allocated_route_id, 
           s.boarding_point, s.boarding_stop, r.route_name, r.route_number
  HAVING COUNT(sch.id) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to log booking reminder sent
CREATE OR REPLACE FUNCTION log_booking_reminder_sent(
  p_student_id UUID,
  p_schedule_id UUID,
  p_notification_id UUID,
  p_reminder_date DATE,
  p_delivery_method VARCHAR DEFAULT 'push_notification'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO booking_actions_log (
    id,
    student_id,
    schedule_id,
    action,
    action_date,
    source,
    metadata
  ) VALUES (
    gen_random_uuid(),
    p_student_id,
    p_schedule_id,
    'reminder_sent',
    p_reminder_date,
    p_delivery_method,
    json_build_object(
      'notification_id', p_notification_id,
      'sent_at', NOW()
    )
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get booking reminder statistics
CREATE OR REPLACE FUNCTION get_booking_reminder_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  reminders_sent INTEGER,
  confirmations INTEGER,
  declines INTEGER,
  no_response INTEGER,
  confirmation_rate DECIMAL,
  response_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH reminder_stats AS (
    SELECT 
      bal.action_date,
      COUNT(*) FILTER (WHERE bal.action = 'reminder_sent') as sent,
      COUNT(*) FILTER (WHERE bal.action = 'confirm') as confirmed,
      COUNT(*) FILTER (WHERE bal.action = 'decline') as declined
    FROM booking_actions_log bal
    WHERE bal.action_date BETWEEN start_date AND end_date
      AND bal.action IN ('reminder_sent', 'confirm', 'decline')
    GROUP BY bal.action_date
  )
  SELECT 
    rs.action_date as date,
    COALESCE(rs.sent, 0) as reminders_sent,
    COALESCE(rs.confirmed, 0) as confirmations,
    COALESCE(rs.declined, 0) as declines,
    GREATEST(0, COALESCE(rs.sent, 0) - COALESCE(rs.confirmed, 0) - COALESCE(rs.declined, 0)) as no_response,
    CASE 
      WHEN COALESCE(rs.sent, 0) > 0 
      THEN ROUND((COALESCE(rs.confirmed, 0)::DECIMAL / rs.sent) * 100, 2)
      ELSE 0
    END as confirmation_rate,
    CASE 
      WHEN COALESCE(rs.sent, 0) > 0 
      THEN ROUND(((COALESCE(rs.confirmed, 0) + COALESCE(rs.declined, 0))::DECIMAL / rs.sent) * 100, 2)
      ELSE 0
    END as response_rate
  FROM reminder_stats rs
  ORDER BY rs.action_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications and logs
CREATE OR REPLACE FUNCTION cleanup_old_booking_data(
  retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  notifications_deleted INTEGER,
  logs_deleted INTEGER,
  subscriptions_deleted INTEGER
) AS $$
DECLARE
  notif_count INTEGER := 0;
  log_count INTEGER := 0;
  sub_count INTEGER := 0;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Delete old booking notifications (except emergency ones)
  DELETE FROM notifications 
  WHERE created_at < cutoff_date
    AND category = 'booking'
    AND type != 'emergency';
  
  GET DIAGNOSTICS notif_count = ROW_COUNT;
  
  -- Delete old booking action logs
  DELETE FROM booking_actions_log 
  WHERE created_at < cutoff_date;
  
  GET DIAGNOSTICS log_count = ROW_COUNT;
  
  -- Delete inactive push subscriptions older than retention period
  DELETE FROM push_subscriptions 
  WHERE is_active = false 
    AND updated_at < cutoff_date;
  
  GET DIAGNOSTICS sub_count = ROW_COUNT;
  
  RETURN QUERY SELECT notif_count, log_count, sub_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update push subscription last_used_at
CREATE OR REPLACE FUNCTION update_push_subscription_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE push_subscriptions 
  SET last_used_at = NOW()
  WHERE user_id = NEW.specific_users->>0
    AND user_type = 'student'
    AND is_active = true
    AND NEW.enable_push_notification = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS trigger_update_push_subscription_last_used ON notifications;
CREATE TRIGGER trigger_update_push_subscription_last_used
  AFTER INSERT ON notifications
  FOR EACH ROW
  WHEN (NEW.enable_push_notification = true AND NEW.specific_users IS NOT NULL)
  EXECUTE FUNCTION update_push_subscription_last_used();

-- Insert sample notification settings for booking reminders
INSERT INTO admin_settings (setting_type, settings_data, created_at, updated_at)
VALUES (
  'booking_notifications',
  '{
    "enabled": true,
    "reminder_time": "19:00",
    "days_before": 1,
    "retry_failed": true,
    "max_retries": 3,
    "cleanup_after_days": 90,
    "notification_types": {
      "booking_reminder": true,
      "booking_confirmed": true,
      "booking_failed": true,
      "payment_reminder": true
    },
    "delivery_methods": {
      "push_notification": true,
      "email": false,
      "sms": false
    }
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (setting_type) DO UPDATE SET
  settings_data = EXCLUDED.settings_data,
  updated_at = NOW();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduler_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON booking_actions_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_booking_reminders(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION log_booking_reminder_sent(UUID, UUID, UUID, DATE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_reminder_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_booking_data(INTEGER) TO authenticated;

-- Create RLS policies for new tables
ALTER TABLE scheduler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_actions_log ENABLE ROW LEVEL SECURITY;

-- Policy for scheduler_runs (admin only)
CREATE POLICY "Admin can manage scheduler runs" ON scheduler_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin')
    )
  );

-- Policy for booking_actions_log (students can view their own, admins can view all)
CREATE POLICY "Students can view their booking actions" ON booking_actions_log
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM students s 
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all booking actions" ON booking_actions_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert booking actions" ON booking_actions_log
  FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE scheduler_runs IS 'Tracks automated scheduler executions for booking reminders';
COMMENT ON TABLE booking_actions_log IS 'Logs user responses to booking reminder notifications';
COMMENT ON FUNCTION get_students_for_booking_reminders(DATE) IS 'Returns students eligible for booking reminders on a given date';
COMMENT ON FUNCTION log_booking_reminder_sent(UUID, UUID, UUID, DATE, VARCHAR) IS 'Logs when a booking reminder is sent to a student';
COMMENT ON FUNCTION get_booking_reminder_stats(DATE, DATE) IS 'Returns statistics about booking reminder effectiveness';
COMMENT ON FUNCTION cleanup_old_booking_data(INTEGER) IS 'Cleans up old booking notifications and logs';

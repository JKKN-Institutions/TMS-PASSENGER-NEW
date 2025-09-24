-- Quick setup script for bug reporting tables
-- Run this if the migration hasn't been applied

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE bug_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bug_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'duplicate', 'wont_fix');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bug_category AS ENUM ('ui_bug', 'functional_bug', 'performance_issue', 'crash', 'security_issue', 'feature_request', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bug_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bug_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  category bug_category NOT NULL DEFAULT 'other',
  severity bug_severity NOT NULL DEFAULT 'medium',
  priority bug_priority NOT NULL DEFAULT 'normal',
  status bug_status NOT NULL DEFAULT 'open',
  
  -- Reporter information
  reporter_type VARCHAR(50) NOT NULL,
  reporter_id UUID NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  reporter_email VARCHAR(255) NOT NULL,
  
  -- System information
  browser_info JSONB,
  device_info JSONB,
  screen_resolution VARCHAR(50),
  user_agent TEXT,
  page_url TEXT,
  
  -- Assignment and tracking
  assigned_to UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  tags TEXT[],
  internal_notes TEXT,
  resolution_notes TEXT,
  estimated_effort INTEGER,
  actual_effort INTEGER
);

-- Create bug_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS bug_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID REFERENCES bug_reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  is_screenshot BOOLEAN DEFAULT false,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by_id UUID NOT NULL,
  uploaded_by_name VARCHAR(255) NOT NULL
);

-- Create bug_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS bug_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID REFERENCES bug_reports(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  
  -- Commenter information
  commenter_type VARCHAR(50) NOT NULL,
  commenter_id UUID NOT NULL,
  commenter_name VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter ON bug_reports(reporter_type, reporter_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_bug_attachments_bug_id ON bug_attachments(bug_report_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON bug_comments(bug_report_id);

-- Enable RLS if not already enabled
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_comments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (if they don't exist)
DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON bug_reports FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON bug_attachments FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON bug_comments FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create storage bucket if it doesn't exist (this needs to be done via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bug-attachments', 'bug-attachments', false) ON CONFLICT DO NOTHING;

-- Create a simple view for statistics
CREATE OR REPLACE VIEW bug_report_stats AS
SELECT 
  COUNT(*) as total_bugs,
  COUNT(*) FILTER (WHERE status = 'open') as open_bugs,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_bugs,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_bugs,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_bugs,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_bugs,
  COUNT(*) FILTER (WHERE severity = 'high') as high_severity_bugs,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_bugs,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at))/3600) as avg_resolution_time_hours
FROM bug_reports;

-- Grant necessary permissions (adjust as needed)
-- GRANT ALL ON bug_reports TO authenticated;
-- GRANT ALL ON bug_attachments TO authenticated;
-- GRANT ALL ON bug_comments TO authenticated;

-- GROFAST Schema Fix
-- Run this to fix/add missing tables and columns
-- This handles cases where tables might partially exist

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CLIENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  project_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_to UUID,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  is_client_of_month BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- ANNOUNCEMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  is_headline BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- LEAVE REQUESTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- PROJECTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID,
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#ef4444',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================

-- Employees columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
    ALTER TABLE employees ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'avatar_url') THEN
    ALTER TABLE employees ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'designation') THEN
    ALTER TABLE employees ADD COLUMN designation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_active') THEN
    ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Tasks columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'client_id') THEN
    ALTER TABLE tasks ADD COLUMN client_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
    ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'color') THEN
    ALTER TABLE tasks ADD COLUMN color TEXT DEFAULT '#ef4444';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
    ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID;
  END IF;
END $$;

-- Meetings columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'description') THEN
    ALTER TABLE meetings ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'attendees') THEN
    ALTER TABLE meetings ADD COLUMN attendees UUID[] DEFAULT '{}';
  END IF;
END $$;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Clients RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can view clients" ON clients;
CREATE POLICY "All users can view clients" ON clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- Announcements RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can view announcements" ON announcements;
CREATE POLICY "All users can view announcements" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- Leave Requests RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own leaves" ON leave_requests;
CREATE POLICY "Users can view own leaves" ON leave_requests
  FOR SELECT USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can create own leaves" ON leave_requests;
CREATE POLICY "Users can create own leaves" ON leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());
DROP POLICY IF EXISTS "Admins can update leaves" ON leave_requests;
CREATE POLICY "Admins can update leaves" ON leave_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can delete own leaves" ON leave_requests;
CREATE POLICY "Users can delete own leaves" ON leave_requests
  FOR DELETE USING (employee_id = auth.uid() AND status = 'pending');

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can view projects" ON projects;
CREATE POLICY "All users can view projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- INDEXES (safe to run multiple times)
-- =====================
CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at);

-- =====================
-- SAMPLE DATA (Optional - remove if not needed)
-- =====================

-- Insert a sample announcement
INSERT INTO announcements (title, content, is_active, is_headline)
VALUES ('Welcome to GROFAST!', 'Your team management system is now ready.', true, true)
ON CONFLICT DO NOTHING;

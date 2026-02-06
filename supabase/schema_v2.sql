-- GROFAST Team Management System V2
-- Enhanced Schema with Clients, Announcements, Leave Management
-- Run this AFTER the initial schema

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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  is_client_of_month BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- ANNOUNCEMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  is_headline BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- LEAVE REQUESTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'annual', 'emergency', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leaves" ON leave_requests
  FOR SELECT USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can create own leaves" ON leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Admins can update leaves" ON leave_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

-- =====================
-- UPDATE TASKS TABLE - Add more fields for Kanban
-- =====================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#ef4444';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- =====================
-- UPDATE EMPLOYEES TABLE - Add more fields
-- =====================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- =====================
-- PROJECTS TABLE (for organizing tasks)
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  color TEXT DEFAULT '#ef4444',
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- Add project_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_headline ON announcements(is_headline, created_at);

-- =====================
-- UPDATE MEETINGS TABLE - Add attendees and description
-- =====================
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS attendees UUID[] DEFAULT '{}';
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================
-- Enable Realtime for new tables
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- =====================
-- STORAGE BUCKETS (Run these in Supabase Dashboard > Storage)
-- =====================
-- Go to Supabase Dashboard > Storage > Create Bucket:
--
-- 1. Create bucket named: attendance-photos
--    - Public: false
--    - File size limit: 5MB
--    - Allowed MIME types: image/*
--
-- 2. Create bucket named: work-files
--    - Public: false
--    - File size limit: 10MB
--    - Allowed MIME types: *
--
-- Then add these policies via SQL Editor:

-- Storage policies for attendance-photos bucket
-- CREATE POLICY "Users can upload own attendance photos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own attendance photos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Admins can view all attendance photos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'attendance-photos' AND EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'admin'));

-- Storage policies for work-files bucket
-- CREATE POLICY "Users can upload work files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'work-files' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can view work files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'work-files' AND auth.uid() IS NOT NULL);

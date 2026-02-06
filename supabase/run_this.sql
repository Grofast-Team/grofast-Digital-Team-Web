-- GROFAST Complete Setup
-- Copy and paste this ENTIRE script into Supabase SQL Editor

-- =====================
-- PART 1: CREATE TABLES
-- =====================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  is_client_of_month BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_headline BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  leave_type TEXT DEFAULT 'casual',
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#ef4444',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PART 2: ADD MISSING COLUMNS (run each separately if errors)
-- =====================

-- Add columns to clients (if table existed before)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_client_of_month BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT;

-- Add columns to announcements (if table existed before)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_headline BOOLEAN DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add columns to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#ef4444';

-- Add columns to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================
-- PART 3: ROW LEVEL SECURITY
-- =====================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- =====================
-- PART 4: POLICIES
-- =====================

-- Clients policies
DROP POLICY IF EXISTS "clients_view" ON clients;
CREATE POLICY "clients_view" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "clients_admin" ON clients;
CREATE POLICY "clients_admin" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- Announcements policies
DROP POLICY IF EXISTS "announcements_view" ON announcements;
CREATE POLICY "announcements_view" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_admin" ON announcements;
CREATE POLICY "announcements_admin" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- Leave requests policies
DROP POLICY IF EXISTS "leaves_view" ON leave_requests;
CREATE POLICY "leaves_view" ON leave_requests FOR SELECT USING (
  employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "leaves_create" ON leave_requests;
CREATE POLICY "leaves_create" ON leave_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leaves_update" ON leave_requests;
CREATE POLICY "leaves_update" ON leave_requests FOR UPDATE USING (
  employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "leaves_delete" ON leave_requests;
CREATE POLICY "leaves_delete" ON leave_requests FOR DELETE USING (employee_id = auth.uid());

-- Projects policies
DROP POLICY IF EXISTS "projects_view" ON projects;
CREATE POLICY "projects_view" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "projects_admin" ON projects;
CREATE POLICY "projects_admin" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- PART 5: SAMPLE DATA
-- =====================

INSERT INTO announcements (title, content, is_active, is_headline)
SELECT 'Welcome to GROFAST!', 'Your team management system is ready.', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements LIMIT 1);

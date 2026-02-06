-- GROFAST RLS Policies
-- Run this AFTER schema_columns.sql

-- =====================
-- STEP 5: Enable RLS on tables
-- =====================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- =====================
-- STEP 6: Create Policies for clients
-- =====================
DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "clients_all" ON clients;
CREATE POLICY "clients_all" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- STEP 7: Create Policies for announcements
-- =====================
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_all" ON announcements;
CREATE POLICY "announcements_all" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- STEP 8: Create Policies for leave_requests
-- =====================
DROP POLICY IF EXISTS "leave_select" ON leave_requests;
CREATE POLICY "leave_select" ON leave_requests FOR SELECT USING (
  employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "leave_insert" ON leave_requests;
CREATE POLICY "leave_insert" ON leave_requests FOR INSERT WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "leave_update" ON leave_requests;
CREATE POLICY "leave_update" ON leave_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "leave_delete" ON leave_requests;
CREATE POLICY "leave_delete" ON leave_requests FOR DELETE USING (
  employee_id = auth.uid()
);

-- =====================
-- STEP 9: Create Policies for projects
-- =====================
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "projects_all" ON projects;
CREATE POLICY "projects_all" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

-- =====================
-- STEP 10: Create indexes
-- =====================
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

-- =====================
-- STEP 11: Insert sample announcement
-- =====================
INSERT INTO announcements (title, content, is_active, is_headline)
SELECT 'Welcome to GROFAST!', 'Your team management system is now ready.', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements LIMIT 1);

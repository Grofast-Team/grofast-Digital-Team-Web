-- GROFAST Team Management System
-- Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- EMPLOYEES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for employees
CREATE POLICY "Users can view all employees" ON employees
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert employees" ON employees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update employees" ON employees
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- ATTENDANCE TABLE
-- =====================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies for attendance
CREATE POLICY "Users can view own attendance" ON attendance
  FOR SELECT USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own attendance" ON attendance
  FOR UPDATE USING (employee_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- =====================
-- WORK UPDATES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS work_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hour TEXT NOT NULL,
  description TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE work_updates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own work updates" ON work_updates
  FOR SELECT USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own work updates" ON work_updates
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own work updates" ON work_updates
  FOR UPDATE USING (employee_id = auth.uid());

CREATE POLICY "Users can delete own work updates" ON work_updates
  FOR DELETE USING (employee_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE work_updates;

-- =====================
-- LEARNING UPDATES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS learning_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hour TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE learning_updates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own learning updates" ON learning_updates
  FOR SELECT USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own learning updates" ON learning_updates
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own learning updates" ON learning_updates
  FOR UPDATE USING (employee_id = auth.uid());

CREATE POLICY "Users can delete own learning updates" ON learning_updates
  FOR DELETE USING (employee_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE learning_updates;

-- =====================
-- CHANNELS TABLE (Chat)
-- =====================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'department' CHECK (type IN ('department', 'direct')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view channels
CREATE POLICY "Users can view channels" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage channels" ON channels
  FOR ALL USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

-- Insert default channels
INSERT INTO channels (name, type) VALUES
  ('General', 'department'),
  ('Announcements', 'department')
ON CONFLICT DO NOTHING;

-- =====================
-- MESSAGES TABLE (Chat)
-- =====================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================
-- MEETINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  meet_link TEXT,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendees UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view meetings" ON meetings
  FOR SELECT USING (true);

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update meetings" ON meetings
  FOR UPDATE USING (created_by = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;

-- =====================
-- TASKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (assigned_to = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- =====================
-- STORAGE BUCKETS
-- =====================
-- Run these in Storage section or via SQL:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-photos', 'attendance-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('work-files', 'work-files', true);

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_work_updates_employee_date ON work_updates(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_updates_employee_date ON learning_updates(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_meetings_datetime ON meetings(datetime);

-- =====================
-- FUNCTION: Create employee on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.employees (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create employee on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

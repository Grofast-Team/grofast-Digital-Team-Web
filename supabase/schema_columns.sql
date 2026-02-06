-- GROFAST Add Missing Columns
-- Run this AFTER schema_simple.sql
-- If any line fails, just skip it and continue

-- =====================
-- STEP 2: Add columns to employees table
-- =====================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- =====================
-- STEP 3: Add columns to tasks table
-- =====================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#ef4444';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID;

-- =====================
-- STEP 4: Add columns to meetings table
-- =====================
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;
-- Note: attendees might already exist, skip if error
-- ALTER TABLE meetings ADD COLUMN IF NOT EXISTS attendees UUID[] DEFAULT '{}';

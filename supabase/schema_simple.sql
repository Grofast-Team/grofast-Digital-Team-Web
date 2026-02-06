-- GROFAST Simple Schema Fix
-- Run this in Supabase SQL Editor
-- Execute each section one at a time if needed

-- =====================
-- STEP 1: Create Tables (run this first)
-- =====================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  project_name TEXT,
  status TEXT DEFAULT 'active',
  assigned_to UUID,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  is_client_of_month BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  is_headline BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type TEXT DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID,
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#ef4444',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

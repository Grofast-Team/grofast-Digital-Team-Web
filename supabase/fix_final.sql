-- Fix announcements table
-- The table has "message" column, not "content"

-- Add missing columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_headline BOOLEAN DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename message to content if needed, or just use message
-- First check if content exists, if not create it from message
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;

-- Copy message to content if content is empty
UPDATE announcements SET content = message WHERE content IS NULL AND message IS NOT NULL;

-- Make message nullable (remove NOT NULL constraint)
ALTER TABLE announcements ALTER COLUMN message DROP NOT NULL;

-- Insert sample announcement using the correct columns
INSERT INTO announcements (title, message, is_active, is_headline)
SELECT 'Welcome to GROFAST!', 'Your team management system is ready.', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Welcome to GROFAST!');

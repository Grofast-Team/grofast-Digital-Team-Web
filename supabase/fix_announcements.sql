-- Fix announcements table - add missing columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_headline BOOLEAN DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- If content was just added, update existing rows
UPDATE announcements SET content = title WHERE content IS NULL;

-- Now insert sample data
INSERT INTO announcements (title, content, is_active, is_headline)
SELECT 'Welcome to GROFAST!', 'Your team management system is ready.', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Welcome to GROFAST!');

-- Fix: Add foreign key on leave_requests.employee_id -> employees.id
-- This allows PostgREST to do automatic joins
ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id);

-- Fix: Add foreign key on leave_requests.approved_by -> employees.id
ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_approved_by_fkey;

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES employees(id);

-- Add direction column if not exists
ALTER TABLE deployment_requests
ADD COLUMN IF NOT EXISTS direction VARCHAR(30) NOT NULL DEFAULT 'coordinator_to_supervisor';

-- Add num_students column if not exists
ALTER TABLE deployment_requests
ADD COLUMN IF NOT EXISTS num_students INTEGER;

-- Drop old status constraint and add new one with 'fulfilled'
ALTER TABLE deployment_requests
DROP CONSTRAINT IF EXISTS deployment_requests_status_check;

ALTER TABLE deployment_requests
ADD CONSTRAINT deployment_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled'));

-- Drop old direction constraint and add new one
ALTER TABLE deployment_requests
DROP CONSTRAINT IF EXISTS deployment_requests_direction_check;

ALTER TABLE deployment_requests
ADD CONSTRAINT deployment_requests_direction_check
CHECK (direction IN ('coordinator_to_supervisor', 'supervisor_to_coordinator'));

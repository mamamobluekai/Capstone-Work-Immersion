CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coordinator', 'teacher', 'supervisor', 'student')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disapproved', 'coordinator_approved')),
  student_id VARCHAR(50),
  grade_level VARCHAR(20),
  strand VARCHAR(50),
  employee_id VARCHAR(50),
  department VARCHAR(100),
  company_name VARCHAR(255),
  designation VARCHAR(100),
  phone VARCHAR(20),
  school VARCHAR(255) DEFAULT 'Marinduque National High School',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  locked_until TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

-- Work Immersion assignments (coordinator -> teacher batches -> approved students)
CREATE TABLE IF NOT EXISTS teacher_batches (
  id SERIAL PRIMARY KEY,
  coordinator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_label VARCHAR(50) NOT NULL,
  max_students INTEGER NOT NULL CHECK (max_students > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (teacher_id, batch_label)
);

CREATE TABLE IF NOT EXISTS teacher_batch_students (
  id SERIAL PRIMARY KEY,
  teacher_batch_id INTEGER NOT NULL REFERENCES teacher_batches(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (teacher_batch_id, student_id)
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  suffix VARCHAR(20),
  gender VARCHAR(30),
  birthdate DATE,
  age INTEGER CHECK (age IS NULL OR age >= 0),
  contact_number VARCHAR(30),
  email VARCHAR(255),
  home_address TEXT,
  grade_level VARCHAR(20),
  section VARCHAR(100),
  track_strand VARCHAR(100),
  school VARCHAR(255),
  preferred_industry VARCHAR(100),
  preferred_company VARCHAR(255),
  career_goal TEXT,
  industry_reason TEXT,
  guardian_name VARCHAR(150),
  guardian_relationship VARCHAR(80),
  guardian_contact VARCHAR(30),
  guardian_email VARCHAR(255),
  guardian_address TEXT,
  emergency_contact VARCHAR(150),
  emergency_contact_number VARCHAR(30),
  academic_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  section VARCHAR(80) NOT NULL,
  required BOOLEAN DEFAULT true,
  allowed_extensions TEXT[] DEFAULT ARRAY['pdf','docx','jpg','jpeg','png'],
  max_size_mb INTEGER DEFAULT 10
);

INSERT INTO document_types (code, name, section)
VALUES
  ('guardian_consent', 'Signed Consent Form', 'guardian'),
  ('medical_certificate', 'Medical Certificate', 'medical'),
  ('accident_insurance', 'Accident Insurance', 'medical'),
  ('vaccination_record', 'Vaccination Record', 'medical'),
  ('emergency_contact_form', 'Emergency Contact Form', 'medical'),
  ('form_138', 'Form 138', 'academic'),
  ('good_moral', 'Good Moral Certificate', 'academic'),
  ('psa_birth_certificate', 'PSA Birth Certificate', 'academic'),
  ('id_picture', '2x2 ID Picture', 'academic'),
  ('student_profile_form', 'Student Profile Form', 'academic')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS student_requirement_submissions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending','Submitted','Under Review','Approved','Rejected','Needs Revision','Pending Review')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  coordinator_feedback TEXT,
  submitted_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_documents (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES student_requirement_submissions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type_id INTEGER REFERENCES document_types(id),
  document_name VARCHAR(150) NOT NULL,
  file_path TEXT NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(120),
  file_size INTEGER,
  status VARCHAR(30) DEFAULT 'Uploaded' CHECK (status IN ('Pending','Uploaded','Verified','Rejected')),
  remarks TEXT,
  verified_by INTEGER REFERENCES users(id),
  verified_date TIMESTAMP,
  uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submission_logs (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES student_requirement_submissions(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requirement_submissions_status ON student_requirement_submissions(status);
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);

CREATE TABLE IF NOT EXISTS deployment_requests (
  id SERIAL PRIMARY KEY,
  coordinator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_label VARCHAR(100) NOT NULL,
  strand VARCHAR(50),
  num_students INTEGER,
  notes TEXT,
  direction VARCHAR(30) NOT NULL DEFAULT 'coordinator_to_supervisor' CHECK (direction IN ('coordinator_to_supervisor', 'supervisor_to_coordinator')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_request_students (
  id SERIAL PRIMARY KEY,
  deployment_request_id INTEGER NOT NULL REFERENCES deployment_requests(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (deployment_request_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_deployment_requests_supervisor ON deployment_requests(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_coordinator ON deployment_requests(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_deployment_request_students_req ON deployment_request_students(deployment_request_id);

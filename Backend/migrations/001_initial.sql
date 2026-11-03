CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(120) NOT NULL,
  email varchar(254) NOT NULL,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('student','teacher','admin')),
  department_id uuid REFERENCES departments(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));
CREATE INDEX users_department_role_idx ON users(department_id, role) WHERE is_active=true;
CREATE TABLE student_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  cms_id varchar(40) NOT NULL UNIQUE,
  semester varchar(30) NOT NULL,
  section varchar(30) NOT NULL,
  phone varchar(30)
);
CREATE TABLE teacher_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT
);
CREATE TABLE admin_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  phone varchar(30)
);
CREATE TABLE staff_id_registry (
  staff_id varchar(40) PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT
);
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  description varchar(240),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment varchar(2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edit_count smallint NOT NULL DEFAULT 0 CHECK (edit_count BETWEEN 0 AND 3),
  UNIQUE(student_id, teacher_id),
  UNIQUE(id, teacher_id),
  CHECK(student_id <> teacher_id)
);
CREATE INDEX feedback_teacher_created_idx ON feedback(teacher_id, created_at DESC);
CREATE INDEX feedback_student_created_idx ON feedback(student_id, created_at DESC);
CREATE TABLE feedback_tags (
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE RESTRICT,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  PRIMARY KEY(feedback_id, tag_id)
);
CREATE TABLE teacher_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL UNIQUE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(feedback_id, teacher_id) REFERENCES feedback(id, teacher_id) ON DELETE RESTRICT,
  body varchar(2000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(length(trim(body)) > 0)
);
CREATE TABLE refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_sessions_user_idx ON refresh_sessions(user_id);
CREATE TABLE privileged_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  role varchar(20) NOT NULL CHECK(role IN ('teacher','admin')),
  department_id uuid NOT NULL REFERENCES departments(id),
  created_by uuid NOT NULL REFERENCES users(id),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action varchar(100) NOT NULL,
  target_type varchar(60),
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO tags(name, description) VALUES
 ('Punctuality','Arriving and beginning class on time'),
 ('Clarity of explanation','Explaining concepts in an understandable way'),
 ('Subject knowledge','Command of the subject'),
 ('Student engagement','Encouraging participation and engagement'),
 ('Assessment and feedback','Useful assessment and feedback'),
 ('Class preparation','Preparation and organization'),
 ('Fairness and consistency','Fair and consistent treatment'),
 ('Professional conduct','Professional classroom conduct')
ON CONFLICT(name) DO NOTHING;

-- Enforce the 1-6 tag cardinality at transaction commit, including direct SQL writes.
CREATE OR REPLACE FUNCTION enforce_feedback_tag_count() RETURNS trigger AS $$
DECLARE fid uuid; tag_count integer;
BEGIN
  IF TG_TABLE_NAME = 'feedback' THEN fid := NEW.id;
  ELSE fid := COALESCE(NEW.feedback_id, OLD.feedback_id);
  END IF;
  SELECT count(*) INTO tag_count FROM feedback_tags WHERE feedback_id = fid;
  IF tag_count < 1 OR tag_count > 6 THEN
    RAISE EXCEPTION 'Feedback must have between 1 and 6 tags' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER feedback_requires_tags
  AFTER INSERT ON feedback DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_feedback_tag_count();
CREATE CONSTRAINT TRIGGER feedback_tag_count_check
  AFTER INSERT OR UPDATE OR DELETE ON feedback_tags DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_feedback_tag_count();

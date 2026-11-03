-- Complete all schema changes on feedback_tags before backfilling rows.
-- PostgreSQL does not allow ALTER TABLE on a relation with pending trigger events.
ALTER TABLE feedback_tags ADD COLUMN IF NOT EXISTS rating smallint NOT NULL DEFAULT 3;
ALTER TABLE feedback_tags ALTER COLUMN rating SET DEFAULT 3;
ALTER TABLE feedback_tags DROP CONSTRAINT IF EXISTS feedback_tags_rating_check;
ALTER TABLE feedback_tags ADD CONSTRAINT feedback_tags_rating_check CHECK (rating BETWEEN 1 AND 5);

-- Preserve the existing overall feedback rating as the initial per-tag rating.
UPDATE feedback_tags ft
SET rating = f.rating
FROM feedback f
WHERE f.id = ft.feedback_id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_revoked boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS users_department_accounts_idx ON users(department_id,role,is_active,is_revoked);
CREATE OR REPLACE FUNCTION enforce_feedback_tag_count() RETURNS trigger AS $$
DECLARE fid uuid; tag_count integer;
BEGIN
 IF TG_TABLE_NAME='feedback' THEN fid:=NEW.id; ELSE fid:=COALESCE(NEW.feedback_id,OLD.feedback_id); END IF;
 SELECT count(*) INTO tag_count FROM feedback_tags WHERE feedback_id=fid;
 IF tag_count < 1 THEN RAISE EXCEPTION 'Feedback must have at least one tag' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$ LANGUAGE plpgsql;

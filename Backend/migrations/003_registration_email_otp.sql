-- Registration OTP storage. Also repairs older installations where this table
-- was created by an earlier version without all current columns.
CREATE TABLE IF NOT EXISTS registration_email_otps (
 id uuid DEFAULT gen_random_uuid(),
 email text,
 otp_hash text,
 expires_at timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 verified_at timestamptz,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS id uuid;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS otp_hash text;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
ALTER TABLE registration_email_otps ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE registration_email_otps SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE registration_email_otps SET attempts = 0 WHERE attempts IS NULL;
UPDATE registration_email_otps SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE registration_email_otps ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE registration_email_otps ALTER COLUMN id SET NOT NULL;
ALTER TABLE registration_email_otps ALTER COLUMN attempts SET DEFAULT 0;
ALTER TABLE registration_email_otps ALTER COLUMN attempts SET NOT NULL;
ALTER TABLE registration_email_otps ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE registration_email_otps ALTER COLUMN created_at SET NOT NULL;

-- A unique index is enough for current queries and works even if an older table
-- already has a different primary key.
CREATE UNIQUE INDEX IF NOT EXISTS registration_email_otps_id_uq ON registration_email_otps(id);
CREATE INDEX IF NOT EXISTS registration_email_otps_email_created_idx
 ON registration_email_otps(lower(email), created_at DESC);

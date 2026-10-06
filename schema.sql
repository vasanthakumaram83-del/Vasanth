CREATE TABLE IF NOT EXISTS daymark_users (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  salt text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS daymark_registration_lock (
  singleton integer PRIMARY KEY CHECK (singleton=1),
  claimed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS daymark_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES daymark_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS daymark_sessions_expiry_idx ON daymark_sessions(expires_at);
CREATE TABLE IF NOT EXISTS daymark_state (
  user_id text PRIMARY KEY REFERENCES daymark_users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS daymark_login_limits (
  key text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

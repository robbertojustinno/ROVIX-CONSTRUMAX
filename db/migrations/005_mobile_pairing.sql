CREATE TABLE IF NOT EXISTS mobile_pair_codes(
 id BIGSERIAL PRIMARY KEY,
 code_hash TEXT UNIQUE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 invalidated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mobile_devices(
 id BIGSERIAL PRIMARY KEY,
 device_id UUID UNIQUE NOT NULL,
 name VARCHAR(120) NOT NULL,
 token_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT true,
 paired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_seen_at TIMESTAMPTZ,
 last_ip VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS mobile_pair_state(
 id SMALLINT PRIMARY KEY DEFAULT 1 CHECK(id=1),
 code_hash TEXT,
 expires_at TIMESTAMPTZ,
 attempts INTEGER NOT NULL DEFAULT 0,
 selected_host VARCHAR(64),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO mobile_pair_state(id) VALUES(1) ON CONFLICT(id) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_mobile_devices_active ON mobile_devices(active);
CREATE INDEX IF NOT EXISTS idx_mobile_pair_codes_expiry ON mobile_pair_codes(expires_at);

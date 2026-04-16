-- Initial schema for PR Outreach Intelligence Platform
-- All 8 tables defined in the system design document

BEGIN;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. auth_sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                 SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ,
  user_agent         TEXT,
  ip_address         VARCHAR(45),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- 3. contacts
CREATE TABLE IF NOT EXISTS contacts (
  id                 SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               VARCHAR(255) NOT NULL,
  email              VARCHAR(255) NOT NULL,
  outlet             VARCHAR(255) NOT NULL DEFAULT '',
  topics             TEXT[] NOT NULL DEFAULT '{}',
  relationship_score INT NOT NULL DEFAULT 0,
  last_contacted_at  TIMESTAMPTZ,
  archived_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- 4. campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective   TEXT NOT NULL DEFAULT '',
  status      VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- 5. campaign_contacts
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id               SERIAL PRIMARY KEY,
  campaign_id      INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id       INT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'replied', 'opted_out')),
  assigned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_outreach_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_contact ON campaign_contacts(contact_id);

-- 6. interactions
CREATE TABLE IF NOT EXISTS interactions (
  id                  SERIAL PRIMARY KEY,
  user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id          INT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id         INT REFERENCES campaigns(id) ON DELETE SET NULL,
  direction           VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  channel             VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'note')),
  status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'failed', 'replied', 'archived')),
  subject             TEXT,
  content             TEXT NOT NULL,
  provider_message_id VARCHAR(255),
  external_thread_id  VARCHAR(255),
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_campaign_id ON interactions(campaign_id);

-- 7. ai_suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id       INT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id      INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'draft',
  model            VARCHAR(100),
  prompt_version   VARCHAR(50),
  used_at          TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);

-- 8. audit_events
CREATE TABLE IF NOT EXISTS audit_events (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   INT NOT NULL,
  action      VARCHAR(100) NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);

COMMIT;

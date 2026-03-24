-- ══════════════════════════════════════════════════════════════
--  WARPS — PostgreSQL Schema v6 (no seasons, no cached usd)
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CLANS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT          NOT NULL,
  emoji            TEXT          NOT NULL DEFAULT '⚔️',
  color            TEXT          NOT NULL DEFAULT '#7f1d1d',
  motto            TEXT,
  tg_group         TEXT,
  min_token_amount NUMERIC(20,0) NOT NULL DEFAULT 0,
  castle_config    JSONB         NOT NULL DEFAULT '{}',
  token_mint       TEXT,
  token_launch_tx  TEXT,
  cached_pnl_pct   NUMERIC(10,4) NOT NULL DEFAULT 0,
  pnl_updated_at   TIMESTAMPTZ,
  created_by       UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clans_token ON clans(token_mint);

-- ── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_did      TEXT        NOT NULL UNIQUE,
  email          TEXT        NOT NULL,
  wallet_address TEXT        NOT NULL UNIQUE,
  display_name   TEXT,
  avatar_emoji   TEXT        NOT NULL DEFAULT '🧑',
  clan_id        UUID        REFERENCES clans(id) ON DELETE SET NULL,
  clan_role      TEXT        CHECK (clan_role IN ('founder','member')),
  joined_clan_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clan   ON users(clan_id);
CREATE INDEX IF NOT EXISTS idx_users_privy  ON users(privy_did);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clan_founder') THEN
    ALTER TABLE clans ADD CONSTRAINT fk_clan_founder
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── LEADERBOARD VIEW ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_clan_leaderboard AS
SELECT
  c.id               AS clan_id,
  c.name,
  c.emoji,
  c.color,
  c.motto,
  c.token_mint,
  c.min_token_amount AS min_tokens_required,
  c.tg_group         AS telegram_group,
  c.cached_pnl_pct   AS total_pnl_pct,
  c.pnl_updated_at,
  c.castle_config,
  COUNT(u.id)        AS members
FROM clans c
LEFT JOIN users u ON u.clan_id = c.id
GROUP BY
  c.id, c.name, c.emoji, c.color, c.motto,
  c.token_mint, c.min_token_amount, c.tg_group,
  c.cached_pnl_pct, c.pnl_updated_at, c.castle_config
ORDER BY c.cached_pnl_pct DESC;

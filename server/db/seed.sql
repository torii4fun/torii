-- ══════════════════════════════════════════════════════════
--  WARPS — полный сброс и пересоздание схемы + seed
--  psql $DATABASE_URL -f server/db/reset_and_seed.sql
-- ══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Дропаем всё в правильном порядке
DROP VIEW  IF EXISTS v_clan_leaderboard CASCADE;
DROP TABLE IF EXISTS users   CASCADE;
DROP TABLE IF EXISTS clans   CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;

-- ── CLANS ──────────────────────────────────────────────────
CREATE TABLE clans (
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
CREATE INDEX idx_clans_token ON clans(token_mint);

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
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
CREATE INDEX idx_users_clan   ON users(clan_id);
CREATE INDEX idx_users_privy  ON users(privy_did);
CREATE INDEX idx_users_wallet ON users(wallet_address);

ALTER TABLE clans ADD CONSTRAINT fk_clan_founder
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ── LEADERBOARD VIEW ───────────────────────────────────────
CREATE VIEW v_clan_leaderboard AS
SELECT
  c.id               AS clan_id,
  c.name, c.emoji, c.color, c.motto,
  c.token_mint,
  c.min_token_amount AS min_tokens_required,
  c.tg_group         AS telegram_group,
  c.cached_pnl_pct   AS total_pnl_pct,
  c.pnl_updated_at,
  c.castle_config,
  COUNT(u.id)        AS members
FROM clans c
LEFT JOIN users u ON u.clan_id = c.id
GROUP BY c.id, c.name, c.emoji, c.color, c.motto,
         c.token_mint, c.min_token_amount, c.tg_group,
         c.cached_pnl_pct, c.pnl_updated_at, c.castle_config
ORDER BY c.cached_pnl_pct DESC;

-- ══════════════════════════════════════════════════════════
--  SEED DATA
-- ══════════════════════════════════════════════════════════

-- 2 обычных клана
INSERT INTO clans (id, name, emoji, color, motto, min_token_amount, tg_group, castle_config, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'Shadow Wolves', '🐺', '#1a1a2e', 'Hunt or be hunted', 0, 'shadowwolves_clan',
   '{"wallColor":"#1a1a2e","towerStyle":"round","sky":"#050508","stars":true,"torches":true,"flag":"🐺"}',
   NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000002',
   'Crystal Vanguard', '💎', '#0d3b5e', 'Diamond hands only', 0, 'crystalvanguard',
   '{"wallColor":"#0d3b5e","towerStyle":"square","sky":"#020d1a","stars":true,"torches":false,"flag":"💎"}',
   NOW() - INTERVAL '3 days');

-- Клан с реальными кошельками и token-gate
INSERT INTO clans (id, name, emoji, color, motto, min_token_amount, token_mint, castle_config, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Degen Alpha', '🔥', '#7f1d1d', 'Real wallets, real PnL',
  100,
  '6GbmkhRqVJMzMnst4wan2iDyZXzSajnMp3aM61jWLvdT',
  '{"wallColor":"#7f1d1d","towerStyle":"round","sky":"#0a0000","stars":true,"torches":true,"flag":"🔥"}',
  NOW() - INTERVAL '1 day'
);

-- Тестовые пользователи
INSERT INTO users (id, privy_did, email, wallet_address, display_name, avatar_emoji, clan_id, clan_role, joined_clan_at)
VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'test_user1', 'wolf1@test.com', 'So11111111111111111111111111111111111111112',
   'wolfalpha', '🐺', 'a1000000-0000-0000-0000-000000000001', 'founder', NOW() - INTERVAL '5 days'),
  ('b1000000-0000-0000-0000-000000000002',
   'test_user2', 'wolf2@test.com', 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
   'wolfbeta', '🌙', 'a1000000-0000-0000-0000-000000000001', 'member', NOW() - INTERVAL '4 days'),
  ('b1000000-0000-0000-0000-000000000003',
   'test_user3', 'wolf3@test.com', 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv',
   'wolfgamma', '🔥', 'a1000000-0000-0000-0000-000000000001', 'member', NOW() - INTERVAL '3 days'),
  ('b1000000-0000-0000-0000-000000000004',
   'test_user4', 'crystal1@test.com', 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
   'crystalking', '💎', 'a1000000-0000-0000-0000-000000000002', 'founder', NOW() - INTERVAL '3 days'),
  ('b1000000-0000-0000-0000-000000000005',
   'test_user5', 'crystal2@test.com', 'namesLPfeVpe8djHjPrFHEBS8aNgGCuBQzEHs8NZQYP',
   'crystalbeta', '✨', 'a1000000-0000-0000-0000-000000000002', 'member', NOW() - INTERVAL '2 days'),
  -- Реальные кошельки в Degen Alpha
  ('b1000000-0000-0000-0000-000000000007',
   'real_user1', 'real1@test.com', 'GdRSPexhxbQz5H2zFQrNN2BAZUqEjAULBigTPvQ6oDMP',
   'degen_alpha', '🦅', 'a1000000-0000-0000-0000-000000000003', 'founder', NOW() - INTERVAL '1 day'),
  ('b1000000-0000-0000-0000-000000000008',
   'real_user2', 'real2@test.com', '7H38hCPt5MMcHkyX3JaPnxy4fxYY4V5oVUj13RvoLe9r',
   'degen_beta', '🎯', 'a1000000-0000-0000-0000-000000000003', 'member', NOW() - INTERVAL '20 hours'),
  ('b1000000-0000-0000-0000-000000000009',
   'real_user3', 'real3@test.com', 'tQi75x9GeqsDeFdPVdwn6fwfiNLog53STe56Wjt4MVj',
   'degen_gamma', '💀', 'a1000000-0000-0000-0000-000000000003', 'member', NOW() - INTERVAL '10 hours');

-- Проставляем founders
UPDATE clans SET created_by = 'b1000000-0000-0000-0000-000000000001' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE clans SET created_by = 'b1000000-0000-0000-0000-000000000004' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE clans SET created_by = 'b1000000-0000-0000-0000-000000000007' WHERE id = 'a1000000-0000-0000-0000-000000000003';

-- Тестовый PnL
UPDATE clans SET cached_pnl_pct = 42.37,  pnl_updated_at = NOW() WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE clans SET cached_pnl_pct = -8.14,  pnl_updated_at = NOW() WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE clans SET cached_pnl_pct = 0,      pnl_updated_at = NOW() WHERE id = 'a1000000-0000-0000-0000-000000000003';

SELECT 'Schema + seed complete!' AS status;
SELECT c.name, c.emoji, c.token_mint, c.min_token_amount, c.cached_pnl_pct, COUNT(u.id) AS members
FROM clans c LEFT JOIN users u ON u.clan_id = c.id
GROUP BY c.id ORDER BY c.created_at;
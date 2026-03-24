import { Router } from 'express';
import { query, queryOne } from '../db/client';
import { getClanPnl } from '../lib/zerion';
import { meetsTokenRequirement } from '../lib/solanaTokenBalance';

const router = Router();

// ── GET /api/clans — leaderboard ─────────────────────────────────────────
router.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const rows = await query(`
      SELECT
        clan_id             AS "clanId",
        name, emoji, color, motto,
        token_mint          AS "tokenMint",
        min_tokens_required AS "minTokensRequired",
        telegram_group      AS "telegramGroup",
        total_pnl_pct       AS "totalPnlPct",
        pnl_updated_at      AS "pnlUpdatedAt",
        castle_config       AS "castleStyle",
        members
      FROM v_clan_leaderboard
    `);
    res.json(rows);
  } catch (e) {
    console.error('[GET /clans]', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ── GET /api/clans/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };

    const clan = await queryOne<any>(`
      SELECT
        c.id,
        c.name, c.emoji, c.color, c.motto,
        c.min_token_amount AS "minTokensRequired",
        c.tg_group         AS "telegramGroup",
        c.castle_config    AS "castleStyle",
        c.token_mint       AS "tokenMint",
        c.cached_pnl_pct   AS "cachedPnlPct",
        c.pnl_updated_at   AS "pnlUpdatedAt",
        c.created_at       AS "createdAt",
        c.created_by       AS "createdBy",
        u.wallet_address   AS "founderWallet",
        u.display_name     AS "founderName",
        (SELECT COUNT(*) FROM users WHERE clan_id = c.id)::int AS "members"
      FROM clans c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.id = $1
    `, [req.params.id]);

    if (!clan) return res.status(404).json({ error: 'Not found' });

    const isMember = userId
      ? !!(await queryOne(`SELECT id FROM users WHERE id=$1 AND clan_id=$2`, [userId, req.params.id]))
      : false;

    const memberList = isMember
      ? await query(`
          SELECT
            id,
            display_name   AS "displayName",
            wallet_address AS "walletAddress",
            avatar_emoji   AS "avatarEmoji",
            clan_role      AS "clanRole",
            last_seen_at   AS "lastSeenAt"
          FROM users WHERE clan_id=$1
          ORDER BY clan_role DESC, created_at ASC
        `, [req.params.id])
      : [];

    res.json({ ...clan, memberList, isMember });
  } catch (e) {
    console.error('[GET /clans/:id]', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ── POST /api/clans — create ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, emoji, color, motto, minTokensRequired, telegramGroup,
            castleStyle, userId, tokenMint } = req.body;

    if (!name || !userId)
      return res.status(400).json({ error: 'name and userId required' });

    const user = await queryOne<{ clan_id: string | null }>(
      `SELECT clan_id FROM users WHERE id=$1`, [userId]
    );
    if (user?.clan_id) return res.status(400).json({ error: 'Already in a clan' });

    const [clan] = await query<{ id: string }>(`
      INSERT INTO clans (name, emoji, color, motto, min_token_amount, tg_group, castle_config, token_mint, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `, [
      name, emoji ?? '⚔️', color ?? '#7f1d1d', motto ?? '',
      minTokensRequired ?? 0,
      telegramGroup ?? null,
      JSON.stringify(castleStyle ?? {}),
      tokenMint ?? null,
      userId,
    ]);

    await query(
      `UPDATE users SET clan_id=$1, clan_role='founder', joined_clan_at=NOW() WHERE id=$2`,
      [clan.id, userId]
    );

    res.json({ clanId: clan.id });
  } catch (e) {
    console.error('[POST /clans]', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ── GET /api/clans/:id/check — проверка баланса без вступления ───────────
router.get('/:id/check', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await queryOne<{ wallet_address: string }>(
      `SELECT wallet_address FROM users WHERE id=$1`, [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const clan = await queryOne<{ token_mint: string | null; min_token_amount: string }>(
      `SELECT token_mint, min_token_amount FROM clans WHERE id=$1`, [req.params.id]
    );
    if (!clan) return res.status(404).json({ error: 'Clan not found' });

    const required = parseFloat(clan.min_token_amount);

    if (!clan.token_mint || required === 0) {
      return res.json({ eligible: true, held: '0' });
    }

    const { ok, balance } = await meetsTokenRequirement(
      user.wallet_address, clan.token_mint, required
    ).catch(() => ({ ok: false, balance: 0 }));

    res.json({ eligible: ok, held: String(balance) });
  } catch (e) {
    console.error('[GET /clans/:id/check]', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ── POST /api/clans/:id/join — token-gated ────────────────────────────────
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await queryOne<{ clan_id: string | null; wallet_address: string }>(
      `SELECT clan_id, wallet_address FROM users WHERE id=$1`, [userId]
    );
    if (!user)        return res.status(404).json({ error: 'User not found' });
    if (user.clan_id) return res.status(400).json({ error: 'Already in a clan' });

    const clan = await queryOne<{ token_mint: string | null; min_token_amount: string }>(
      `SELECT token_mint, min_token_amount FROM clans WHERE id=$1`, [req.params.id]
    );
    if (!clan) return res.status(404).json({ error: 'Clan not found' });

    const required = parseFloat(clan.min_token_amount);

    if (!clan.token_mint || required === 0) {
      await query(
        `UPDATE users SET clan_id=$1, clan_role='member', joined_clan_at=NOW() WHERE id=$2`,
        [req.params.id, userId]
      );
      return res.json({ ok: true, message: 'Joined clan', held: '0' });
    }

    const { ok, balance } = await meetsTokenRequirement(
      user.wallet_address, clan.token_mint, required
    ).catch(() => ({ ok: false, balance: 0 }));

    if (!ok) {
      return res.status(403).json({
        ok: false,
        error: 'Insufficient tokens',
        message: `Need ${required.toLocaleString()} tokens. You hold ${balance.toLocaleString()}.`,
        required: String(required),
        held: String(balance),
      });
    }

    await query(
      `UPDATE users SET clan_id=$1, clan_role='member', joined_clan_at=NOW() WHERE id=$2`,
      [req.params.id, userId]
    );
    res.json({ ok: true, message: 'Joined clan', held: String(balance) });
  } catch (e) {
    console.error('[POST /clans/:id/join]', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ── GET /api/clans/:id/pnl ────────────────────────────────────────────────
router.get('/:id/pnl', async (req, res) => {
  try {
    const wallets = await query<{ wallet_address: string }>(
      `SELECT wallet_address FROM users WHERE clan_id=$1`, [req.params.id]
    );
    if (!wallets.length)
      return res.json({ totalPnlPct: 0, memberCount: 0, members: [] });

    const result = await getClanPnl(wallets.map(w => w.wallet_address));
    await query(
      `UPDATE clans SET cached_pnl_pct=$1, pnl_updated_at=NOW() WHERE id=$2`,
      [result.totalPnlPct, req.params.id]
    );
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: (e as Error).message });
  }
});

// ── DELETE /api/clans/:id/members/:memberId ───────────────────────────────
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { userId } = req.body;
    const isFounder = !!(await queryOne(
      `SELECT id FROM users WHERE id=$1 AND clan_id=$2 AND clan_role='founder'`,
      [userId, req.params.id]
    ));
    if (!isFounder) return res.status(403).json({ error: 'Founder only' });

    await query(
      `UPDATE users SET clan_id=NULL, clan_role=NULL WHERE id=$1 AND clan_id=$2 AND clan_role='member'`,
      [req.params.memberId, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
// PATCH /api/clans/:id/settings — founder updates clan settings
router.patch('/:id/settings', async (req, res) => {
  const { id } = req.params;
  const { telegramGroup, userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // Verify requester is the founder
    const rows = await query(
      `SELECT id FROM users WHERE id=$1 AND clan_id=$2 AND clan_role='founder'`,
      [userId, id]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Only the founder can edit clan settings' });
    }

    await query(
      `UPDATE clans SET tg_group=$1 WHERE id=$2`,
      [telegramGroup ?? null, id]
    );

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
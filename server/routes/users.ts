import { Router } from 'express';
import { query, queryOne } from '../db/client';
import { getWalletPnl } from '../lib/zerion';

const router = Router();

// ── POST /api/users/auth ───────────────────────────────────────────────────
router.post('/auth', async (req, res) => {
  const { privyDid, email, walletAddress, displayName } = req.body;
  if (!privyDid || !email || !walletAddress)
    return res.status(400).json({ error: 'privyDid, email and walletAddress required' });

  const user = await queryOne<any>(
    `INSERT INTO users (privy_did, email, wallet_address, display_name, last_seen_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (privy_did) DO UPDATE
       SET email = EXCLUDED.email,
           wallet_address = EXCLUDED.wallet_address,
           display_name = COALESCE($4, users.display_name),
           last_seen_at = NOW()
     RETURNING
       id,
       privy_did       AS "privyDid",
       email,
       wallet_address  AS "walletAddress",
       display_name    AS "displayName",
       avatar_emoji    AS "avatarEmoji",
       clan_id         AS "clanId",
       clan_role       AS "clanRole",
       created_at      AS "createdAt",
       last_seen_at    AS "lastSeenAt"`,
    [privyDid, email, walletAddress, displayName ?? email.split('@')[0]],
  );
  res.json(user);
});

// ── GET /api/users/:id/pnl ─────────────────────────────────────────────────
router.get('/:id/pnl', async (req, res) => {
  const user = await queryOne<{ wallet_address: string }>(
    `SELECT wallet_address FROM users WHERE id=$1`, [req.params.id],
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const pnl = await getWalletPnl(user.wallet_address);
    res.json(pnl);
  } catch (e) {
    res.status(502).json({ error: (e as Error).message });
  }
});

export default router;
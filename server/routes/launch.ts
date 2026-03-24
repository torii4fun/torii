import { Router } from 'express';
import { createTokenInfo, createFeeShareConfigForMint, createLaunchTransaction } from '../lib/bagsToken';
import { query, queryOne } from '../db/client';

const router = Router();

// ── POST /api/launch/token-info ─────────────────────────────────────────────
router.post('/token-info', async (req, res) => {
  const { name, ticker, description, imageBase64, imageType, twitter, telegram, website } = req.body;

  if (!name || !ticker || !description || !imageBase64) {
    const missing = ['name','ticker','description','imageBase64'].filter(k => !req.body[k]);
    return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  }

  try {
    const result = await createTokenInfo({
      name, ticker, description, imageBase64,
      imageType: imageType ?? 'image/png',
      twitter, telegram, website,
    });
    console.log('[launch/token-info] tokenMint:', result.tokenMint, '| tokenMetadata:', result.tokenMetadata);
    res.json(result);
  } catch (e) {
    console.error('[launch/token-info] error:', (e as Error).message);
    res.status(502).json({ error: (e as Error).message });
  }
});

// ── POST /api/launch/fee-share-config ──────────────────────────────────────
router.post('/fee-share-config', async (req, res) => {
  const { creatorWallet, tokenMint } = req.body;

  if (!creatorWallet || !tokenMint) {
    return res.status(400).json({ error: 'creatorWallet and tokenMint required' });
  }

  // Логируем входные данные для диагностики
  const platformWallet = process.env.VITE_PLATFORM_WALLET;
  console.log('[launch/fee-share-config] creatorWallet:', creatorWallet);
  console.log('[launch/fee-share-config] tokenMint:', tokenMint);
  console.log('[launch/fee-share-config] platformWallet (fee receiver):', platformWallet ?? 'NOT SET — falling back to creator');

  try {
    const result = await createFeeShareConfigForMint(creatorWallet, tokenMint);
    console.log('[launch/fee-share-config] configKey:', result.configKey, '| txs:', result.transactions.length);
    res.json({
      configKey:    result.configKey,
      transactions: result.transactions,
    });
  } catch (e) {
    console.error('[launch/fee-share-config] error:', (e as Error).message);
    res.status(502).json({ error: (e as Error).message });
  }
});

// ── POST /api/launch/transaction ───────────────────────────────────────────
router.post('/transaction', async (req, res) => {
  const { tokenMint, tokenMetadata, creatorWallet, configKey } = req.body;

  if (!tokenMint || !tokenMetadata || !creatorWallet || !configKey) {
    return res.status(400).json({ error: 'tokenMint, tokenMetadata, creatorWallet, configKey required' });
  }

  // Валидация configKey — должен быть валидным base58 PublicKey (~44 символа)
  if (typeof configKey !== 'string' || configKey.length < 32 || configKey.length > 50) {
    return res.status(400).json({ error: `Invalid configKey format: "${configKey}"` });
  }

  console.log('[launch/transaction] tokenMint:', tokenMint);
  console.log('[launch/transaction] tokenMetadata:', tokenMetadata);
  console.log('[launch/transaction] creatorWallet:', creatorWallet);
  console.log('[launch/transaction] configKey:', configKey);

  try {
    // createLaunchTransaction(tokenMint, tokenMetadata, creatorWallet, configKey)
    const result = await createLaunchTransaction(tokenMint, tokenMetadata, creatorWallet, configKey);
    console.log('[launch/transaction] tx built, length:', result.transaction.length);
    res.json(result);
  } catch (e) {
    console.error('[launch/transaction] error:', (e as Error).message);
    res.status(502).json({ error: (e as Error).message });
  }
});

// ── POST /api/launch/confirm ───────────────────────────────────────────────
router.post('/confirm', async (req, res) => {
  const { clanId, userId, mint, signature } = req.body;

  if (!clanId || !userId || !mint) {
    return res.status(400).json({ error: 'clanId, userId, mint required' });
  }

  const isFounder = !!(await queryOne(
    `SELECT id FROM users WHERE id=$1 AND clan_id=$2 AND clan_role='founder'`,
    [userId, clanId],
  ));

  if (!isFounder) return res.status(403).json({ error: 'Founder only' });

  await query(
    `UPDATE clans SET token_mint=$1, token_launch_tx=$2 WHERE id=$3`,
    [mint, signature ?? null, clanId],
  );

  console.log('[launch/confirm] clan', clanId, 'mint saved:', mint);
  res.json({ ok: true, mint });
});

export default router;
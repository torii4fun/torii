import { query } from '../db/client';
import { getClanPnl } from './zerion';

// 300 req/day лимит, макс 100 юзеров, 2 запуска/день = 200 req/день
const INTERVAL_MS    = 12 * 60 * 60_000; // каждые 12 часов
const WALLET_DELAY   = 1_000;             // 1 сек между кошельками
const CLAN_DELAY     = 3_000;             // 3 сек между кланами

export async function startPnlScheduler() {
  console.log('[PnL] Scheduler starting (Zerion, interval: 12h)...');
  // Первый запуск через 10 сек после старта
  setTimeout(() => refreshAllClans().catch(e => console.error('[PnL] initial run failed:', e.message)), 10_000);
  setInterval(() => refreshAllClans().catch(e => console.error('[PnL]', e.message)), INTERVAL_MS);
}

export async function refreshAllClans() {
  const clans = await query<{ id: string }>(`SELECT id FROM clans`).catch(() => [] as { id: string }[]);
  if (!clans.length) return;
  console.log(`[PnL] Refreshing ${clans.length} clan(s)...`);

  for (const { id } of clans) {
    try {
      const wallets = await query<{ wallet_address: string }>(
        `SELECT wallet_address FROM users WHERE clan_id=$1`, [id]
      );
      if (!wallets.length) continue;

      const result = await getClanPnl(wallets.map(w => w.wallet_address), WALLET_DELAY);
      await query(
        `UPDATE clans SET cached_pnl_pct=$1, pnl_updated_at=NOW() WHERE id=$2`,
        [result.totalPnlPct, id]
      );
      console.log(`[PnL] clan ${id.slice(0, 8)}: ${result.totalPnlPct.toFixed(2)}% (${wallets.length} wallets)`);
    } catch (e) {
      console.error(`[PnL] clan ${id.slice(0, 8)} failed:`, (e as Error).message);
    }
    await new Promise(r => setTimeout(r, CLAN_DELAY));
  }
}
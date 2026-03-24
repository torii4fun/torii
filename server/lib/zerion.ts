import 'dotenv/config';

const BASE    = 'https://api.zerion.io/v1';
const API_KEY = process.env.ZERION_API_KEY ?? '';

if (!API_KEY) console.warn('[Zerion] ⚠️  ZERION_API_KEY not set');
else console.log('[Zerion] API key loaded:', API_KEY.slice(0, 8) + '...');

// Zerion auth: Basic base64(API_KEY + ":")
function authHeader() {
  return 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64');
}

async function zerionGet<T>(path: string, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Authorization': authHeader(),
        'Accept':        'application/json',
      },
    });

    if (res.status === 401) throw new Error('Zerion: Invalid API key');
    if (res.status === 429) throw new Error('Zerion: Rate limited');
    if (res.status === 404) throw new Error('Zerion: Wallet not found');
    if (res.status === 503) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? 5);
      const wait = retryAfter * 1000;
      console.warn(`[Zerion] 503 on attempt ${attempt}/${retries}, retrying in ${retryAfter}s...`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw new Error('Zerion: Service unavailable after retries');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Zerion ${res.status}: ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }
  throw new Error('Zerion: max retries exceeded');
}

// ── Types ─────────────────────────────────────────────────────

interface ZerionPnlResponse {
  data: {
    type: string;
    id:   string;
    attributes: {
      total_gain:                       number | null;
      realized_gain:                    number | null;
      unrealized_gain:                  number | null;
      relative_total_gain_percentage:   number | null;
      relative_realized_gain_percentage: number | null;
      total_invested:                   number | null;
      net_invested:                     number | null;
    };
  };
}

export interface WalletPnlResult {
  wallet:   string;
  pnlUsd:   number;
  pnlPct:   number;
  netWorth: number;
}

export interface ClanPnlResult {
  totalPnlUsd:   number;
  totalPnlPct:   number;
  totalNetWorth: number;
  memberCount:   number;
  members:       WalletPnlResult[];
}

// ── Single wallet PnL ─────────────────────────────────────────
// GET /v1/wallets/{address}/pnl

export async function getWalletPnl(wallet: string): Promise<WalletPnlResult> {
  const json = await zerionGet<ZerionPnlResponse>(
    `/wallets/${wallet}/pnl/?currency=usd`
  );

  const attrs = json.data.attributes;

  const pnlPct   = Number(attrs.relative_total_gain_percentage ?? 0);
  const pnlUsd   = Number(attrs.total_gain                     ?? 0);
  const netWorth = Number(attrs.net_invested                   ?? 0) + pnlUsd;

  return { wallet, pnlUsd, pnlPct, netWorth };
}

// ── Clan PnL — последовательные запросы ───────────────────────

export async function getClanPnl(wallets: string[], walletDelayMs = 1000): Promise<ClanPnlResult> {
  if (!wallets.length) {
    return { totalPnlUsd: 0, totalPnlPct: 0, totalNetWorth: 0, memberCount: 0, members: [] };
  }

  const results: WalletPnlResult[] = [];

  for (const wallet of wallets) {
    console.log(`[Zerion] Fetching PnL for ${wallet.slice(0, 8)}...`);
    try {
      const result = await getWalletPnl(wallet);
      results.push(result);
      console.log(`[Zerion] ✅ ${wallet.slice(0, 8)}: pnlPct=${result.pnlPct.toFixed(2)}% | pnlUsd=$${result.pnlUsd.toFixed(2)}`);
    } catch (e) {
      console.warn(`[Zerion] ❌ ${wallet.slice(0, 8)}:`, (e as Error).message);
      results.push({ wallet, pnlUsd: 0, pnlPct: 0, netWorth: 0 });
    }
    // Задержка между запросами чтобы не словить rate limit
    await new Promise(r => setTimeout(r, walletDelayMs));
  }

  const totalPnlUsd   = results.reduce((s, r) => s + r.pnlUsd, 0);
  const totalNetWorth = results.reduce((s, r) => s + r.netWorth, 0);
  const totalPnlPct   = results.reduce((s, r) => s + r.pnlPct, 0);

  return { totalPnlUsd, totalPnlPct, totalNetWorth, memberCount: results.length, members: results };
}
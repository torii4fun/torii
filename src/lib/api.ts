import type { User, Clan, LeaderboardClan, ClanPnl, WalletPnl, JoinResult } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? res.statusText), { status: res.status, data: err });
  }
  return res.json();
}

export const authUser = (body: {
  privyDid:      string;
  email:         string;
  walletAddress: string;
  displayName?:  string;
}) => req<User>('/api/users/auth', { method: 'POST', body: JSON.stringify(body) });

export const getUserPnl     = (userId: string) => req<WalletPnl>(`/api/users/${userId}/pnl`);
export const getLeaderboard = ()                => req<LeaderboardClan[]>('/api/clans');

export const getClan = (clanId: string, userId?: string) =>
  req<Clan>(`/api/clans/${clanId}${userId ? `?userId=${userId}` : ''}`);

export const getClanPnl = (clanId: string) =>
  req<ClanPnl>(`/api/clans/${clanId}/pnl`);

export const createClan = (body: {
  userId:            string;
  name:              string;
  emoji:             string;
  color:             string;
  motto:             string;
  minTokensRequired: number;
  telegramGroup:     string;
  castleStyle:       object;
  tokenMint?:        string;
}) => req<{ clanId: string }>('/api/clans', { method: 'POST', body: JSON.stringify(body) });

export const joinClan = (clanId: string, userId: string) =>
  req<JoinResult>(`/api/clans/${clanId}/join`, { method: 'POST', body: JSON.stringify({ userId }) });

export const checkClanEligibility = (clanId: string, userId: string) =>
  req<{ eligible: boolean; held: string }>(`/api/clans/${clanId}/check?userId=${userId}`, { method: 'GET' });

export const kickMember = (clanId: string, memberId: string, userId: string) =>
  req<{ ok: boolean }>(`/api/clans/${clanId}/members/${memberId}`, {
    method: 'DELETE', body: JSON.stringify({ userId }),
  });

// ── Launch API ────────────────────────────────────────────────

// Step 1: Upload token metadata → get tokenMint + tokenMetadata
export const uploadTokenInfo = (body: {
  name:        string;
  ticker:      string;
  description: string;
  imageBase64: string;
  imageType:   string;
  twitter?:    string;
  telegram?:   string;
  website?:    string;
}) => req<{ tokenMint: string; tokenMetadata: string }>('/api/launch/token-info', {
  method: 'POST', body: JSON.stringify(body),
});

// Step 2: Create fee share config via SDK → returns configKey + unsigned txs for Privy
export const getFeeShareConfig = (body: {
  creatorWallet: string;
  tokenMint:     string;
}) => req<{
  configKey:    string;
  transactions: string[]; // base58 unsigned VersionedTransactions
}>('/api/launch/fee-share-config', { method: 'POST', body: JSON.stringify(body) });

// Step 3: Build launch transaction via SDK → returns unsigned tx for Privy
export const buildLaunchTx = (body: {
  tokenMint:     string;
  tokenMetadata: string;
  creatorWallet: string;
  configKey:     string;
}) => req<{ transaction: string; tokenMint: string }>('/api/launch/transaction', {
  method: 'POST', body: JSON.stringify(body),
});

// Step 3: Save mint to clan after on-chain confirmation
export const confirmLaunch = (body: {
  clanId:    string;
  userId:    string;
  mint:      string;
  signature: string;
}) => req<{ ok: boolean }>('/api/launch/confirm', {
  method: 'POST', body: JSON.stringify(body),
});
export async function updateClanSettings(clanId: string, userId: string, data: { telegramGroup?: string }) {
  const res = await fetch(`/api/clans/${clanId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
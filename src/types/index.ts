// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id:            string;
  privyDid:      string;
  email:         string;
  displayName:   string;
  avatarEmoji:   string;
  walletAddress: string;
  clanId:        string | null;
  clanRole:      'founder' | 'member' | null;
  createdAt:     string;
  lastSeenAt:    string;
}

// ── Castle ───────────────────────────────────────────────────────────────────
export interface CastleStyle {
  wallColor:  string;
  towerStyle: 'square' | 'round' | 'spiral';
  sky:        string;
  stars:      boolean;
  torches:    boolean;
  flag:       string;
}

// ── Clan ─────────────────────────────────────────────────────────────────────
export interface Clan {
  id:                string;
  name:              string;
  emoji:             string;
  color:             string;
  motto:             string;
  minTokensRequired: number;
  telegramGroup:     string | null;
  castleStyle:       CastleStyle;
  tokenMint:         string | null;
  createdBy:         string | null;
  founderName:       string | null;
  founderWallet:     string | null;
  cachedPnlPct:      number;
  pnlUpdatedAt:      string | null;
  members:           number;
  createdAt:         string;
  memberList?:       ClanMember[];
  isMember?:         boolean;
}

// ── Leaderboard row ──────────────────────────────────────────────────────────
export interface LeaderboardClan {
  clanId:            string;
  name:              string;
  emoji:             string;
  color:             string;
  motto:             string;
  tokenMint:         string | null;
  minTokensRequired: number;
  telegramGroup:     string | null;
  totalPnlPct:       number;
  pnlUpdatedAt:      string | null;
  castleStyle:       CastleStyle;
  members:           number;
}

// ── Clan Member ──────────────────────────────────────────────────────────────
export interface ClanMember {
  id:            string;
  displayName:   string;
  walletAddress: string;
  avatarEmoji:   string;
  clanRole:      'founder' | 'member';
  lastSeenAt:    string;
}

// ── PnL ──────────────────────────────────────────────────────────────────────
export interface WalletPnl {
  wallet:   string;
  pnlUsd:   number;
  pnlPct:   number;
  netWorth: number;
}

export interface ClanPnl {
  totalPnlPct:  number;
  memberCount:  number;
  members:      WalletPnl[];
}

// ── Token Join ───────────────────────────────────────────────────────────────
export interface JoinResult {
  ok:        boolean;
  message:   string;
  required?: string;
  held?:     string;
}

// ── Create Clan Wizard State ─────────────────────────────────────────────────
export interface CreateClanState {
  step:        0 | 1 | 2 | 3;
  name:        string;
  emoji:       string;
  color:       string;
  motto:       string;
  minTokens:   number;
  telegram:    string;
  wallColor:   string;
  towerStyle:  'square' | 'round' | 'spiral';
  sky:         string;
  stars:       boolean;
  torches:     boolean;
  flag:        string;
  tokenName:   string;
  ticker:      string;
  description: string;
  imageUrl:    string | null;
  imageType:   string;
  twitter:     string;
  initBuy:     number;
  launchStep:  number;
  mintAddress: string | null;
  launching:   boolean;
}

export const defaultCreateState = (): CreateClanState => ({
  step: 0,
  name: '', emoji: '⚔️', color: '#7f1d1d', motto: '',
  minTokens: 1000, telegram: '',
  wallColor: '#4a4a4a', towerStyle: 'square', sky: '#050508',
  stars: true, torches: true, flag: '⚔️',
  tokenName: '', ticker: '', description: '',
  imageUrl: null, imageType: 'image/png',
  twitter: '', initBuy: 0,
  launchStep: 0, mintAddress: null, launching: false,
});

// ── Toast ────────────────────────────────────────────────────────────────────
export interface Toast {
  id:      string;
  message: string;
}

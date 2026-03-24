// PostgreSQL returns NUMERIC as strings — always coerce to Number first

export const fmtPct = (p: any) => {
  const n = Number(p ?? 0);
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
};

export const fmtUsd = (u: any) => {
  const n = Number(u ?? 0);
  const abs = Math.abs(n);
  const formatted = abs >= 1_000_000
    ? (abs / 1_000_000).toFixed(2) + 'M'
    : abs >= 1_000
    ? (abs / 1_000).toFixed(1) + 'K'
    : abs.toFixed(0);
  return (n >= 0 ? '+' : '-') + '$' + formatted;
};

export const fmtTok = (n: any) => {
  const num = Number(n ?? 0);
  return num >= 1_000_000 ? (num / 1_000_000).toFixed(1) + 'M'
    : num >= 1_000 ? (num / 1_000).toFixed(0) + 'K'
    : String(Math.floor(num));
};

export const fmtWallet = (addr: string, len = 4) =>
  addr?.length > len * 2 + 3
    ? addr.slice(0, len) + '…' + addr.slice(-len)
    : addr ?? '';

export const fmtTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
};

export const secondsUntil = (isoDate: string): number =>
  Math.max(0, Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000));

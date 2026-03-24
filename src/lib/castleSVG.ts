import type { CastleStyle } from '../types';

export function buildCastleSVG(cs: CastleStyle, emoji: string): string {
  const w = cs.wallColor;
  const w2 = w + 'cc';
  const w3 = w + '55';
  const t = cs.towerStyle;

  const tower = (x: number, y: number, wd: number, tl: number): string => {
    if (t === 'round') {
      const cx = x + wd / 2;
      const merlons = [0,1,2,3].map(i =>
        `<rect x="${x + i*9}" y="${y-14}" width="7" height="12" rx="2" fill="${w}"/>`).join('');
      return `<rect x="${x}" y="${y}" width="${wd}" height="${tl}" fill="${w2}" stroke="${w}" stroke-width="1.5"/>
        ${merlons}
        <circle cx="${cx}" cy="${y + tl * 0.35}" r="${wd * 0.27}" fill="#0a0a0a" stroke="${w}" stroke-width="1.5"/>`;
    }
    if (t === 'spiral') {
      const cx = x + wd / 2;
      return `<rect x="${x}" y="${y}" width="${wd}" height="${tl}" fill="${w2}" stroke="${w}" stroke-width="1.5"/>
        <path d="M${cx} ${y-16} Q${cx+10} ${y-10} ${cx} ${y}" fill="${w}"/>
        <circle cx="${cx}" cy="${y + tl * 0.35}" r="${wd * 0.27}" fill="#0a0a0a" stroke="${w}" stroke-width="1.5"/>`;
    }
    // square (default)
    const colW = Math.floor(wd / 4);
    const merlons = [0,1,2,3].map(i =>
      `<rect x="${x + i*colW}" y="${y-14}" width="${colW-2}" height="12" rx="1" fill="${w}"/>`).join('');
    return `<rect x="${x}" y="${y}" width="${wd}" height="${tl}" rx="2" fill="${w2}" stroke="${w}" stroke-width="1.5"/>
      ${merlons}
      <rect x="${x + wd*0.28}" y="${y + tl*0.28}" width="${wd*0.44}" height="${tl*0.42}" rx="${wd*0.22}" fill="#0a0a0a" stroke="${w}" stroke-width="1.2"/>`;
  };

  const torches = cs.torches
    ? `<rect x="54" y="243" width="5" height="18" rx="1.5" fill="#555"/>
       <ellipse cx="56" cy="242" rx="5" ry="7" fill="#f59e0b" opacity=".95"/>
       <rect x="177" y="243" width="5" height="18" rx="1.5" fill="#555"/>
       <ellipse cx="179" cy="242" rx="5" ry="7" fill="#f59e0b" opacity=".95"/>`
    : '';

  const windowDots = [
    {x:97, y:97}, {x:143, y:97},
  ].map(p =>
    `<ellipse cx="${p.x}" cy="${p.y}" rx="8" ry="10" fill="#0a0a0a" stroke="${w}" stroke-width="1"/>`
  ).join('');

  const mainMerlons = [0,1,2,3,4,5].map(i =>
    `<rect x="${68 + i*17}" y="44" width="14" height="18" rx="2" fill="${w}"/>`).join('');

  const wallMerlons = [0,1,2,3,4,5,6,7].map(i =>
    `<rect x="${18 + i*26}" y="144" width="18" height="18" rx="2" fill="${w}"/>`).join('');

  return `<svg viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="120" cy="268" rx="102" ry="16" fill="${w3}"/>
    <rect x="18" y="158" width="204" height="120" rx="3" fill="${w2}" stroke="${w}" stroke-width="2"/>
    ${wallMerlons}
    ${tower(8, 88, 64, 182)}
    ${tower(168, 88, 64, 182)}
    <rect x="68" y="58" width="104" height="222" rx="3" fill="${w}" stroke="${w}" stroke-width="2"/>
    ${mainMerlons}
    ${windowDots}
    <path d="M100 280 L100 188 Q120 165 140 188 L140 280 Z" fill="#0a0a0a" stroke="${w3}" stroke-width="1.5"/>
    <line x1="120" y1="6" x2="120" y2="46" stroke="${w}" stroke-width="2.5"/>
    <text x="120" y="42" text-anchor="middle" font-size="28">${cs.flag || emoji}</text>
    ${torches}
  </svg>`;
}

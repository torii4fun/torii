interface ToriiGateProps {
  color:     string;   // clan color — tints the gate
  emoji:     string;   // clan emoji on the gate
  sky?:      string;   // background sky color
}

export function ToriiGate({ color, emoji, sky = '#fce4ec' }: ToriiGateProps) {
  // Derive gate color from clan color but shift towards red/pink torii palette
  const gateColor = color;

  return (
    <svg
      viewBox="0 0 240 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="gateGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gateColor} />
          <stop offset="100%" stopColor={gateColor + 'bb'} />
        </linearGradient>
        <filter id="gateShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor={gateColor} floodOpacity="0.25"/>
        </filter>
        {/* Reflection blur */}
        <linearGradient id="reflGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gateColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gateColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="240" height="220" fill="url(#skyGrad)" />

      {/* Distant hills / mist */}
      <ellipse cx="60"  cy="170" rx="80"  ry="40" fill={gateColor} opacity="0.08" />
      <ellipse cx="180" cy="175" rx="90"  ry="35" fill={gateColor} opacity="0.06" />
      <ellipse cx="120" cy="180" rx="120" ry="30" fill={gateColor} opacity="0.05" />

      {/* Water / ground */}
      <rect x="0" y="185" width="240" height="35" fill={gateColor} opacity="0.07" rx="2" />

      {/* ── Gate structure ── */}
      {/* Left pillar */}
      <rect x="52"  y="80"  width="16" height="110" fill="url(#gateGrad)" rx="2" filter="url(#gateShadow)" />
      {/* Right pillar */}
      <rect x="172" y="80"  width="16" height="110" fill="url(#gateGrad)" rx="2" filter="url(#gateShadow)" />

      {/* Base footings */}
      <rect x="46"  y="182" width="28" height="10" fill={gateColor} rx="2" opacity="0.8" />
      <rect x="166" y="182" width="28" height="10" fill={gateColor} rx="2" opacity="0.8" />

      {/* Lower crossbeam (nuki) */}
      <rect x="44"  y="110" width="152" height="10" fill={gateColor} rx="2" />

      {/* Upper crossbeam (kasagi) — curved top */}
      <path
        d="M28,78 Q120,58 212,78 L212,68 Q120,46 28,68 Z"
        fill={gateColor}
        filter="url(#gateShadow)"
      />

      {/* Kasagi end caps (curved up) */}
      <ellipse cx="28"  cy="73" rx="8" ry="5" fill={gateColor} />
      <ellipse cx="212" cy="73" rx="8" ry="5" fill={gateColor} />

      {/* Shimagi (second beam) */}
      <rect x="44" y="82" width="152" height="8" fill={gateColor} opacity="0.85" rx="1" />

      {/* Clan emoji on gate center */}
      <text
        x="120" y="102"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        style={{ userSelect: 'none' }}
      >{emoji}</text>

      {/* Water reflection (blurred, flipped) */}
      <g opacity="0.18" transform="translate(0,370) scale(1,-1)">
        <rect x="52"  y="80"  width="16" height="100" fill={gateColor} rx="2" />
        <rect x="172" y="80"  width="16" height="100" fill={gateColor} rx="2" />
        <rect x="44"  y="82"  width="152" height="8"  fill={gateColor} rx="1" />
      </g>

      {/* Cherry blossom petals floating */}
      {[
        { cx: 35,  cy: 60,  r: 4 },
        { cx: 190, cy: 50,  r: 3 },
        { cx: 155, cy: 40,  r: 3.5 },
        { cx: 75,  cy: 45,  r: 3 },
        { cx: 205, cy: 90,  r: 2.5 },
        { cx: 20,  cy: 100, r: 3 },
      ].map((p, i) => (
        <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.r} ry={p.r * 0.7}
          fill={gateColor} opacity="0.35"
          transform={`rotate(${i * 30} ${p.cx} ${p.cy})`}
        />
      ))}
    </svg>
  );
}
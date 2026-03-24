import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface Props {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: Props) {
  const { login } = usePrivy();
  const [slashing, setSlashing] = useState(false);

  function slash(cb: () => void) {
    setSlashing(true);
    setTimeout(cb, 700);
  }

  function handleSignIn() { slash(() => login()); }

  function handleExplore() {
    slash(() => { localStorage.setItem('warps_seen_landing', '1'); onEnter(); });
  }

  return (
    <div className={slashing ? 'landing-root slashing' : 'landing-root'}>
      {slashing && (
        <div className="slash-overlay" aria-hidden="true">
          <svg className="slash-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line className="slash-line" x1="110" y1="-10" x2="-10" y2="110" />
          </svg>
          <div className="slash-half slash-half-l" />
          <div className="slash-half slash-half-r" />
        </div>
      )}
      {/* Floating petals */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="landing-petal"
          style={{
            left:             `${8 + i * 7.5}%`,
            animationDelay:   `${i * 0.6}s`,
            animationDuration:`${4 + (i % 3)}s`,
            width:            `${5 + (i % 3) * 2}px`,
            height:           `${5 + (i % 3) * 2}px`,
          }}
        />
      ))}

      {/* Gate illustration */}
      <div className="landing-gate">
        <svg viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fff5f7" />
              <stop offset="100%" stopColor="#fce4ec" />
            </linearGradient>
            <linearGradient id="lGate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#e91e8c" />
              <stop offset="100%" stopColor="#f06292" />
            </linearGradient>
            <filter id="lShadow">
              <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#e91e8c" floodOpacity="0.2"/>
            </filter>
          </defs>
          <rect width="300" height="260" fill="url(#lSky)" />
          {/* Mist hills */}
          <ellipse cx="75"  cy="210" rx="100" ry="50" fill="#e91e8c" opacity="0.06" />
          <ellipse cx="225" cy="215" rx="110" ry="45" fill="#e91e8c" opacity="0.05" />
          <ellipse cx="150" cy="225" rx="150" ry="40" fill="#e91e8c" opacity="0.04" />
          {/* Water */}
          <rect x="0" y="228" width="300" height="32" fill="#e91e8c" opacity="0.06" />
          {/* Left pillar */}
          <rect x="60"  y="90"  width="20" height="140" fill="url(#lGate)" rx="3" filter="url(#lShadow)" />
          {/* Right pillar */}
          <rect x="220" y="90"  width="20" height="140" fill="url(#lGate)" rx="3" filter="url(#lShadow)" />
          {/* Footings */}
          <rect x="53"  y="222" width="34" height="12" fill="#e91e8c" rx="3" opacity="0.8" />
          <rect x="213" y="222" width="34" height="12" fill="#e91e8c" rx="3" opacity="0.8" />
          {/* Lower nuki */}
          <rect x="52"  y="128" width="196" height="13" fill="#e91e8c" rx="2" />
          {/* Upper kasagi */}
          <path d="M32,86 Q150,62 268,86 L268,74 Q150,48 32,74 Z" fill="url(#lGate)" filter="url(#lShadow)" />
          <ellipse cx="32"  cy="80" rx="11" ry="7" fill="#e91e8c" />
          <ellipse cx="268" cy="80" rx="11" ry="7" fill="#e91e8c" />
          {/* Shimagi */}
          <rect x="52" y="96" width="196" height="10" fill="#e91e8c" opacity="0.85" rx="2" />
          {/* Logo/shield */}
          <text x="150" y="118" textAnchor="middle" dominantBaseline="middle" fontSize="24">⛩️</text>
          {/* Reflection */}
          <g opacity="0.12" transform="translate(0,458) scale(1,-1)">
            <rect x="60"  y="90"  width="20" height="120" fill="#e91e8c" rx="3" />
            <rect x="220" y="90"  width="20" height="120" fill="#e91e8c" rx="3" />
            <rect x="52"  y="96"  width="196" height="10"  fill="#e91e8c" rx="2" />
          </g>
          {/* Petals */}
          {[{x:45,y:55,r:5},{x:245,y:45,r:4},{x:190,y:38,r:5},{x:95,y:42,r:4},{x:260,y:100,r:3},{x:25,y:110,r:4}].map((p,i)=>(
            <ellipse key={i} cx={p.x} cy={p.y} rx={p.r} ry={p.r*.7}
              fill="#e91e8c" opacity="0.3"
              transform={`rotate(${i*30} ${p.x} ${p.y})`} />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="landing-content">
        <div className="landing-eyebrow">Welcome to</div>
        <h1 className="landing-title">TORII</h1>
        <p className="landing-sub">
          Join a clan. Trade together.<br/>
          Compete for the season prize pool.
        </p>

        <div className="landing-features">
          <div className="lf-item">
            <span className="lf-icon">⛩️</span>
            <div>
              <div className="lf-title">Token-gated Clans</div>
              <div className="lf-desc">Hold clan tokens to gain entry</div>
            </div>
          </div>
          <div className="lf-item">
            <span className="lf-icon">📈</span>
            <div>
              <div className="lf-title">Real PnL Tracking</div>
              <div className="lf-desc">Your wallet performance, live</div>
            </div>
          </div>
          <div className="lf-item">
            <span className="lf-icon">🏆</span>
            <div>
              <div className="lf-title">Season Prize Pool</div>
              <div className="lf-desc">Best clan takes the SOL prize</div>
            </div>
          </div>
        </div>

        <div className="landing-actions">
          <button className="landing-btn-primary" onClick={handleSignIn}>
            Sign In with Email
          </button>
          <button className="landing-btn-ghost" onClick={handleExplore}>
            Explore first →
          </button>
        </div>

        <div className="landing-hint">
          No wallet needed · Instant embedded wallet on sign in
        </div>
      </div>
    </div>
  );
}
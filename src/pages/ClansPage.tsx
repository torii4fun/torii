import { useEffect, useRef, useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../lib/api';
import { ToriiGate } from '../components/ui/ToriiGate';
import { fmtPct, fmtTok, fmtWallet } from '../lib/format';
import type { LeaderboardClan } from '../types';

function SakuraPetals({ color }: { color: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 5 + (i * 8.5),
    size: 4 + (i % 3) * 2,
    delay: i * 0.5,
    duration: 4 + (i % 4),
  }));
  return (
    <div className="sakura-bg" aria-hidden="true">
      {petals.map(p => (
        <div
          key={p.id}
          className="sakura-bg-petal"
          style={{
            left:             `${p.left}%`,
            width:            p.size,
            height:           p.size,
            background:       color,
            animationDelay:   `${p.delay}s`,
            animationDuration:`${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

interface BookPageProps {
  clan:        LeaderboardClan;
  isMyPage:    boolean;
  isMember:    boolean;
  inOtherClan: boolean;
  isLoggedIn:  boolean;
  onJoin:      () => void;
  onAuth:      () => void;
  onMyClan:    () => void;
}

function BookClanPage({
  clan, isMyPage, isMember, inOtherClan, isLoggedIn, onJoin, onAuth, onMyClan
}: BookPageProps) {
  const ticker = clan.tokenMint ? clan.tokenMint.slice(0, 4).toUpperCase() : 'TOKEN';

  return (
    <>
      {/* Left half — Torii gate as background */}
      <div className="cas-half">
        <div className="torii-bg-wrap">
          <ToriiGate color={clan.color} emoji={clan.emoji} />
        </div>
        <SakuraPetals color={clan.color} />
      </div>

      {/* Right half — Info */}
      <div className="info-half">
        <div className="clan-big-emoji">{clan.emoji}</div>
        <h1 className="clan-big-name" style={{ color: clan.color }}>{clan.name}</h1>
        <p className="clan-motto">"{clan.motto}"</p>

        {/* Entry requirement */}
        {clan.minTokensRequired > 0 && (
          <div
            className="tgate-banner"
            style={{ background: clan.color + '09', borderColor: clan.color + '30', color: clan.color }}
          >
            <div className="tgate-req">HOLD TO ENTER</div>
            <div className="tgate-val">{fmtTok(clan.minTokensRequired)} {ticker}</div>
            {clan.tokenMint && (
              <a
                className="tgate-buy-btn"
                href={`https://bags.fm/${clan.tokenMint}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: clan.color }}
              >
                Buy {ticker} ↗
              </a>
            )}
          </div>
        )}

        {/* Telegram — members only, no hint to non-members */}
        {clan.telegramGroup && isMember && (
          <div className="social-row">
            <a
              className="social-link"
              href={`https://t.me/${clan.telegramGroup.replace('t.me/', '')}`}
              target="_blank"
              rel="noreferrer"
            >
              Telegram →
            </a>
          </div>
        )}

        {/* Stats */}
        <div className="clan-stats">
          <div className="clan-stat">
            <div className="cs-val">{clan.members}</div>
            <div className="cs-lbl">Members</div>
          </div>
          <div className="clan-stat">
            <div className={`cs-val ${Number(clan.totalPnlPct) >= 0 ? 'up' : 'down'}`}>
              {fmtPct(clan.totalPnlPct)}
            </div>
            <div className="cs-lbl">Avg PnL</div>
          </div>
        </div>

        {/* Join button */}
        {isMyPage ? (
          <button className="join-btn-book" style={{ background: clan.color }} onClick={onMyClan}>
            Enter Clan HQ
          </button>
        ) : !isLoggedIn ? (
          <button className="join-btn-book" style={{ background: clan.color }} onClick={onAuth}>
            Sign In to Join
          </button>
        ) : inOtherClan ? (
          <button className="join-btn-book" disabled style={{ background: clan.color }}>
            Already in a clan
          </button>
        ) : (
          <button className="join-btn-book" style={{ background: clan.color }} onClick={onJoin}>
            Join Clan
          </button>
        )}
      </div>

      <div className="book-spine" style={{ background: clan.color }} />
    </>
  );
}


export function ClansPage() {
  const { state, dispatch } = useApp();
  const [flipping, setFlipping] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const clans = state.leaderboard;
  const idx = state.clanIdx;

  // Fetch leaderboard if empty
  useEffect(() => {
    if (clans.length === 0) {
      api.getLeaderboard().then(data => {
        dispatch({ type: 'SET_LEADERBOARD', payload: data });
      }).catch(console.error);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.page !== 'clans') return;
      if (e.key === 'ArrowRight') doFlip(1);
      if (e.key === 'ArrowLeft') doFlip(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.page, idx, flipping, clans.length]);

  const doFlip = useCallback((dir: 1 | -1) => {
    if (flipping || clans.length === 0) return;
    const nextIdx = (idx + dir + clans.length) % clans.length;
    setFlipping(true);

    const pg = pageRef.current;
    if (pg) {
      pg.style.transition = 'transform .27s ease-in, opacity .27s';
      pg.style.transform  = `perspective(1400px) rotateY(${dir === 1 ? -88 : 88}deg)`;
      pg.style.opacity    = '.1';
    }

    setTimeout(() => {
      dispatch({ type: 'SET_CLAN_IDX', payload: nextIdx });
      requestAnimationFrame(() => {
        const pg2 = pageRef.current;
        if (!pg2) return;
        pg2.style.transition = 'none';
        pg2.style.transform  = `perspective(1400px) rotateY(${dir === 1 ? 88 : -88}deg)`;
        pg2.style.opacity    = '.1';
        requestAnimationFrame(() => {
          pg2.style.transition = 'transform .27s ease-out, opacity .27s';
          pg2.style.transform  = 'perspective(1400px) rotateY(0)';
          pg2.style.opacity    = '1';
          setTimeout(() => setFlipping(false), 290);
        });
      });
    }, 280);
  }, [flipping, idx, clans.length]);

  const clan = clans[idx];
  const isLoggedIn = !!state.user;
  const isMyPage   = state.clan?.id === clan?.clanId;
  const inOtherClan = !!state.clan && state.clan.id !== clan?.clanId;

  if (clans.length === 0) {
    return (
      <div className="cbook">
        <div className="loading-state"><span className="spinner">⟳</span> Loading clans…</div>
      </div>
    );
  }

  return (
    <div className="cbook">
      <div className="cbook-row">
        <button className="flip-btn flip-btn-l" onClick={() => doFlip(-1)}>‹</button>

        <div className="book-stack">
          <div className="book-shadow" style={{ transform: 'translate(5px,3px)', opacity: .5 }} />
          <div className="book-shadow" style={{ transform: 'translate(2px,1px)', opacity: .72 }} />
          <div className="book-page" ref={pageRef}>
            {clan && (
              <BookClanPage
                clan={clan}
                isMyPage={isMyPage}
                isMember={isMyPage}
                inOtherClan={inOtherClan}
                isLoggedIn={isLoggedIn}
                onJoin={() => dispatch({ type: 'OPEN_JOIN', payload: clan.clanId })}
                onAuth={() => dispatch({ type: 'OPEN_AUTH' })}
                onMyClan={() => dispatch({ type: 'SET_PAGE', payload: 'myclan' })}
              />
            )}
            <div className="book-page-num">{idx + 1} / {clans.length}</div>
          </div>
        </div>

        <button className="flip-btn flip-btn-r" onClick={() => doFlip(1)}>›</button>
      </div>

      {/* Dots */}
      <div className="cdots">
        {clans.map((c, i) => (
          <button
            key={c.clanId}
            className={`cdot${i === idx ? ' active' : ''}`}
            style={i === idx ? { background: c.color } : {}}
            onClick={() => !flipping && i !== idx && doFlip(i > idx ? 1 : -1)}
          />
        ))}
      </div>
    </div>
  );
}
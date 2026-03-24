import React, { useEffect } from 'react';

import { useApp } from '../context/AppContext';
import * as api from '../lib/api';
import { fmtPct, fmtTok } from '../lib/format';
import type { LeaderboardClan } from '../types';

function RankNum({ i }: { i: number }) {
  if (i === 0) return <span className="rank-num rn-gold">🥇</span>;
  if (i === 1) return <span className="rank-num rn-silver">🥈</span>;
  if (i === 2) return <span className="rank-num rn-bronze">🥉</span>;
  return <span className="rank-num rn-rest">{String(i + 1).padStart(2, '0')}</span>;
}

function RankRow({ clan, idx, isMe, onJump }: {
  clan: LeaderboardClan; idx: number; isMe: boolean; onJump: () => void;
}) {
  const pct = Number(clan.totalPnlPct ?? 0);

  return (
    <div className={`rank-row${isMe ? ' my-clan' : ''}`} onClick={onJump}>
      <RankNum i={idx} />

      {/* Clan name + emoji + color */}
      <div className="rank-clan-cell">
        <div
          className="rank-avt"
          style={{ background: clan.color + '22', border: `1.5px solid ${clan.color}60` }}
        >
          {clan.emoji}
        </div>
        <div>
          <div className="rank-clan-name" style={{ color: clan.color }}>{clan.name}</div>
          <div className="rank-clan-motto">{clan.motto}</div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="rank-val">{clan.members}</div>
        <div className="rank-sub">wallets</div>
      </div>

      {/* PnL % */}
      <div>
        <div className={`rank-pnl ${pct >= 0 ? 'up' : 'down'}`}>{fmtPct(pct)}</div>
        <div className="pnl-bar">
          <div
            className="pnl-bar-fill"
            style={{
              width: `${Math.min((Math.abs(pct) / Math.max(100, Math.abs(pct))) * 100, 100)}%`,
              background: pct >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          />
        </div>
      </div>

      {/* Entry requirement */}
      <div>
        <div className="rank-val" style={{ fontSize: 11 }}>
          {Number(clan.minTokensRequired) > 0
            ? fmtTok(clan.minTokensRequired)
            : 'Open'}
        </div>
        <div className="rank-sub">to join</div>
      </div>
    </div>
  );
}


function EmptyLeaderboard() {
  const { state } = useApp();
  // If we've already tried to load (leaderboard is empty array, not null)
  return (
    <div className="loading-state" style={{ flexDirection: 'column', gap: 8, padding: '48px 20px' }}>
      
      <div style={{ fontWeight: 900, fontSize: 15 }}>No clans yet</div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
        Be the first to forge a clan
      </div>
    </div>
  );
}

export function RankPage() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard().then(data => {
      dispatch({ type: 'SET_LEADERBOARD', payload: data });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const sorted = [...state.leaderboard].sort(
    (a, b) => Number(b.totalPnlPct) - Number(a.totalPnlPct)
  );

  function jumpToClan(clanId: string) {
    const idx = state.leaderboard.findIndex(c => c.clanId === clanId);
    if (idx >= 0) dispatch({ type: 'SET_CLAN_IDX', payload: idx });
    dispatch({ type: 'SET_PAGE', payload: 'clans' });
  }

  return (
    <div className="wrap">
      <div className="rank-hero">
        <div>
          <div className="rh-label">
            Mainnet
          </div>
          <div className="rh-title">Clan Leaderboard</div>
          <div className="rh-sub">Ranked by clan trading performance</div>
        </div>
      </div>

      <div className="rank-cols">
        <span>#</span>
        <span>Clan</span>
        <span>Members</span>
        <span>PnL</span>
        <span>Entry</span>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner">⟳</span> Loading…</div>
      ) : sorted.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        sorted.map((c, i) => (
          <RankRow
            key={c.clanId}
            clan={c}
            idx={i}
            isMe={state.clan?.id === c.clanId}
            onJump={() => jumpToClan(c.clanId)}
          />
        ))
      )}

      <div className="rank-footer"></div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../lib/api';
import { fmtPct, fmtWallet, fmtTok } from '../lib/format';
import type { ClanMember } from '../types';

function MemberRow({ member, rank }: { member: ClanMember; rank: number }) {
  return (
    <div className="member-row">
      <div className="member-avt">{member.avatarEmoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="member-name">{member.displayName}</div>
          <span className={`member-role ${member.clanRole === 'founder' ? 'role-founder' : 'role-member'}`}>
            {member.clanRole.toUpperCase()}
          </span>
        </div>
        <div className="member-wallet">{fmtWallet(member.walletAddress)}</div>
      </div>
      <div className="member-pnl-sub">#{rank}</div>
    </div>
  );
}

export function MyClanPage() {
  const { state, dispatch } = useApp();
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [editingTg, setEditingTg] = useState(false);
  const [tgInput, setTgInput] = useState('');
  const [savingTg, setSavingTg] = useState(false);

  const clan = state.clan;
  const user = state.user;

  const isFounder = !!user && user.clanRole === 'founder';

  // Только загрузка участников — PnL берётся из кэша БД (обновляется scheduler каждые 12ч)
  useEffect(() => {
    if (!clan) return;
    api.getClan(clan.id, user?.id).then(full => {
      if (full.memberList) setMembers(full.memberList);
      dispatch({ type: 'SET_CLAN', payload: full });
    }).catch(console.error);
  }, [clan?.id]);

  if (!clan) {
    return (
      <div className="wrap" style={{ textAlign: 'center', padding: '72px 20px' }}>
        
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Not in a clan yet</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
          Buy clan tokens to join instantly, or forge your own
        </div>
        <button className="btn" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'clans' })}>
          Browse Clans
        </button>
        <button className="btn btn-dark" style={{ marginLeft: 8 }}
          onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
          ⚔ Forge a Clan
        </button>
      </div>
    );
  }

  const sorted = [...state.leaderboard].sort((a, b) => Number(b.totalPnlPct) - Number(a.totalPnlPct));
  const rank = sorted.findIndex(c => c.clanId === clan.id) + 1;

  const tgUrl = clan.telegramGroup
    ? `https://t.me/${clan.telegramGroup.replace(/^https?:\/\/t\.me\//, '').replace(/^t\.me\//, '')}`
    : null;

  const pnlUpdated = clan.pnlUpdatedAt
    ? new Date(clan.pnlUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="wrap">
      {/* Hero */}
      <div className="clan-hero" style={{ background: clan.color }}>
        <div className="ch-top">
          <div className="ch-emoji">{clan.emoji}</div>
          <div>
            <div className="ch-name">{clan.name}</div>
            {clan.motto && <div className="ch-motto">"{clan.motto}"</div>}
            {clan.tokenMint && (
              <div className="ch-meta">
                <span style={{ fontSize: 10, opacity: .5 }}>{fmtWallet(clan.tokenMint, 6)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ch-stats">
          <div className="ch-stat">
            <div className="ch-stat-val">{members.length || (clan.members ?? 0)}</div>
            <div className="ch-stat-lbl">Members</div>
          </div>
          <div className="ch-stat">
            <div className={`ch-stat-val ${Number(clan.cachedPnlPct) >= 0 ? 'up' : 'down'}`}>
              {fmtPct(clan.cachedPnlPct)}
            </div>
            <div className="ch-stat-lbl">
              Avg PnL
            </div>
          </div>
          <div className="ch-stat">
            <div className="ch-stat-val">#{rank || '—'}</div>
            <div className="ch-stat-lbl">Season Rank</div>
          </div>
        </div>

        <div className="ch-rank-bg">#{rank}</div>
        <div className="ch-glow" style={{ background: `radial-gradient(circle, ${clan.color}, transparent)` }} />
      </div>

      <div className="clan-grid">
        {/* Left — Members */}
        <div>
          <div className="scard">
            <div className="scard-head">
              <span className="scard-title">Members</span>
              <span className="scard-sub">{members.length} members</span>
            </div>
            {members.length === 0 ? (
              <div className="loading-state"><span className="spinner">⟳</span></div>
            ) : (
              members.map((m, i) => (
                <MemberRow key={m.id} member={m} rank={i + 1} />
              ))
            )}
          </div>
        </div>

        {/* Right — Info */}
        <div>
          <div className="scard" style={{ marginBottom: 12 }}>
            <div className="scard-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="scard-title">Telegram</span>
              {isFounder && !editingTg && (
                <button
                  className="btn-ghost-sm"
                  onClick={() => { setTgInput(clan.telegramGroup ?? ''); setEditingTg(true); }}
                >Edit</button>
              )}
            </div>
            <div className="side-panel-body">
              {editingTg ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    className="input-sm"
                    placeholder="t.me/yourclan or link"
                    value={tgInput}
                    onChange={e => setTgInput(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm"
                      disabled={savingTg}
                      onClick={async () => {
                        setSavingTg(true);
                        try {
                          await api.updateClanSettings(clan.id, user!.id, { telegramGroup: tgInput });
                          dispatch({ type: 'SET_CLAN', payload: { ...clan, telegramGroup: tgInput } });
                          setEditingTg(false);
                        } catch { /* ignore */ }
                        setSavingTg(false);
                      }}
                    >{savingTg ? 'Saving…' : 'Save'}</button>
                    <button className="btn-ghost-sm" onClick={() => setEditingTg(false)}>Cancel</button>
                  </div>
                </div>
              ) : tgUrl ? (
                <a href={tgUrl} target="_blank" rel="noreferrer" className="btn btn-full" style={{ fontSize: 13 }}>
                  Join Telegram →
                </a>
              ) : isFounder ? (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>No Telegram set — click Edit to add</div>
              ) : null}
            </div>
          </div>

          <div className="scard" style={{ marginBottom: 12 }}>
            <div className="scard-head">
              <span className="scard-title">Entry</span>
              
            </div>
            <div className="side-panel-body">
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                Hold <b>{fmtTok(clan.minTokensRequired)}</b> clan tokens to join
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                Verified on-chain · instant entry
              </div>
            </div>
          </div>

          {clan.tokenMint && (
            <div className="scard">
              <div className="scard-head">
                <span className="scard-title">Token</span>
                
              </div>
              <div className="side-panel-body">
                <div className="token-mint" style={{ marginBottom: 10 }}>{clan.tokenMint}</div>
                <a href={`https://bags.fm/${clan.tokenMint}`} target="_blank" rel="noreferrer"
                  className="btn btn-full" style={{ fontSize: 12 }}>
                  View token ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
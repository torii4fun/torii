import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import * as api from '../../lib/api';
import { fmtTok } from '../../lib/format';

type CheckState = 'loading' | 'ok' | 'insufficient' | 'error';

export function JoinModal() {
  const { state, dispatch, toast } = useApp();
  const [checkState, setCheckState] = useState<CheckState>('loading');
  const [held, setHeld] = useState<string>('0');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const clanId = state.modals.join;
  const open   = clanId !== null;
  const clan   = state.leaderboard.find(c => c.clanId === clanId);

  const close = () => dispatch({ type: 'CLOSE_JOIN' });

  // Проверяем баланс при открытии — НЕ вступаем, только проверяем
  useEffect(() => {
    if (!open || !clanId || !state.user) return;
    setCheckState('loading');
    setError('');

    const required = Number(clan?.minTokensRequired ?? 0);

    // Если токенов не требуется — сразу ok
    if (!clan?.tokenMint || required === 0) {
      setCheckState('ok');
      setHeld('0');
      return;
    }

    // Проверяем баланс через GET (не вступаем!)
    api.checkClanEligibility(clanId, state.user.id)
      .then(result => {
        setCheckState(result.eligible ? 'ok' : 'insufficient');
        setHeld(result.held ?? '0');
      })
      .catch((e: any) => {
        if (e.status === 403 && e.data) {
          setCheckState('insufficient');
          setHeld(e.data.held ?? '0');
        } else {
          setCheckState('error');
          setError(e.message);
        }
      });
  }, [open, clanId, state.user?.id]);

  async function confirmJoin() {
    if (!clanId || !state.user) return;
    setJoining(true);
    try {
      // Balance already verified — re-request to actually join
      await api.joinClan(clanId, state.user.id);
      // Fetch updated user + clan
      const updatedUser = { ...state.user, clanId };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      const full = await api.getClan(clanId, state.user.id);
      dispatch({ type: 'SET_CLAN', payload: full });
      toast(`⚔️ Welcome to ${clan?.name}!`);
      close();
      dispatch({ type: 'SET_PAGE', payload: 'myclan' });
    } catch (e: any) {
      toast('❌ ' + e.message);
    } finally {
      setJoining(false);
    }
  }

  if (!clan) return null;

  const ticker  = clan.tokenMint ? clan.tokenMint.slice(0, 4).toUpperCase() : '?';
  const required = fmtTok(clan.minTokensRequired);
  const heldFmt  = fmtTok(parseInt(held, 10) || 0);

  const statusEl = checkState === 'loading' ? (
    <div className="balance-status bs-loading"><Spinner /> Checking your on-chain balance…</div>
  ) : checkState === 'ok' ? (
    <div className="balance-status bs-ok">✅ You qualify — instant join available!</div>
  ) : checkState === 'insufficient' ? (
    <div className="balance-status bs-nok">❌ Not enough ${ticker} — buy more to join</div>
  ) : (
    <div className="balance-status bs-nok">❌ {error || 'Could not verify balance. Try again.'}</div>
  );

  return (
    <Modal open={open} onClose={close}>
      <div className="modal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: clan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {clan.emoji}
          </div>
          <span className="modal-title">Join {clan.name}</span>
        </div>
        <button className="modal-close" onClick={close}>✕</button>
      </div>
      <div className="modal-body">
        <div className="info-box">
          🔑 <b>{clan.name}</b> is token-gated. Hold <b>{required} ${ticker}</b> and you join&nbsp;
          <b>instantly</b> — no application, no waiting.
        </div>

        <div className="balance-card">
          <div className="balance-row">
            <span className="balance-lbl">Required</span>
            <span className="balance-val">{required} ${ticker}</span>
          </div>
          <div className="balance-row">
            <span className="balance-lbl">Your balance</span>
            <span className={`balance-val ${checkState === 'ok' ? 'up' : checkState === 'insufficient' ? 'down' : ''}`}>
              {checkState === 'loading' ? '—' : `${heldFmt} $${ticker}`}
            </span>
          </div>
          {statusEl}
        </div>

        {checkState === 'insufficient' && (
          <>
            <a
              href={`https://bags.fm/${clan.tokenMint ?? ''}`}
              target="_blank" rel="noreferrer"
              className="btn btn-dark btn-full"
              style={{ marginBottom: 10 }}
            >Buy ${ticker} on bags.fm ↗</a>
            <button
              className="btn btn-full"
              onClick={() => {
                setCheckState('loading');
                setError('');
                if (state.user) {
                  api.joinClan(clan.clanId, state.user.id)
                    .then(r => { setCheckState(r.ok ? 'ok' : 'insufficient'); setHeld(r.held ?? '0'); })
                    .catch((e: any) => { setCheckState('insufficient'); setHeld(e.data?.held ?? '0'); });
                }
              }}
            >🔄 Re-check balance</button>
          </>
        )}

        {checkState === 'ok' && (
          <>
            <button
              className="btn btn-dark btn-lg btn-full"
              onClick={confirmJoin}
              disabled={joining}
            >{joining ? <Spinner /> : `⚔️ Join ${clan.name}`}</button>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
              Balance verified on Solana mainnet
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
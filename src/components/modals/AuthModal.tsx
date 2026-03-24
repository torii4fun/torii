import { useState, useRef, useEffect } from 'react';
import { useLoginWithEmail, usePrivy, useWallets } from '@privy-io/react-auth';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import * as api from '../../lib/api';

type Step = 'email' | 'otp' | 'done';

export function AuthModal() {
  const { state, dispatch } = useApp();
  const { authenticated, user: privyUser, exportWallet } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets } = useWallets();
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const open  = state.modals.auth;
  const close = () => {
    dispatch({ type: 'CLOSE_AUTH' });
    setStep('email'); setEmail(''); setOtp(['','','','','','']); setError('');
  };

  useEffect(() => {
    if (authenticated && state.user && open) close();
  }, [authenticated, state.user]);

  // Sync to backend after Privy auth
  useEffect(() => {
    if (!authenticated || !privyUser) return;
    const embedded = wallets.find((w: any) => w.walletClientType === 'privy');
    if (!embedded) return;

    api.authUser({
      privyDid:      privyUser.id,
      email:         privyUser.email?.address ?? email,
      walletAddress: embedded.address,
      displayName:   (privyUser.email?.address ?? '').split('@')[0],
    }).then(u => {
      dispatch({ type: 'SET_USER', payload: u });
      if (u.clanId) {
        api.getClan(u.clanId, u.id).then(c => dispatch({ type: 'SET_CLAN', payload: c }));
      }
      setStep('done');
    }).catch(e => setError(e.message));
  }, [authenticated, wallets.length]);

  async function handleSendCode() {
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      await sendCode({ email });
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await loginWithCode({ code });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  // ── Step: done ───────────────────────────────────────────────
  if (step === 'done') {
    const wallet = wallets.find((w: any) => w.walletClientType === 'privy');
    return (
      <Modal open={open} onClose={close} title="You're in">
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
            Welcome to Warps
          </div>
          {wallet && (
            <div className="wallet-reveal">
              <div className="wr-label">Your Solana Wallet</div>
              <div className="wr-addr">{wallet.address}</div>
              <div className="wr-note">Mainnet · Embedded · Non-custodial</div>
              <button
                className="btn btn-sm"
                style={{ marginTop: 10, width: '100%' }}
                onClick={() => exportWallet()}
              >
                Export Private Key
              </button>
            </div>
          )}
          <button className="btn btn-dark btn-full" style={{ marginTop: 4 }} onClick={close}>
            Enter Warps →
          </button>
        </div>
      </Modal>
    );
  }

  // ── Step: otp ────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <Modal open={open} onClose={close} title="Check your email">
        <div className="modal-body">
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18, textAlign: 'center' }}>
            6-digit code sent to <b>{email}</b>
          </div>
          <div className="otp-row">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                className="otp-input"
                maxLength={1}
                inputMode="numeric"
                value={v}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && <div className="field-error">{error}</div>}
          <button className="btn btn-dark btn-full" style={{ padding: 12, marginBottom: 8 }}
            onClick={handleVerifyOtp} disabled={loading}>
            {loading ? <Spinner /> : 'Verify →'}
          </button>
          <button className="btn btn-full" style={{ padding: 10 }}
            onClick={() => { setStep('email'); setOtp(['','','','','','']); }}>
            ← Change email
          </button>
        </div>
      </Modal>
    );
  }

  // ── Step: email ──────────────────────────────────────────────
  return (
    <Modal open={open} onClose={close} title="Sign in to Warps">
      <div className="modal-body">
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>
          Enter your email. A <b>Solana wallet</b> is automatically created —
          non-custodial, exportable, no seed phrase needed.
        </div>
        <div className="field">
          <label className="field-label">Email address</label>
          <input
            className="field-input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendCode(); }}
          />
        </div>
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn-dark btn-full" style={{ padding: 12 }}
          onClick={handleSendCode} disabled={loading}>
          {loading ? <Spinner /> : 'Continue →'}
        </button>
        <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 10 }}>
          New user? Account created automatically on first login.
        </div>
      </div>
    </Modal>
  );
}

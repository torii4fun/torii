import { useState, useRef, useEffect } from 'react';
import { usePrivy, useWallets, type WalletWithMetadata } from '@privy-io/react-auth';
import { useExportWallet } from '@privy-io/react-auth/solana';
import { useApp } from '../../context/AppContext';
import type { Page } from '../../context/AppContext';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const RPC = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

function WalletIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
      <rect x="0" y="2" width="20" height="12" rx="2" fill="currentColor" opacity="0.4"/>
      <rect x="0" y="0" width="20" height="4" rx="1" fill="currentColor" opacity="0.7"/>
      <circle cx="15" cy="8" r="2" fill="currentColor"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

export function Nav() {
  const { state, dispatch } = useApp();
  const { ready: privyReady, authenticated, user: privyUser, login, logout } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { exportWallet } = useExportWallet();

  const hasEmbeddedWallet = !!privyUser?.linkedAccounts.find(
    (a): a is WalletWithMetadata =>
      a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'solana'
  );

  const [showWallet, setShowWallet] = useState(false);
  const [balance, setBalance]       = useState<number | null>(null);
  const [copied, setCopied]         = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const setPage = (p: Page) => dispatch({ type: 'SET_PAGE', payload: p });



  useEffect(() => {
    const addr = state.user?.walletAddress;
    if (!showWallet || !addr || addr.length < 32) return;
    setBalance(null);
    try {
      new Connection(RPC)
        .getBalance(new PublicKey(addr))
        .then(b => setBalance(b / LAMPORTS_PER_SOL))
        .catch(() => setBalance(0));
    } catch { setBalance(0); }
  }, [showWallet, state.user?.walletAddress]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node))
        setShowWallet(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function copyAddress() {
    if (!state.user?.walletAddress) return;
    navigator.clipboard.writeText(state.user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleLogout() {
    setShowWallet(false);
    await logout();
    dispatch({ type: 'SET_USER', payload: null as any });
    dispatch({ type: 'SET_CLAN',  payload: null as any });
  }

  async function handleExport() {
    try {
      await exportWallet({ address: state.user!.walletAddress });
    } catch (e) {
      console.error('❌ exportWallet error:', e);
    }
  }

  const renderRight = () => {
    if (!privyReady) return null;

    if (!authenticated) {
      return <button className="btn btn-dark" onClick={login}>Sign In</button>;
    }

    if (!walletsReady || !state.user) {
      return (
        <div className="wallet-chip-bags" style={{ opacity: 0.5, cursor: 'default' }}>
          <WalletIcon /><span>···</span>
        </div>
      );
    }

    return (
      <>
        {!state.clan && (
          <button className="btn" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            ⛩ Create Clan
          </button>
        )}

        <div ref={popupRef} style={{ position: 'relative' }}>
          <button className="wallet-chip-bags" onClick={() => setShowWallet(v => !v)}>
            <WalletIcon />
            <span className="wcb-balance">
              {balance === null ? '···' : balance.toFixed(3)}
            </span>
            <span className="wcb-unit">SOL</span>
          </button>

          {showWallet && (
            <div className="wallet-popup">
              <div className="wp-balance">
                <div className="wp-balance-label">Balance</div>
                <div className="wp-balance-val">
                  {balance === null ? '…' : `${balance.toFixed(4)} SOL`}
                </div>
              </div>

              <hr className="wp-divider" />

              <div className="wp-addr-row">
                <div style={{ minWidth: 0 }}>
                  <div className="wp-label">Wallet Address</div>
                  <div className="wp-addr-full">{state.user.walletAddress}</div>
                </div>
                <button className="wp-copy" onClick={copyAddress} title="Copy">
                  {copied ? '✓' : <CopyIcon />}
                </button>
              </div>

              <hr className="wp-divider" />

              <button
                className="wp-btn"
                onClick={handleExport}
                disabled={!hasEmbeddedWallet}
                title={!hasEmbeddedWallet ? 'No Solana embedded wallet found' : ''}
              >
                 Export Private Key
                {!hasEmbeddedWallet && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>(no wallet)</span>}
              </button>

              <button className="wp-btn wp-btn-danger" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-logo" href="#">
          <img src="/logo.png" alt="Torii" className="nav-logo-img" />
          <span className="nav-logo-text">Torii</span>
        </a>

        <div className="nav-tabs">
          <button className={`nav-tab${state.page === 'rank'  ? ' active' : ''}`} onClick={() => setPage('rank')}>Leaderboard</button>
          <button className={`nav-tab${state.page === 'clans' ? ' active' : ''}`} onClick={() => setPage('clans')}>Clans</button>
          {state.clan && (
            <button className={`nav-tab${state.page === 'myclan' ? ' active' : ''}`} onClick={() => setPage('myclan')}>My Clan</button>
          )}
        </div>

        <div className="nav-right">{renderRight()}</div>
      </div>
    </nav>
  );
}
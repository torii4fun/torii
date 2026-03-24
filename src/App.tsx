import { useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { AppProvider, useApp } from './context/AppContext';
import { Nav } from './components/layout/Nav';
import { ToastContainer } from './components/ui/Toast';
import { JoinModal } from './components/modals/JoinModal';
import { CreateClanModal } from './components/modals/CreateClanModal';
import { RankPage } from './pages/RankPage';
import { ClansPage } from './pages/ClansPage';
import { MyClanPage } from './pages/MyClanPage';
import { useWebSocket } from './hooks/useWebSocket';
import * as api from './lib/api';
import { LandingPage } from './pages/LandingPage';
import { Footer } from './components/layout/Footer';
import './styles/global.css';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

// Строим валидные HTTP и WSS URL из env
const RAW_RPC  = import.meta.env.VITE_SOLANA_RPC_URL ?? '';
const HTTP_RPC = RAW_RPC.startsWith('http://') || RAW_RPC.startsWith('https://')
  ? RAW_RPC
  : 'https://api.mainnet-beta.solana.com';

// Helius WSS endpoint отличается от HTTP — используем специальный формат
// https://mainnet.helius-rpc.com/?api-key=XXX → wss://mainnet.helius-rpc.com/?api-key=XXX
const WSS_RPC = HTTP_RPC
  .replace('https://mainnet.helius-rpc.com', 'wss://mainnet.helius-rpc.com')
  .replace('https://rpc.helius.xyz', 'wss://rpc.helius.xyz')
  .replace(/^https?:\/\//, 'wss://'); // fallback для других RPC

function InnerApp() {
  const { state, dispatch } = useApp();
  const { ready: privyReady, authenticated, user: privyUser } = usePrivy();
  useWebSocket();

  // Show landing once to unauthenticated users who haven't seen it
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('warps_seen_landing') && !authenticated;
  });

  // Hide landing once user authenticates
  useEffect(() => {
    if (authenticated) {
      setShowLanding(false);
      localStorage.setItem('warps_seen_landing', '1');
    }
  }, [authenticated]);

  useEffect(() => {
    if (!privyReady) return;
    if (!authenticated || !privyUser) return;

    // Get Solana embedded wallet directly from linkedAccounts
    const solanaWallet = privyUser.linkedAccounts.find(
      (a: any) => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'solana'
    ) as any;

    if (!solanaWallet?.address) {
      return;
    }

    api.authUser({
      privyDid:      privyUser.id,
      email:         privyUser.email?.address ?? '',
      walletAddress: solanaWallet.address,
      displayName:   (privyUser.email?.address ?? '').split('@')[0],
    }).then(async u => {
      dispatch({ type: 'SET_USER', payload: u });
      if (u.clanId) {
        const clan = await api.getClan(u.clanId, u.id);
        dispatch({ type: 'SET_CLAN', payload: clan });
      }
    }).catch(e => {
      console.error('❌ auth sync error:', e.status, e.message, e.data);
    });
  }, [privyReady, authenticated, privyUser?.id, privyUser?.linkedAccounts.length]);

  useEffect(() => {
    if (privyReady && !authenticated) {
      dispatch({ type: 'SET_USER', payload: null as any });
      dispatch({ type: 'SET_CLAN',  payload: null as any });
    }
  }, [privyReady, authenticated]);

  useEffect(() => {
    api.getLeaderboard()
      .then(data => dispatch({ type: 'SET_LEADERBOARD', payload: data }))
      .catch(console.error);
  }, []);

  if (!privyReady) return null;
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <>
      <Nav />
      <main>
        {state.page === 'rank'   && <RankPage />}
        {state.page === 'clans'  && <ClansPage />}
        {state.page === 'myclan' && <MyClanPage />}
      </main>
      <Footer />
      <JoinModal />
      <CreateClanModal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme:       'dark',
          accentColor: '#e2b854',
        },
        embeddedWallets: {
          solana: { createOnLogin: 'all-users' },
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc(HTTP_RPC) as any,
              rpcSubscriptions: createSolanaRpcSubscriptions(WSS_RPC) as any,
            },
          },
        },
      }}
    >
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </PrivyProvider>
  );
}
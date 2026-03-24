import { useState } from 'react';
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import bs58 from 'bs58';
import { Spinner } from '../../ui/Spinner';
import * as api from '../../../lib/api';
import type { CreateClanState } from '../../../types';

interface Props {
  state:      CreateClanState;
  set:        (k: keyof CreateClanState, v: any) => void;
  onDone:     (mintAddress: string) => void;
  onPrev:     () => void;
  userId:     string;
  walletAddr: string;
}

type LaunchPhase =
  | 'idle'
  | 'metadata'     // 1: upload token info → tokenMint + uri
  | 'fee_config'   // 2: create fee-share config (tokenMint известен, но ещё не on-chain)
  | 'fee_signing'  // 2: sign fee config txs if needsCreation
  | 'building'     // 3: build launch tx
  | 'signing'      // 3: sign & send → токен минтится
  | 'confirming'   // 4: wait for confirmation
  | 'done'
  | 'error';

const LABELS: Record<LaunchPhase, string> = {
  idle:        'Ready to launch',
  metadata:    '1/4 Uploading token metadata…',
  fee_config:  '2/4 Setting up fee share…',
  fee_signing: '2/4 Sign fee share transaction…',
  building:    '3/4 Building launch transaction…',
  signing:     '3/4 Sign & send → minting token…',
  confirming:  '4/4 Confirming on-chain…',
  done:        '✅ Token launched!',
  error:       '❌ Launch failed',
};

const RPC = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
// Partner Key из dev.bags.fm — платформа получает комиссии автоматически
const BAGS_PARTNER_WALLET = import.meta.env.VITE_BAGS_PARTNER_WALLET ?? '';
const BAGS_PARTNER_CONFIG = import.meta.env.VITE_BAGS_PARTNER_CONFIG ?? '';

/** Decode base58 tx → Uint8Array → sign & send via Privy v3 useSignAndSendTransaction */
async function signAndSendTx(
  txBase58: string,
  signAndSendTransaction: (args: { transaction: Uint8Array; wallet: any; options?: any; sendOptions?: any }) => Promise<{ signature: Uint8Array }>,
  wallet: any,
): Promise<string> {
  const txBytes = bs58.decode(txBase58);
  const { signature } = await signAndSendTransaction({
    transaction: txBytes,
    wallet,
    // Пробуем оба варианта — Privy v3 может использовать любой
    options:     { skipPreflight: true, preflightCommitment: 'processed' },
    sendOptions: { skipPreflight: true, preflightCommitment: 'processed' },
  });
  return bs58.encode(signature);
}

export function Step3Launch({ state: cs, onDone, onPrev, userId, walletAddr }: Props) {
  const { wallets }              = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [phase,    setPhase]    = useState<LaunchPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mintAddr, setMintAddr] = useState('');

  async function handleLaunch() {
    setPhase('metadata');
    setErrorMsg('');

    const wallet = wallets[0];
    if (!wallet) {
      setErrorMsg('No embedded wallet found. Please log out and back in.');
      setPhase('error');
      return;
    }

    console.group('%c🚀 Token Launch', 'color:#e91e8c;font-weight:bold');
    console.log('wallet:', walletAddr);
    console.log('tokenName:', cs.tokenName || cs.name);
    console.log('ticker:', cs.ticker);

    try {
      // ── Step 1: Upload metadata ───────────────────────────
      console.log('%c[1/4] Uploading metadata...', 'color:#8b5cf6');
      const tokenInfo = await api.uploadTokenInfo({
        name:        cs.tokenName || cs.name,
        ticker:      cs.ticker,
        description: cs.description,
        imageBase64: cs.imageUrl ?? '',
        imageType:   cs.imageType ?? 'image/png',
        telegram:    cs.telegram,
      });
      console.log('✅ tokenMint:', tokenInfo.tokenMint);
      console.log('✅ tokenMetadata:', tokenInfo.tokenMetadata);

      // ── Step 2: Fee-share config ──────────────────────────
      setPhase('fee_config');
      console.log('%c[2/4] Creating fee-share config...', 'color:#8b5cf6');
      const feeConfig = await api.getFeeShareConfig({
        creatorWallet: walletAddr,
        tokenMint:     tokenInfo.tokenMint,
      });
      const configKey = feeConfig.configKey;
      console.log('✅ configKey:', configKey);
      console.log('✅ fee txs to sign:', feeConfig.transactions.length);

      if (!configKey || configKey.length < 32) {
        throw new Error(`Invalid configKey received: "${configKey}"`);
      }

      // Подписываем fee config txs (обычно 3)
      if (feeConfig.transactions.length > 0) {
        setPhase('fee_signing');
        for (let i = 0; i < feeConfig.transactions.length; i++) {
          console.log(`  signing fee tx ${i + 1}/${feeConfig.transactions.length}...`);
          const sig = await signAndSendTx(feeConfig.transactions[i], signAndSendTransaction, wallet);
          console.log(`  ✅ fee tx ${i + 1} sig:`, sig.slice(0, 20) + '...');
        }
      }

      // ── Step 3: Build launch tx ───────────────────────────
      setPhase('building');
      console.log('%c[3/4] Building launch tx...', 'color:#8b5cf6');
      console.log('  params:', { tokenMint: tokenInfo.tokenMint, tokenMetadata: tokenInfo.tokenMetadata, creatorWallet: walletAddr, configKey });
      const txData = await api.buildLaunchTx({
        tokenMint:     tokenInfo.tokenMint,
        tokenMetadata: tokenInfo.tokenMetadata,
        creatorWallet: walletAddr,
        configKey,
      });
      console.log('✅ launch tx length:', txData.transaction?.length);

      if (!txData.transaction) throw new Error('No transaction returned from server');

      // ── Step 4: Sign & send launch tx ────────────────────
      setPhase('signing');
      console.log('%c[4/4] Signing launch tx...', 'color:#8b5cf6');
      console.log('  tx type:', typeof txData.transaction, '| length:', txData.transaction.length);
      const signature = await signAndSendTx(txData.transaction, signAndSendTransaction, wallet);
      console.log('✅ launched! signature:', signature);
      console.log('🌐 solscan:', `https://solscan.io/tx/${signature}`);

      // ── Step 5: Confirm on-chain ──────────────────────────
      setPhase('confirming');
      console.log('⏳ waiting for confirmation...');
      const confirmRpc = RPC.replace(/\/$/, '');
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const resp = await fetch(confirmRpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1,
              method: 'getSignatureStatuses',
              params: [[signature], { searchTransactionHistory: true }],
            }),
          });
          const json = await resp.json() as any;
          const status = json?.result?.value?.[0];
          console.log(`  poll ${i + 1}/30: status =`, status?.confirmationStatus ?? 'pending');
          if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
            if (status.err) throw new Error('On-chain error: ' + JSON.stringify(status.err));
            break;
          }
        } catch (pollErr: any) {
          if (i === 29) throw pollErr;
        }
      }

      const mint = txData.tokenMint ?? tokenInfo.tokenMint;
      console.log('%c🎉 TOKEN LAUNCHED!', 'color:#10b981;font-weight:bold');
      console.log('  mint:', mint);
      console.log('  bags.fm:', `https://bags.fm/${mint}`);
      console.groupEnd();

      setMintAddr(mint);
      setPhase('done');
      onDone(mint);

    } catch (e: any) {
      console.error('%c❌ Launch failed', 'color:red;font-weight:bold', e);
      console.error('  message:', e.message);
      console.error('  cause:', e.cause);
      console.error('  stack:', e.stack);
      console.groupEnd();
      setErrorMsg(e.message ?? String(e));
      setPhase('error');
    }
  }

  const busy = phase !== 'idle' && phase !== 'error';

  return (
    <>
      <div className="launch-summary">
        <div className="ls-row"><span>Token name</span><b>{cs.tokenName || cs.name}</b></div>
        <div className="ls-row"><span>Ticker</span><b>${cs.ticker}</b></div>
        <div className="ls-row"><span>Creator wallet</span><b style={{ fontSize: 10 }}>{walletAddr.slice(0, 16)}…</b></div>
      </div>

      <div className={`launch-status ${phase === 'error' ? 'ls-error' : phase === 'done' ? 'ls-done' : 'ls-loading'}`}>
        {phase !== 'idle' && phase !== 'error' && phase !== 'done' && <Spinner />}
        <span>{LABELS[phase]}</span>
      </div>

      {errorMsg && (
        <div className="field-error" style={{ marginBottom: 10 }}>{errorMsg}</div>
      )}

      {mintAddr && (
        <div className="wallet-reveal" style={{ marginBottom: 12 }}>
          <div className="wr-label">Token Mint Address</div>
          <div className="wr-addr">{mintAddr}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onPrev} disabled={busy}>
          ← Back
        </button>
        <button
          className="btn btn-dark"
          style={{ flex: 1 }}
          onClick={handleLaunch}
          disabled={busy}
        >
          {phase === 'idle' ? '🚀 Launch Token & Create Clan'
            : phase === 'error' ? '↺ Retry'
            : '…'}
        </button>
      </div>
    </>
  );
}
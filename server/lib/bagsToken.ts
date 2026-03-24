import 'dotenv/config';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { BagsSDK } from '@bagsfm/bags-sdk';
import bs58 from 'bs58';

const APIKEY  = process.env.BAGS_API_KEY ?? '';
const RPC     = process.env.VITE_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
const BASE    = 'https://public-api-v2.bags.fm/api/v1';

const PLATFORM_WALLET = process.env.VITE_PLATFORM_WALLET ?? '';

const connection = new Connection(RPC, 'confirmed');
const sdk        = new BagsSDK(APIKEY, connection, 'confirmed');

// ── Step 1: Upload token metadata (form-data → bags.fm) ──────────────────────

export interface TokenInfoInput {
  name:        string;
  ticker:      string;
  description: string;
  imageBase64: string;
  imageType:   string;
  twitter?:    string;
  telegram?:   string;
  website?:    string;
}

export interface TokenInfoResponse {
  tokenMint:     string;
  tokenMetadata: string; // IPFS URL — используется как metadataUrl в launch tx
}

export async function createTokenInfo(data: TokenInfoInput): Promise<TokenInfoResponse> {
  const base64Data  = data.imageBase64.replace(/^data:[^;]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  const ext         = data.imageType.split('/')[1] ?? 'png';

  const form = new FormData();
  form.append('name',        data.name);
  form.append('symbol',      data.ticker);
  form.append('description', data.description);
  form.append('image',       imageBuffer, { filename: `token.${ext}`, contentType: data.imageType });
  if (data.twitter)  form.append('twitter',  data.twitter);
  if (data.telegram) form.append('telegram', data.telegram);
  if (data.website)  form.append('website',  data.website);

  const res  = await fetch(`${BASE}/token-launch/create-token-info`, {
    method:  'POST',
    headers: { 'x-api-key': APIKEY, ...form.getHeaders() },
    body:    form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`bags.fm createTokenInfo ${res.status}: ${text.slice(0, 300)}`);

  const json = JSON.parse(text) as { response: { tokenMint: string; tokenMetadata: string } };
  return {
    tokenMint:     json.response.tokenMint,
    tokenMetadata: json.response.tokenMetadata,
  };
}

// ── Step 2: Create fee share config via SDK ───────────────────────────────────
// Returns configKey + serialized unsigned transactions for Privy to sign

export interface FeeShareResult {
  configKey:    string;          // base58 PublicKey — передаётся в Step 3
  transactions: string[];        // base58 serialized unsigned VersionedTransactions
}

export async function createFeeShareConfigForMint(
  creatorWallet: string,
  tokenMint:     string,
): Promise<FeeShareResult> {
  const payer = new PublicKey(creatorWallet);
  const mint  = new PublicKey(tokenMint);

  if (!PLATFORM_WALLET) {
    console.warn('[bagsToken] VITE_PLATFORM_WALLET not set — fees will go to creator wallet');
  }

  // 100% комиссий → платформенный кошелёк (или создателю если не задан)
  const feeReceiver = PLATFORM_WALLET
    ? new PublicKey(PLATFORM_WALLET)
    : payer;

  console.log('[bagsToken] createFeeShareConfig payer:', payer.toBase58());
  console.log('[bagsToken] createFeeShareConfig feeReceiver:', feeReceiver.toBase58());
  console.log('[bagsToken] createFeeShareConfig baseMint:', mint.toBase58());

  const result = await sdk.config.createBagsFeeShareConfig({
    payer,
    baseMint:    mint,
    feeClaimers: [{ user: feeReceiver, userBps: 10000 }],
  });

  const raw = result.meteoraConfigKey;
  const configKey = typeof raw === 'string'
    ? raw
    : raw?.toBase58?.() ?? raw?.toString?.() ?? String(raw);

  console.log('[bagsToken] configKey:', configKey);
  console.log('[bagsToken] transactions:', result.transactions?.length ?? 0);

  const transactions = (result.transactions ?? []).map(tx =>
    bs58.encode(tx.serialize())
  );

  return { configKey, transactions };
}

// ── Step 3: Build launch transaction via SDK ──────────────────────────────────
// Returns serialized unsigned transaction for Privy to sign

export interface LaunchTxResult {
  transaction: string; // base58 serialized unsigned VersionedTransaction
  tokenMint:   string;
}

export async function createLaunchTransaction(
  tokenMint:     string,
  tokenMetadata: string,
  creatorWallet: string,
  configKey:     string,
): Promise<LaunchTxResult> {
  const mint   = new PublicKey(tokenMint);
  const wallet = new PublicKey(creatorWallet);
  const config = new PublicKey(configKey);

  console.log('[bagsToken] createLaunchTransaction:');
  console.log('  tokenMint:    ', tokenMint);
  console.log('  tokenMetadata:', tokenMetadata);
  console.log('  launchWallet: ', creatorWallet);
  console.log('  configKey:    ', configKey);

  const tx = await sdk.tokenLaunch.createLaunchTransaction({
    metadataUrl:        tokenMetadata,
    tokenMint:          mint,
    launchWallet:       wallet,
    initialBuyLamports: 0,
    configKey:          config,
  });

  const serialized = bs58.encode((tx as VersionedTransaction).serialize());
  console.log('[bagsToken] launch tx serialized, length:', serialized.length);

  return { transaction: serialized, tokenMint };
}
import { Connection, PublicKey } from '@solana/web3.js';
import 'dotenv/config';

function getConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL
    ?? process.env.VITE_SOLANA_RPC_URL
    ?? 'https://api.mainnet-beta.solana.com';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('[solanaTokenBalance] Invalid RPC URL, using public fallback:', url);
    return new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  }
  return new Connection(url, 'confirmed');
}

export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string,
): Promise<number> {
  try {
    const connection = getConnection();
    const wallet = new PublicKey(walletAddress);
    const mint   = new PublicKey(mintAddress);

    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint });
    if (!accounts.value.length) return 0;

    const amount = accounts.value[0].account.data.parsed.info.tokenAmount;
    return parseFloat(amount.uiAmountString ?? '0');
  } catch (e) {
    console.error('[solanaTokenBalance] Error:', (e as Error).message);
    return 0;
  }
}

export async function meetsTokenRequirement(
  walletAddress: string,
  mintAddress:   string,
  required:      number,
): Promise<{ ok: boolean; balance: number }> {
  const balance = await getTokenBalance(walletAddress, mintAddress);
  return { ok: balance >= required, balance };
}
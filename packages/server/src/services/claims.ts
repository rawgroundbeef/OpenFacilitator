/**
 * Claims processing service
 * Handles failure reporting and payout execution
 */
import {
  createClaim,
  getClaimById,
  getClaimByTxHash,
  updateClaimStatus,
  claimExistsForTxHash,
} from '../db/claims.js';
import {
  getRegisteredServerByApiKey,
  hashApiKey,
} from '../db/registered-servers.js';
import { getRefundWallet } from '../db/refund-wallets.js';
import { getResourceOwnerById } from '../db/resource-owners.js';
import { getOrCreateRefundConfig } from '../db/refund-configs.js';
import { decryptRefundPrivateKey, getRefundWalletBalance } from './refund-wallet.js';
import type { ClaimRecord, RegisteredServerRecord } from '../db/types.js';
import { executeSolanaSettlement, getSolanaPublicKey } from '@openfacilitator/core';
import { createWalletClient, createPublicClient, http, parseUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// USDC contract addresses and transfer ABI
const USDC_ADDRESSES: Record<string, Address> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

/**
 * Normalize network identifier to simple format used by refund wallets
 * e.g., 'eip155:8453' -> 'base', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' -> 'solana'
 */
function normalizeNetwork(network: string): string {
  // CAIP-2 EVM networks
  if (network === 'eip155:8453') return 'base';
  if (network === 'eip155:84532') return 'base-sepolia';

  // CAIP-2 Solana
  if (network.startsWith('solana:')) return 'solana';

  // Already simple format
  return network;
}

const TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Check if a network is a Solana network
 */
function isSolanaNetwork(network: string): boolean {
  return network === 'solana' || network === 'solana-mainnet' || network === 'solana-devnet';
}

export interface ReportFailureParams {
  apiKey: string;
  originalTxHash: string;
  userWallet: string;
  amount: string;
  asset: string;
  network: string;
  reason?: string;
}

export interface ReportFailureResult {
  success: boolean;
  claimId?: string;
  error?: string;
}

/**
 * Report a failure and create a claim
 */
export async function reportFailure(params: ReportFailureParams): Promise<ReportFailureResult> {
  const { apiKey, originalTxHash, userWallet, amount, asset, network, reason } = params;

  // Validate API key and get server
  const server = getRegisteredServerByApiKey(apiKey);
  if (!server) {
    return { success: false, error: 'Invalid API key' };
  }

  if (server.active !== 1) {
    return { success: false, error: 'Server is not active' };
  }

  // Get the resource owner
  const resourceOwner = getResourceOwnerById(server.resource_owner_id);
  if (!resourceOwner) {
    return { success: false, error: 'Resource owner not found' };
  }

  // Check if refunds are enabled for this facilitator
  const refundConfig = getOrCreateRefundConfig(resourceOwner.facilitator_id);
  if (refundConfig.enabled !== 1) {
    return { success: false, error: 'Refunds are not enabled for this facilitator' };
  }

  // Check if claim already exists for this transaction
  if (claimExistsForTxHash(originalTxHash)) {
    return { success: false, error: 'Claim already exists for this transaction' };
  }

  // Normalize network identifier (e.g., 'eip155:8453' -> 'base')
  const normalizedNetwork = normalizeNetwork(network);

  // Check if refund wallet exists for this network (scoped to resource owner)
  const refundWallet = getRefundWallet(server.resource_owner_id, normalizedNetwork);
  if (!refundWallet) {
    return { success: false, error: `No refund wallet configured for network: ${normalizedNetwork}` };
  }

  // Create the claim
  try {
    const claim = createClaim({
      resource_owner_id: server.resource_owner_id,
      server_id: server.id,
      original_tx_hash: originalTxHash,
      user_wallet: userWallet,
      amount,
      asset,
      network: normalizedNetwork,
      reason,
    });

    return { success: true, claimId: claim.id };
  } catch (error) {
    console.error('Failed to create claim:', error);
    return { success: false, error: 'Failed to create claim' };
  }
}

export interface ExecutePayoutResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Execute a payout for an approved claim
 */
export async function executeClaimPayout(claimId: string): Promise<ExecutePayoutResult> {
  const claim = getClaimById(claimId);
  if (!claim) {
    return { success: false, error: 'Claim not found' };
  }

  if (claim.status !== 'approved') {
    return { success: false, error: `Claim is not approved (status: ${claim.status})` };
  }

  // Get refund wallet for this network (using resource_owner_id)
  const privateKey = decryptRefundPrivateKey(claim.resource_owner_id, claim.network);
  if (!privateKey) {
    return { success: false, error: 'Refund wallet not found or unable to decrypt' };
  }

  // Check balance before attempting payout
  const balance = await getRefundWalletBalance(claim.resource_owner_id, claim.network);
  if (!balance || BigInt(balance.balance) < BigInt(claim.amount)) {
    return {
      success: false,
      error: `Insufficient refund wallet balance. Required: ${claim.amount}, Available: ${balance?.balance || 0}`,
    };
  }

  try {
    let transactionHash: string;

    if (isSolanaNetwork(claim.network)) {
      // Solana payout - use direct SPL token transfer
      const result = await executeSolanaTransfer({
        network: claim.network as 'solana' | 'solana-devnet',
        privateKey,
        recipient: claim.user_wallet,
        amount: claim.amount,
        asset: claim.asset,
      });

      if (!result.success) {
        return { success: false, error: result.errorMessage || 'Solana transfer failed' };
      }

      transactionHash = result.transactionHash!;
    } else {
      // EVM payout - use standard ERC20 transfer
      const result = await executeEVMTransfer({
        network: claim.network,
        privateKey,
        recipient: claim.user_wallet as Address,
        amount: claim.amount,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'EVM transfer failed' };
      }

      transactionHash = result.transactionHash!;
    }

    // Update claim status to paid
    updateClaimStatus(claimId, 'paid', transactionHash);

    return { success: true, transactionHash };
  } catch (error) {
    console.error('Payout execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during payout',
    };
  }
}

/**
 * Execute a Solana SPL token transfer
 */
async function executeSolanaTransfer(params: {
  network: 'solana' | 'solana-devnet';
  privateKey: string;
  recipient: string;
  amount: string;
  asset: string;
}): Promise<{ success: boolean; transactionHash?: string; errorMessage?: string }> {
  // Import required Solana libraries
  const {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
  } = await import('@solana/web3.js');
  const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    getAccount,
    createAssociatedTokenAccountInstruction,
  } = await import('@solana/spl-token');
  const bs58 = await import('bs58');

  const rpcUrl = params.network === 'solana-devnet'
    ? (process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com')
    : (process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

  const connection = new Connection(rpcUrl, 'confirmed');
  const senderKeypair = Keypair.fromSecretKey(bs58.default.decode(params.privateKey));
  const recipientPubkey = new PublicKey(params.recipient);
  const mintPubkey = new PublicKey(params.asset);

  try {
    // Get token accounts
    const senderAta = await getAssociatedTokenAddress(mintPubkey, senderKeypair.publicKey);
    const recipientAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

    // Build transaction
    const transaction = new Transaction();

    // Check if recipient ATA exists, if not create it
    try {
      await getAccount(connection, recipientAta);
    } catch {
      // ATA doesn't exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderKeypair.publicKey,
          recipientAta,
          recipientPubkey,
          mintPubkey
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        senderAta,
        recipientAta,
        senderKeypair.publicKey,
        BigInt(params.amount)
      )
    );

    // Get recent blockhash and sign
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderKeypair.publicKey;
    transaction.sign(senderKeypair);

    // Send and confirm
    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    return { success: true, transactionHash: signature };
  } catch (error) {
    console.error('Solana transfer error:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute an EVM ERC20 transfer
 */
async function executeEVMTransfer(params: {
  network: string;
  privateKey: string;
  recipient: Address;
  amount: string;
}): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  const usdcAddress = USDC_ADDRESSES[params.network];
  if (!usdcAddress) {
    return { success: false, error: `Unsupported network: ${params.network}` };
  }

  try {
    const account = privateKeyToAccount(params.privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [params.recipient, BigInt(params.amount)],
    });

    // Wait for confirmation
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { success: true, transactionHash: hash };
  } catch (error) {
    console.error('EVM transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Approve a claim (changes status from pending to approved)
 */
export function approveClaim(claimId: string): ClaimRecord | null {
  const claim = getClaimById(claimId);
  if (!claim || claim.status !== 'pending') {
    return null;
  }
  return updateClaimStatus(claimId, 'approved');
}

/**
 * Reject a claim
 */
export function rejectClaim(claimId: string): ClaimRecord | null {
  const claim = getClaimById(claimId);
  if (!claim || !['pending', 'approved'].includes(claim.status)) {
    return null;
  }
  return updateClaimStatus(claimId, 'rejected');
}

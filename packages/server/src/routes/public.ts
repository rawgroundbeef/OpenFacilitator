import { Router, type Request, type Response, type IRouter } from 'express';
import { createFacilitator, type FacilitatorConfig, type TokenConfig, getSolanaPublicKey } from '@openfacilitator/core';
import { z } from 'zod';
import { createTransaction, updateTransactionStatus } from '../db/transactions.js';
import type { Hex } from 'viem';

const router: IRouter = Router();

// Payment requirements schema (shared)
const paymentRequirementsSchema = z.object({
  scheme: z.string(),
  network: z.string(),
  maxAmountRequired: z.string(),
  resource: z.string().default(''),
  asset: z.string(),
  payTo: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  maxTimeoutSeconds: z.number().optional(),
  outputSchema: z.record(z.unknown()).optional(),
  extra: z.record(z.unknown()).optional(),
});

const verifyRequestSchema = z.object({
  x402Version: z.number().optional(),
  paymentPayload: z.union([z.string(), z.object({}).passthrough()]),
  paymentRequirements: paymentRequirementsSchema,
});

const settleRequestSchema = verifyRequestSchema;

/**
 * Normalize paymentPayload to string format
 */
function normalizePaymentPayload(payload: string | object): string {
  if (typeof payload === 'string') {
    return payload;
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Get free facilitator configuration from environment
 */
function getFreeFacilitatorConfig(): { config: FacilitatorConfig; evmPrivateKey?: string; solanaPrivateKey?: string } | null {
  const evmPrivateKey = process.env.FREE_FACILITATOR_EVM_KEY;
  const solanaPrivateKey = process.env.FREE_FACILITATOR_SOLANA_KEY;
  const evmAddress = process.env.FREE_FACILITATOR_EVM_ADDRESS;
  const solanaAddress = process.env.FREE_FACILITATOR_SOLANA_ADDRESS;

  // At minimum we need one wallet configured
  if (!evmPrivateKey && !solanaPrivateKey) {
    return null;
  }

  // Build supported chains and tokens based on what's configured
  const supportedChains: (number | string)[] = [];
  const supportedTokens: TokenConfig[] = [];

  // Add Base mainnet if EVM key is configured
  if (evmPrivateKey) {
    supportedChains.push(8453); // Base mainnet
    supportedTokens.push({
      symbol: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      chainId: 8453,
    });
  }

  // Add Solana mainnet if Solana key is configured
  if (solanaPrivateKey) {
    supportedChains.push('solana');
    supportedTokens.push({
      symbol: 'USDC',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      chainId: 'solana',
    });
  }

  const config: FacilitatorConfig = {
    id: 'free-facilitator',
    name: 'OpenFacilitator Free',
    subdomain: 'free',
    ownerAddress: (evmAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    supportedChains,
    supportedTokens,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { config, evmPrivateKey, solanaPrivateKey };
}

/**
 * GET /free/supported - Get supported payment networks (no auth required)
 */
router.get('/free/supported', (_req: Request, res: Response) => {
  const facilitatorData = getFreeFacilitatorConfig();

  if (!facilitatorData) {
    res.status(503).json({
      error: 'Free facilitator not configured',
      message: 'The free facilitator is not available. Please self-host or use a managed instance.',
    });
    return;
  }

  const facilitator = createFacilitator(facilitatorData.config);
  const supported = facilitator.getSupported();

  // Add feePayer for Solana if configured
  if (facilitatorData.solanaPrivateKey) {
    try {
      const solanaFeePayer = getSolanaPublicKey(facilitatorData.solanaPrivateKey);
      supported.kinds = supported.kinds.map(kind => {
        if (kind.network === 'solana' || kind.network === 'solana-mainnet') {
          return {
            ...kind,
            extra: {
              ...kind.extra,
              feePayer: solanaFeePayer,
            },
          };
        }
        return kind;
      });
    } catch (e) {
      console.error('Failed to get Solana fee payer address:', e);
    }
  }

  res.json(supported);
});

/**
 * POST /free/verify - Verify a payment (no auth required)
 */
router.post('/free/verify', async (req: Request, res: Response) => {
  try {
    const facilitatorData = getFreeFacilitatorConfig();

    if (!facilitatorData) {
      res.status(503).json({
        valid: false,
        invalidReason: 'Free facilitator not configured',
      });
      return;
    }

    const parsed = verifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        valid: false,
        invalidReason: 'Invalid request format',
        details: parsed.error.issues,
      });
      return;
    }

    const paymentPayload = normalizePaymentPayload(parsed.data.paymentPayload);
    const { paymentRequirements } = parsed.data;

    const facilitator = createFacilitator(facilitatorData.config);
    const result = await facilitator.verify(paymentPayload, paymentRequirements);

    // Log verification (for analytics)
    if (result.payer) {
      createTransaction({
        facilitator_id: 'free-facilitator',
        type: 'verify',
        network: paymentRequirements.network,
        from_address: result.payer,
        to_address: paymentRequirements.payTo || 'unknown',
        amount: paymentRequirements.maxAmountRequired,
        asset: paymentRequirements.asset,
        status: result.valid ? 'success' : 'failed',
        error_message: result.invalidReason,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Free verify error:', error);
    res.status(500).json({
      valid: false,
      invalidReason: 'Internal server error',
    });
  }
});

/**
 * POST /free/settle - Settle a payment (no auth required)
 */
router.post('/free/settle', async (req: Request, res: Response) => {
  try {
    const facilitatorData = getFreeFacilitatorConfig();

    if (!facilitatorData) {
      res.status(503).json({
        success: false,
        errorMessage: 'Free facilitator not configured',
      });
      return;
    }

    const parsed = settleRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errorMessage: 'Invalid request format',
        details: parsed.error.issues,
      });
      return;
    }

    const paymentPayload = normalizePaymentPayload(parsed.data.paymentPayload);
    const { paymentRequirements } = parsed.data;

    const facilitator = createFacilitator(facilitatorData.config);

    // Determine which private key to use based on network
    const isSolanaNetwork = paymentRequirements.network === 'solana' || 
                            paymentRequirements.network === 'solana-mainnet' || 
                            paymentRequirements.network === 'solana-devnet';

    let privateKey: string | undefined;

    if (isSolanaNetwork) {
      if (!facilitatorData.solanaPrivateKey) {
        res.status(503).json({
          success: false,
          errorMessage: 'Solana not available on free facilitator',
        });
        return;
      }
      privateKey = facilitatorData.solanaPrivateKey;
    } else {
      if (!facilitatorData.evmPrivateKey) {
        res.status(503).json({
          success: false,
          errorMessage: 'EVM chains not available on free facilitator',
        });
        return;
      }
      privateKey = facilitatorData.evmPrivateKey;
    }

    const result = await facilitator.settle(paymentPayload, paymentRequirements, privateKey);

    // Log settlement
    const decoded = Buffer.from(paymentPayload, 'base64').toString('utf-8');
    const parsedPayload = JSON.parse(decoded);
    
    let fromAddress = 'unknown';
    if (isSolanaNetwork) {
      fromAddress = paymentRequirements.payTo || 'solana-payer';
    } else {
      fromAddress = parsedPayload.authorization?.from || 'unknown';
    }

    const transaction = createTransaction({
      facilitator_id: 'free-facilitator',
      type: 'settle',
      network: paymentRequirements.network,
      from_address: fromAddress,
      to_address: paymentRequirements.payTo || 'unknown',
      amount: paymentRequirements.maxAmountRequired,
      asset: paymentRequirements.asset,
      status: result.success ? 'pending' : 'failed',
      transaction_hash: result.transactionHash,
      error_message: result.errorMessage,
    });

    if (result.success && transaction) {
      updateTransactionStatus(transaction.id, 'success');
    }

    res.json(result);
  } catch (error) {
    console.error('Free settle error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Internal server error',
    });
  }
});

/**
 * GET /free/info - Get info about the free facilitator
 */
router.get('/free/info', (_req: Request, res: Response) => {
  const facilitatorData = getFreeFacilitatorConfig();
  
  const evmAddress = process.env.FREE_FACILITATOR_EVM_ADDRESS;
  const solanaAddress = process.env.FREE_FACILITATOR_SOLANA_ADDRESS;

  res.json({
    name: 'OpenFacilitator Free',
    description: 'Free public x402 payment facilitator. No account required.',
    endpoints: {
      supported: 'https://api.openfacilitator.io/free/supported',
      verify: 'https://api.openfacilitator.io/free/verify',
      settle: 'https://api.openfacilitator.io/free/settle',
    },
    networks: {
      base: facilitatorData?.evmPrivateKey ? {
        available: true,
        feePayerAddress: evmAddress,
      } : { available: false },
      solana: facilitatorData?.solanaPrivateKey ? {
        available: true,
        feePayerAddress: solanaAddress,
      } : { available: false },
    },
    limits: {
      note: 'Fair use policy applies. For high-volume usage, please self-host or get a managed instance.',
    },
  });
});

export { router as publicRouter };


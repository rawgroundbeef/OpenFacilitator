import { Router, type Request, type Response, type IRouter } from 'express';
import { createFacilitator, type FacilitatorConfig, type TokenConfig, getSolanaPublicKey, networkToCaip2 } from '@openfacilitator/core';
import { z } from 'zod';
import { requireFacilitator } from '../middleware/tenant.js';
import { createTransaction, updateTransactionStatus } from '../db/transactions.js';
import { decryptPrivateKey } from '../utils/crypto.js';
import type { Hex } from 'viem';

const router: IRouter = Router();

// Payment requirements schema (shared)
const paymentRequirementsSchema = z.object({
  scheme: z.string(),
  network: z.string(),
  maxAmountRequired: z.string(),
  resource: z.string().default(''),
  asset: z.string(), // Token contract address
  payTo: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  maxTimeoutSeconds: z.number().optional(),
  outputSchema: z.record(z.unknown()).optional(),
  extra: z.record(z.unknown()).optional(),
});

// Validation schemas - accept both string (base64) and object for paymentPayload
const verifyRequestSchema = z.object({
  x402Version: z.number().optional(), // Some clients omit this
  paymentPayload: z.union([z.string(), z.object({}).passthrough()]),
  paymentRequirements: paymentRequirementsSchema,
});

const settleRequestSchema = verifyRequestSchema;

/**
 * Normalize paymentPayload to string format
 * Accepts both base64 string and object, returns string
 */
function normalizePaymentPayload(payload: string | object): string {
  if (typeof payload === 'string') {
    return payload;
  }
  // If it's an object, base64 encode it
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Check if a network identifier is a Solana network
 */
function isSolanaNetwork(network: string): boolean {
  return network === 'solana' ||
         network === 'solana-mainnet' ||
         network === 'solana-devnet' ||
         network.startsWith('solana:');
}

/**
 * GET /favicon.ico - Serve facilitator's custom favicon (or default)
 */
router.get('/favicon.ico', requireFacilitator, (req: Request, res: Response) => {
  const record = req.facilitator!;

  if (record.favicon) {
    // Decode base64 favicon and serve it
    const isDataUrl = record.favicon.startsWith('data:');
    let mimeType = 'image/x-icon';
    let base64Data = record.favicon;

    if (isDataUrl) {
      // Extract mime type and data from data URL
      const match = record.favicon.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(buffer);
    return;
  }

  // No custom favicon - redirect to default or serve a default
  // Serve the OpenFacilitator default favicon
  res.redirect('https://openfacilitator.io/favicon.ico');
});

/**
 * GET /supported - Get supported payment networks and tokens
 */
router.get('/supported', requireFacilitator, (req: Request, res: Response) => {
  const record = req.facilitator!;

  // Build facilitator config from database record
  const config: FacilitatorConfig = {
    id: record.id,
    name: record.name,
    subdomain: record.subdomain,
    customDomain: record.custom_domain || undefined,
    ownerAddress: record.owner_address as `0x${string}`,
    supportedChains: JSON.parse(record.supported_chains),
    supportedTokens: JSON.parse(record.supported_tokens) as TokenConfig[],
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };

  const facilitator = createFacilitator(config);
  const supported = facilitator.getSupported();

  // Build signers object with namespace prefixes
  const signers: Record<string, string[]> = {};

  // Add EVM signer address if available
  if (record.owner_address) {
    signers['eip155:*'] = [record.owner_address];
  }

  // Add feePayer for Solana networks and build signers
  if (record.encrypted_solana_private_key) {
    try {
      const solanaPrivateKey = decryptPrivateKey(record.encrypted_solana_private_key);
      const solanaFeePayer = getSolanaPublicKey(solanaPrivateKey);

      // Add to signers
      signers['solana:*'] = [solanaFeePayer];

      // Add feePayer to Solana kinds (both v1 human-readable and v2 CAIP-2 formats)
      supported.kinds = supported.kinds.map(kind => {
        if (isSolanaNetwork(kind.network)) {
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

  // Add signers and extensions to response
  supported.signers = signers;
  supported.extensions = [];

  res.json(supported);
});

/**
 * POST /verify - Verify a payment payload
 */
router.post('/verify', requireFacilitator, async (req: Request, res: Response) => {
  try {
    const parsed = verifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
      return;
    }

    // Normalize payload - accept both string and object format
    const paymentPayload = normalizePaymentPayload(parsed.data.paymentPayload);
    const { paymentRequirements } = parsed.data;
    const record = req.facilitator!;

    // Build facilitator config
    const config: FacilitatorConfig = {
      id: record.id,
      name: record.name,
      subdomain: record.subdomain,
      customDomain: record.custom_domain || undefined,
      ownerAddress: record.owner_address as `0x${string}`,
      supportedChains: JSON.parse(record.supported_chains),
      supportedTokens: JSON.parse(record.supported_tokens) as TokenConfig[],
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };

    const facilitator = createFacilitator(config);
    const result = await facilitator.verify(paymentPayload, paymentRequirements);

    // Log the verification attempt
    if (result.payer) {
      createTransaction({
        facilitator_id: record.id,
        type: 'verify',
        network: paymentRequirements.network,
        from_address: result.payer,
        to_address: record.owner_address,
        amount: paymentRequirements.maxAmountRequired,
        asset: paymentRequirements.asset,
        status: result.valid ? 'success' : 'failed',
        error_message: result.invalidReason,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      valid: false,
      invalidReason: 'Internal server error',
    });
  }
});

/**
 * POST /settle - Settle a payment
 */
router.post('/settle', requireFacilitator, async (req: Request, res: Response) => {
  try {
    const parsed = settleRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
      return;
    }

    // Normalize payload - accept both string and object format
    const paymentPayload = normalizePaymentPayload(parsed.data.paymentPayload);
    const { paymentRequirements } = parsed.data;
    const record = req.facilitator!;

    // Build facilitator config
    const config: FacilitatorConfig = {
      id: record.id,
      name: record.name,
      subdomain: record.subdomain,
      customDomain: record.custom_domain || undefined,
      ownerAddress: record.owner_address as `0x${string}`,
      supportedChains: JSON.parse(record.supported_chains),
      supportedTokens: JSON.parse(record.supported_tokens) as TokenConfig[],
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };

    const facilitator = createFacilitator(config);

    // Determine which private key to use based on network (supports both v1 and CAIP-2 formats)
    const isSolana = isSolanaNetwork(paymentRequirements.network);
    
    let privateKey: string | undefined;
    
    if (isSolana) {
      // Use Solana wallet for Solana networks
      if (record.encrypted_solana_private_key) {
        try {
          privateKey = decryptPrivateKey(record.encrypted_solana_private_key);
        } catch (e) {
          console.error('Failed to decrypt Solana private key:', e);
          res.status(500).json({
            success: false,
            errorMessage: 'Failed to decrypt Solana wallet',
          });
          return;
        }
      } else {
        res.status(400).json({
          success: false,
          errorMessage: 'Solana wallet not configured. Please set up a Solana wallet in the dashboard.',
        });
        return;
      }
    } else {
      // Use EVM wallet for EVM networks (Base, Ethereum, etc.)
      if (record.encrypted_private_key) {
        try {
          privateKey = decryptPrivateKey(record.encrypted_private_key);
        } catch (e) {
          console.error('Failed to decrypt EVM private key:', e);
          res.status(500).json({
            success: false,
            errorMessage: 'Failed to decrypt EVM wallet',
          });
          return;
        }
      } else {
        res.status(400).json({
          success: false,
          errorMessage: 'EVM wallet not configured. Please set up an EVM wallet in the dashboard.',
        });
        return;
      }
    }

    const result = await facilitator.settle(paymentPayload, paymentRequirements, privateKey);

    // Parse payload to get from address
    const decoded = Buffer.from(paymentPayload, 'base64').toString('utf-8');
    const parsedPayload = JSON.parse(decoded);
    
    // Extract from_address based on network type
    // Handle both flat and nested payload structures
    let fromAddress = 'unknown';
    if (isSolana) {
      // For Solana, the payer is the fee payer - use payTo from requirements as fallback
      // In x402, the payer signs the transaction, we don't have direct access to their address
      // Use the configured feePayer or payTo as identifier
      fromAddress = paymentRequirements.payTo || 'solana-payer';
    } else {
      // For EVM, use authorization.from - handle both nested and flat formats
      // Format 1: { authorization: { from: ... } }
      // Format 2: { payload: { authorization: { from: ... } } }
      const authorization = parsedPayload.authorization || parsedPayload.payload?.authorization;
      fromAddress = authorization?.from || 'unknown';
    }
    
    // Log the settlement attempt
    const transaction = createTransaction({
      facilitator_id: record.id,
      type: 'settle',
      network: paymentRequirements.network,
      from_address: fromAddress,
      to_address: record.owner_address,
      amount: paymentRequirements.maxAmountRequired,
      asset: paymentRequirements.asset,
      status: result.success ? 'pending' : 'failed',
      transaction_hash: result.transactionHash,
      error_message: result.errorMessage,
    });

    if (result.success && transaction) {
      // Update to success after transaction is confirmed
      // TODO: Implement transaction confirmation monitoring
      updateTransactionStatus(transaction.id, 'success');
    }

    res.json(result);
  } catch (error) {
    console.error('Settle error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Internal server error',
    });
  }
});

export { router as facilitatorRouter };


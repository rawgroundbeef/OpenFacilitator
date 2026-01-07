/**
 * Stats API - x402 protected endpoint for platform statistics
 *
 * GET /stats - Returns global and per-facilitator statistics
 * Requires $5 USDC payment via x402 protocol
 */
import { Router, type Request, type Response, type IRouter } from 'express';
import { getGlobalStats } from '../db/transactions.js';

const router: IRouter = Router();

// Configuration
const STATS_PRICE_ATOMIC = '5000000'; // $5 USDC (6 decimals)
const USDC_SOLANA_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Free facilitator endpoint (from SDK default)
const FACILITATOR_URL = 'https://pay.openfacilitator.io';

// Payment recipient - free facilitator's Solana address
const STATS_PAY_TO = 'Hbe1vdFs4EQVVAzcV12muHhr6DEKwrT9roMXGPLxLBLP';

/**
 * Build payment requirements for the stats endpoint
 */
function getPaymentRequirements() {
  return {
    scheme: 'exact',
    network: 'solana',
    maxAmountRequired: STATS_PRICE_ATOMIC,
    resource: '/stats',
    asset: USDC_SOLANA_MINT,
    payTo: STATS_PAY_TO,
    description: 'OpenFacilitator Platform Statistics - $5 per request',
  };
}

/**
 * GET /stats - Platform statistics (x402 protected)
 */
router.get('/stats', async (req: Request, res: Response) => {
  const paymentHeader = req.header('X-PAYMENT');
  const requirements = getPaymentRequirements();

  // If no payment provided, return 402 with requirements
  if (!paymentHeader) {
    res.status(402).json({
      x402Version: 1,
      accepts: [requirements],
      error: 'Payment Required',
      message: 'This endpoint requires a $5 USDC payment via x402',
    });
    return;
  }

  try {

    // Decode payment payload
    let paymentPayload: unknown;
    try {
      const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      paymentPayload = JSON.parse(decoded);
    } catch {
      res.status(400).json({
        error: 'Invalid payment payload',
        message: 'Could not decode X-PAYMENT header',
      });
      return;
    }

    // Step 1: Verify payment with facilitator
    const verifyResponse = await fetch(`${FACILITATOR_URL}/free/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements: requirements,
      }),
    });

    const verifyResult = (await verifyResponse.json()) as {
      valid?: boolean;
      invalidReason?: string;
    };

    if (!verifyResult.valid) {
      res.status(402).json({
        error: 'Payment verification failed',
        reason: verifyResult.invalidReason || 'Unknown verification error',
        accepts: [requirements],
      });
      return;
    }

    // Step 2: Settle payment
    const settleResponse = await fetch(`${FACILITATOR_URL}/free/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements: requirements,
      }),
    });

    const settleResult = (await settleResponse.json()) as {
      success?: boolean;
      transactionHash?: string;
      errorMessage?: string;
    };

    if (!settleResult.success) {
      res.status(402).json({
        error: 'Payment settlement failed',
        reason: settleResult.errorMessage || 'Unknown settlement error',
        accepts: [requirements],
      });
      return;
    }

    // Payment successful - return stats
    const stats = getGlobalStats();

    res.json({
      success: true,
      paymentTxHash: settleResult.transactionHash,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error('[Stats] Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /stats/price - Get the current price for stats access (no payment required)
 */
router.get('/stats/price', (_req: Request, res: Response) => {
  res.json({
    price: {
      amount: STATS_PRICE_ATOMIC,
      amountUsd: '5.00',
      asset: USDC_SOLANA_MINT,
      network: 'solana',
    },
    payTo: STATS_PAY_TO,
  });
});

export { router as statsRouter };

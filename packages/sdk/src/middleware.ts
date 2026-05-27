/**
 * Payment middleware for Express and Hono.
 */

import { OpenFacilitator } from './client.js';
import type { PaymentPayload, PaymentRequirements } from './types.js';
import { isPaymentPayload } from './utils.js';

// ============ Types ============

export interface PaymentContext {
  /** Transaction hash from settlement */
  transactionHash: string;
  /** User's wallet address (payer) */
  userWallet: string;
  /** Payment amount in atomic units */
  amount: string;
  /** Asset/token address */
  asset: string;
  /** Network identifier (e.g., "base", "solana") */
  network: string;
}

/**
 * Express request with payment context attached.
 */
export interface PaymentRequest {
  paymentContext?: PaymentContext;
}

interface HonoContext {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

// ============ Helper: Extract Payment Context ============

/**
 * Helper to create PaymentContext from settle response and payment payload.
 */
export function createPaymentContext(
  settleResponse: { transaction: string; payer: string; network: string },
  paymentPayload: Record<string, unknown>,
  requirements?: { maxAmountRequired?: string; amount?: string; asset?: string }
): PaymentContext {
  const payload = paymentPayload.payload as Record<string, unknown> | undefined;
  const authorization = payload?.authorization as Record<string, unknown> | undefined;

  const amount =
    (authorization?.amount as string) ||
    (payload?.amount as string) ||
    requirements?.amount ||
    requirements?.maxAmountRequired ||
    '0';

  const asset =
    (authorization?.asset as string) ||
    (payload?.asset as string) ||
    requirements?.asset ||
    '';

  return {
    transactionHash: settleResponse.transaction,
    userWallet: settleResponse.payer,
    amount,
    asset,
    network: settleResponse.network,
  };
}

function createAccepts(requirementsArray: PaymentRequirements[]) {
  return requirementsArray.map((requirements) => {
    const extra = requirements.extra ? { ...requirements.extra } : undefined;

    return {
      scheme: requirements.scheme,
      network: requirements.network,
      amount: 'maxAmountRequired' in requirements ? requirements.maxAmountRequired : requirements.amount,
      asset: requirements.asset,
      payTo: requirements.payTo,
      maxTimeoutSeconds: requirements.maxTimeoutSeconds || 300,
      ...(extra && Object.keys(extra).length > 0 ? { extra } : {}),
    };
  });
}

function getPaymentNetwork(paymentPayload: PaymentPayload): string | undefined {
  return paymentPayload.x402Version === 2
    ? (paymentPayload as { accepted?: { network?: string } }).accepted?.network
    : (paymentPayload as { network?: string }).network;
}

function parseNodePaymentHeader(paymentString: string): PaymentPayload {
  const decoded = Buffer.from(paymentString, 'base64').toString('utf-8');
  const paymentPayload = JSON.parse(decoded);
  if (!isPaymentPayload(paymentPayload)) {
    throw new Error('Invalid payment payload structure');
  }
  return paymentPayload;
}

function parseWebPaymentHeader(paymentString: string): PaymentPayload {
  const decoded = atob(paymentString);
  const paymentPayload = JSON.parse(decoded);
  if (!isPaymentPayload(paymentPayload)) {
    throw new Error('Invalid payment payload structure');
  }
  return paymentPayload;
}

// ============ x402 Payment Middleware ============

export interface PaymentMiddlewareConfig {
  /** Facilitator instance or URL */
  facilitator: OpenFacilitator | string;
  /** Function to get payment requirements for the request (single or multiple for multi-network) */
  getRequirements: (req: unknown) => PaymentRequirements | PaymentRequirements[] | Promise<PaymentRequirements | PaymentRequirements[]>;
  /** Optional: Custom 402 response handler */
  on402?: (req: unknown, res: unknown, requirements: PaymentRequirements[]) => void | Promise<void>;
}

/**
 * Create x402 payment middleware that handles verification and settlement.
 */
export function createPaymentMiddleware(config: PaymentMiddlewareConfig) {
  const facilitator = typeof config.facilitator === 'string'
    ? new OpenFacilitator({ url: config.facilitator })
    : config.facilitator;

  return async (
    req: { headers: Record<string, string | string[] | undefined>; url?: string; paymentContext?: PaymentContext },
    res: {
      status: (code: number) => { json: (body: unknown) => void };
      locals?: Record<string, unknown>;
    },
    next: (error?: unknown) => void
  ) => {
    try {
      const rawRequirements = await config.getRequirements(req);
      const requirementsArray = Array.isArray(rawRequirements) ? rawRequirements : [rawRequirements];
      const accepts = createAccepts(requirementsArray);

      const paymentHeader = req.headers['x-payment'];
      const paymentString = Array.isArray(paymentHeader) ? paymentHeader[0] : paymentHeader;

      if (!paymentString) {
        if (config.on402) {
          await config.on402(req, res, requirementsArray);
        } else {
          res.status(402).json({
            x402Version: 2,
            error: 'Payment Required',
            accepts,
          });
        }
        return;
      }

      let paymentPayload: PaymentPayload;
      try {
        paymentPayload = parseNodePaymentHeader(paymentString);
      } catch {
        res.status(400).json({ error: 'Invalid X-PAYMENT header' });
        return;
      }

      const paymentNetwork = getPaymentNetwork(paymentPayload);
      const requirements = requirementsArray.find((r) => r.network === paymentNetwork) || requirementsArray[0];

      const verifyResult = await facilitator.verify(paymentPayload, requirements);
      if (!verifyResult.isValid) {
        res.status(402).json({
          x402Version: 2,
          error: 'Payment verification failed',
          reason: verifyResult.invalidReason,
          accepts,
        });
        return;
      }

      const settleResult = await facilitator.settle(paymentPayload, requirements);
      if (!settleResult.success) {
        res.status(402).json({
          x402Version: 2,
          error: 'Payment settlement failed',
          reason: settleResult.errorReason,
          accepts,
        });
        return;
      }

      const paymentContext = createPaymentContext(
        settleResult,
        paymentPayload as unknown as Record<string, unknown>,
        requirements
      );

      req.paymentContext = paymentContext;
      if (res.locals) {
        res.locals.paymentContext = paymentContext;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============ Hono x402 Payment Middleware ============

export interface HonoPaymentConfig {
  /** Facilitator instance or URL */
  facilitator: OpenFacilitator | string;
  /** Function to get payment requirements for the request (single or multiple for multi-network) */
  getRequirements: (c: HonoContext) => PaymentRequirements | PaymentRequirements[] | Promise<PaymentRequirements | PaymentRequirements[]>;
}

/**
 * Create Hono x402 payment middleware.
 */
export function honoPaymentMiddleware(config: HonoPaymentConfig) {
  const facilitator = typeof config.facilitator === 'string'
    ? new OpenFacilitator({ url: config.facilitator })
    : config.facilitator;

  return async (
    c: HonoContext & {
      req: { header: (name: string) => string | undefined; url: string };
      json: (body: unknown, status?: number) => Response;
    },
    next: () => Promise<void>
  ) => {
    const rawRequirements = await config.getRequirements(c);
    const requirementsArray = Array.isArray(rawRequirements) ? rawRequirements : [rawRequirements];
    const accepts = createAccepts(requirementsArray);

    const paymentString = c.req.header('x-payment');

    if (!paymentString) {
      return c.json({
        x402Version: 2,
        error: 'Payment Required',
        accepts,
      }, 402);
    }

    let paymentPayload: PaymentPayload;
    try {
      paymentPayload = parseWebPaymentHeader(paymentString);
    } catch {
      return c.json({ error: 'Invalid X-PAYMENT header' }, 400);
    }

    const paymentNetwork = getPaymentNetwork(paymentPayload);
    const requirements = requirementsArray.find((r) => r.network === paymentNetwork) || requirementsArray[0];

    const verifyResult = await facilitator.verify(paymentPayload, requirements);
    if (!verifyResult.isValid) {
      return c.json({
        x402Version: 2,
        error: 'Payment verification failed',
        reason: verifyResult.invalidReason,
        accepts,
      }, 402);
    }

    const settleResult = await facilitator.settle(paymentPayload, requirements);
    if (!settleResult.success) {
      return c.json({
        x402Version: 2,
        error: 'Payment settlement failed',
        reason: settleResult.errorReason,
        accepts,
      }, 402);
    }

    const paymentContext = createPaymentContext(
      settleResult,
      paymentPayload as unknown as Record<string, unknown>,
      requirements
    );
    c.set('paymentContext', paymentContext);

    await next();
  };
}

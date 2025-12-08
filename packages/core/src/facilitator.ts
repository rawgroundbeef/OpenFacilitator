import { createPublicClient, http, type Address, type Hex } from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import type {
  FacilitatorConfig,
  PaymentRequirements,
  SettleResponse,
  SupportedKind,
  SupportedResponse,
  VerifyResponse,
  X402PaymentPayload,
} from './types.js';
import { getChainIdFromNetwork, getNetworkFromChainId, defaultChains } from './chains.js';

/**
 * Chain ID to viem chain mapping
 */
const viemChains = {
  8453: base,
  84532: baseSepolia,
  1: mainnet,
  11155111: sepolia,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPublicClient = ReturnType<typeof createPublicClient<any, any>>;

/**
 * Facilitator class for handling x402 payment verification and settlement
 */
export class Facilitator {
  private config: FacilitatorConfig;
  private clients: Map<number, AnyPublicClient> = new Map();

  constructor(config: FacilitatorConfig) {
    this.config = config;
    this.initializeClients();
  }

  /**
   * Initialize viem clients for supported chains
   */
  private initializeClients(): void {
    for (const chainId of this.config.supportedChains) {
      const chain = viemChains[chainId as keyof typeof viemChains];
      const chainConfig = defaultChains[chainId];

      if (chain && chainConfig) {
        const client = createPublicClient({
          chain,
          transport: http(chainConfig.rpcUrl),
        }) as AnyPublicClient;
        this.clients.set(chainId, client);
      }
    }
  }

  /**
   * Get the facilitator configuration
   */
  getConfig(): FacilitatorConfig {
    return this.config;
  }

  /**
   * Get supported payment kinds for this facilitator
   */
  getSupported(): SupportedResponse {
    const kinds: SupportedKind[] = [];

    for (const token of this.config.supportedTokens) {
      const network = getNetworkFromChainId(token.chainId);
      if (network) {
        kinds.push({
          scheme: 'exact',
          network,
          asset: token.address,
        });
      }
    }

    return {
      x402Version: 1,
      kinds,
    };
  }

  /**
   * Verify a payment payload
   */
  async verify(
    paymentPayload: string,
    requirements: PaymentRequirements
  ): Promise<VerifyResponse> {
    try {
      // Parse the base64-encoded payment payload
      const decoded = Buffer.from(paymentPayload, 'base64').toString('utf-8');
      const payload: X402PaymentPayload = JSON.parse(decoded);

      // Get chain ID from network
      const chainId = getChainIdFromNetwork(requirements.network);
      if (!chainId) {
        return {
          valid: false,
          invalidReason: `Unsupported network: ${requirements.network}`,
        };
      }

      // Check if chain is supported by this facilitator
      if (!this.config.supportedChains.includes(chainId)) {
        return {
          valid: false,
          invalidReason: `Chain ${chainId} not supported by this facilitator`,
        };
      }

      // Get the client for this chain
      const client = this.clients.get(chainId);
      if (!client) {
        return {
          valid: false,
          invalidReason: `No client configured for chain ${chainId}`,
        };
      }

      // Validate the authorization
      const { authorization, signature } = payload;

      // Check timestamp validity
      const now = Math.floor(Date.now() / 1000);
      if (authorization.validAfter > now) {
        return {
          valid: false,
          invalidReason: 'Payment not yet valid',
        };
      }
      if (authorization.validBefore < now) {
        return {
          valid: false,
          invalidReason: 'Payment has expired',
        };
      }

      // Check amount meets requirements
      const paymentAmount = BigInt(authorization.value);
      const requiredAmount = BigInt(requirements.maxAmountRequired);
      if (paymentAmount < requiredAmount) {
        return {
          valid: false,
          invalidReason: `Payment amount ${paymentAmount} is less than required ${requiredAmount}`,
        };
      }

      // TODO: Verify signature on-chain using ERC-3009 receiveWithAuthorization
      // For MVP, we do basic validation only

      return {
        valid: true,
        payer: authorization.from,
      };
    } catch (error) {
      return {
        valid: false,
        invalidReason: error instanceof Error ? error.message : 'Unknown error during verification',
      };
    }
  }

  /**
   * Settle a payment (execute the transfer)
   */
  async settle(
    paymentPayload: string,
    requirements: PaymentRequirements,
    privateKey?: Hex
  ): Promise<SettleResponse> {
    try {
      // First verify the payment
      const verification = await this.verify(paymentPayload, requirements);
      if (!verification.valid) {
        return {
          success: false,
          errorMessage: verification.invalidReason,
          network: requirements.network,
        };
      }

      // Parse payload
      const decoded = Buffer.from(paymentPayload, 'base64').toString('utf-8');
      const payload: X402PaymentPayload = JSON.parse(decoded);

      const chainId = getChainIdFromNetwork(requirements.network);
      if (!chainId) {
        return {
          success: false,
          errorMessage: `Unsupported network: ${requirements.network}`,
          network: requirements.network,
        };
      }

      // TODO: Execute the ERC-3009 receiveWithAuthorization transaction
      // This requires the facilitator's private key to submit the transaction
      // For MVP, we return a mock success

      if (!privateKey) {
        return {
          success: false,
          errorMessage: 'Private key required for settlement',
          network: requirements.network,
        };
      }

      // Mock transaction hash for MVP
      const mockTxHash: Hex = `0x${'0'.repeat(64)}` as Hex;

      return {
        success: true,
        transactionHash: mockTxHash,
        network: requirements.network,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error during settlement',
        network: requirements.network,
      };
    }
  }
}

/**
 * Create a new facilitator instance
 */
export function createFacilitator(config: FacilitatorConfig): Facilitator {
  return new Facilitator(config);
}


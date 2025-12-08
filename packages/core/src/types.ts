import type { Address, Hex } from 'viem';

/**
 * Supported blockchain network configuration
 */
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
}

/**
 * Token configuration for a specific chain
 */
export interface TokenConfig {
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
}

/**
 * Facilitator configuration
 */
export interface FacilitatorConfig {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  ownerAddress: Address;
  supportedChains: number[];
  supportedTokens: TokenConfig[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * x402 Payment header structure
 */
export interface X402PaymentHeader {
  version: string;
  scheme: string;
  network: string;
  payload: X402PaymentPayload;
}

/**
 * x402 Payment payload
 */
export interface X402PaymentPayload {
  signature: Hex;
  authorization: {
    from: Address;
    to: Address;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: Hex;
  };
}

/**
 * Verification request body
 */
export interface VerifyRequest {
  x402Version: number;
  paymentPayload: string;
  paymentRequirements: PaymentRequirements;
}

/**
 * Payment requirements from the resource server
 */
export interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  outputSchema?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

/**
 * Verification response
 */
export interface VerifyResponse {
  valid: boolean;
  invalidReason?: string;
  payer?: Address;
}

/**
 * Settlement request body
 */
export interface SettleRequest {
  x402Version: number;
  paymentPayload: string;
  paymentRequirements: PaymentRequirements;
}

/**
 * Settlement response
 */
export interface SettleResponse {
  success: boolean;
  transactionHash?: Hex;
  errorMessage?: string;
  network?: string;
}

/**
 * Supported tokens/chains response
 */
export interface SupportedResponse {
  x402Version: number;
  kinds: SupportedKind[];
}

/**
 * A supported payment kind (network + token combination)
 */
export interface SupportedKind {
  scheme: string;
  network: string;
  asset: Address;
  extra?: Record<string, unknown>;
}

/**
 * Transaction record for history tracking
 */
export interface TransactionRecord {
  id: string;
  facilitatorId: string;
  type: 'verify' | 'settle';
  network: string;
  fromAddress: Address;
  toAddress: Address;
  amount: string;
  asset: Address;
  transactionHash?: Hex;
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}


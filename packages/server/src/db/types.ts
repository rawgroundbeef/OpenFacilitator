/**
 * Facilitator database record
 */
export interface FacilitatorRecord {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  additional_domains: string; // JSON string array of additional domains
  owner_address: string;
  supported_chains: string; // JSON string
  supported_tokens: string; // JSON string
  encrypted_private_key: string | null; // EVM (Ethereum/Base) private key
  encrypted_solana_private_key: string | null; // Solana private key
  favicon: string | null; // Base64-encoded favicon image
  created_at: string;
  updated_at: string;
}

/**
 * Transaction database record
 */
export interface TransactionRecord {
  id: string;
  facilitator_id: string;
  type: 'verify' | 'settle';
  network: string;
  from_address: string;
  to_address: string;
  amount: string;
  asset: string;
  transaction_hash: string | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

/**
 * User database record
 */
export interface UserRecord {
  id: string;
  email: string | null;
  wallet_address: string;
  tier: 'free' | 'starter' | 'pro';
  created_at: string;
  updated_at: string;
}

/**
 * Domain verification record
 */
export interface DomainVerificationRecord {
  id: string;
  facilitator_id: string;
  domain: string;
  verification_token: string;
  verified_at: string | null;
  created_at: string;
}

/**
 * Multi-settle signature database record
 * Tracks a pre-authorized spending cap that can be settled multiple times
 */
export interface MultiSettleSignatureRecord {
  id: string;
  facilitator_id: string;
  network: string;
  asset: string;
  from_address: string;
  cap_amount: string;          // Original spending cap
  remaining_amount: string;    // Remaining balance
  valid_until: number;         // Unix timestamp
  nonce: string;               // Original signature nonce
  signature: string;           // The signature
  payment_payload: string;     // Full payment payload for settlements
  status: 'active' | 'exhausted' | 'expired' | 'revoked';
  deposited: number;           // 0 = not yet deposited, 1 = funds deposited to facilitator
  created_at: string;
}

/**
 * Multi-settle settlement database record
 * Tracks individual settlements against a multi-settle signature
 */
export interface MultiSettleSettlementRecord {
  id: string;
  signature_id: string;        // Reference to multisettle_signatures
  facilitator_id: string;
  pay_to: string;              // Recipient address for this settlement
  amount: string;              // Amount settled
  transaction_hash: string | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}


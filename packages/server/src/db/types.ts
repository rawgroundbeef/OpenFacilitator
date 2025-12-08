/**
 * Facilitator database record
 */
export interface FacilitatorRecord {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  owner_address: string;
  supported_chains: string; // JSON string
  supported_tokens: string; // JSON string
  encrypted_private_key: string | null;
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


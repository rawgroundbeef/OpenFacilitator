import { knownTokens, type FacilitatorConfig, type TokenConfig } from '@openfacilitator/core';
import type { FacilitatorRecord } from '../db/types.js';

const SOLANA_DEVNET_CHAIN_ID = 'solana-devnet';

export const SOLANA_DEVNET_USDC_TOKEN: TokenConfig = {
  symbol: 'USDC',
  address: knownTokens.USDC[SOLANA_DEVNET_CHAIN_ID],
  decimals: 6,
  chainId: SOLANA_DEVNET_CHAIN_ID,
};

/**
 * Add Solana devnet to a facilitator config without changing the persisted DB row.
 * Used for the public facilitator so devnet UAT can use the same Solana fee-payer key.
 */
export function withSolanaDevnetSupport(config: FacilitatorConfig): FacilitatorConfig {
  const hasDevnetChain = config.supportedChains.some((chainId) => String(chainId) === SOLANA_DEVNET_CHAIN_ID);
  const hasDevnetUsdc = config.supportedTokens.some(
    (token) =>
      String(token.chainId) === SOLANA_DEVNET_CHAIN_ID &&
      token.address.toLowerCase() === SOLANA_DEVNET_USDC_TOKEN.address.toLowerCase()
  );

  return {
    ...config,
    supportedChains: hasDevnetChain
      ? config.supportedChains
      : [...config.supportedChains, SOLANA_DEVNET_CHAIN_ID],
    supportedTokens: hasDevnetUsdc
      ? config.supportedTokens
      : [...config.supportedTokens, SOLANA_DEVNET_USDC_TOKEN],
  };
}

function parseAdditionalDomains(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((domain): domain is string => typeof domain === 'string')
      : [];
  } catch {
    return [];
  }
}

export function isPublicPayFacilitator(
  record: Pick<FacilitatorRecord, 'subdomain' | 'custom_domain' | 'additional_domains'>
): boolean {
  const domains = [
    record.subdomain,
    record.custom_domain,
    ...parseAdditionalDomains(record.additional_domains),
  ]
    .filter((domain): domain is string => !!domain)
    .map((domain) => domain.toLowerCase());

  return domains.includes('pay') || domains.includes('pay.openfacilitator.io');
}

export function withPublicPaySolanaDevnetSupport(
  record: Pick<
    FacilitatorRecord,
    'subdomain' | 'custom_domain' | 'additional_domains' | 'encrypted_solana_private_key'
  >,
  config: FacilitatorConfig
): FacilitatorConfig {
  if (!record.encrypted_solana_private_key || !isPublicPayFacilitator(record)) {
    return config;
  }

  return withSolanaDevnetSupport(config);
}

import { describe, expect, it } from 'vitest';
import type { FacilitatorConfig } from '@openfacilitator/core';
import {
  SOLANA_DEVNET_USDC_TOKEN,
  withPublicPaySolanaDevnetSupport,
  withSolanaDevnetSupport,
} from './solana-devnet-support.js';

const baseConfig: FacilitatorConfig = {
  id: 'facilitator-id',
  name: 'Test Facilitator',
  subdomain: 'pay',
  ownerAddress: '0x0000000000000000000000000000000000000000',
  supportedChains: ['solana'],
  supportedTokens: [
    {
      symbol: 'USDC',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      chainId: 'solana',
    },
  ],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('Solana devnet public facilitator support', () => {
  it('adds Solana devnet and Circle devnet USDC to a config', () => {
    const config = withSolanaDevnetSupport(baseConfig);

    expect(config.supportedChains).toContain('solana-devnet');
    expect(config.supportedTokens).toContainEqual(SOLANA_DEVNET_USDC_TOKEN);
  });

  it('adds devnet support for the public pay facilitator when a Solana key exists', () => {
    const config = withPublicPaySolanaDevnetSupport(
      {
        subdomain: 'pay',
        custom_domain: null,
        additional_domains: '[]',
        encrypted_solana_private_key: 'encrypted-key',
      },
      baseConfig
    );

    expect(config.supportedChains).toContain('solana-devnet');
  });

  it('does not add devnet support to other facilitators', () => {
    const config = withPublicPaySolanaDevnetSupport(
      {
        subdomain: 'customer',
        custom_domain: null,
        additional_domains: '[]',
        encrypted_solana_private_key: 'encrypted-key',
      },
      { ...baseConfig, subdomain: 'customer' }
    );

    expect(config.supportedChains).not.toContain('solana-devnet');
  });
});

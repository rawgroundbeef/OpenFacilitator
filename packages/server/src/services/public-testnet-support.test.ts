import { describe, expect, it } from 'vitest';
import type { FacilitatorConfig } from '@openfacilitator/core';
import {
  BASE_SEPOLIA_USDC_TOKEN,
  SOLANA_DEVNET_USDC_TOKEN,
  STACKS_TESTNET_TOKENS,
  withConfiguredTestnetSupport,
  withPublicPayTestnetSupport,
} from './public-testnet-support.js';

const baseConfig: FacilitatorConfig = {
  id: 'facilitator-id',
  name: 'Test Facilitator',
  subdomain: 'pay',
  ownerAddress: '0x0000000000000000000000000000000000000000',
  supportedChains: [8453, 'solana', 'stacks'],
  supportedTokens: [
    {
      symbol: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      chainId: 8453,
    },
    {
      symbol: 'USDC',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      chainId: 'solana',
    },
    {
      symbol: 'STX',
      address: 'STX',
      decimals: 6,
      chainId: 'stacks',
    },
  ],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('public testnet support', () => {
  it('adds configured testnet chains and tokens to a config', () => {
    const config = withConfiguredTestnetSupport(baseConfig, {
      evm: true,
      solana: true,
      stacks: true,
    });

    expect(config.supportedChains).toContain(84532);
    expect(config.supportedChains).toContain('solana-devnet');
    expect(config.supportedChains).toContain('stacks-testnet');
    expect(config.supportedTokens).toContainEqual(BASE_SEPOLIA_USDC_TOKEN);
    expect(config.supportedTokens).toContainEqual(SOLANA_DEVNET_USDC_TOKEN);
    for (const token of STACKS_TESTNET_TOKENS) {
      expect(config.supportedTokens).toContainEqual(token);
    }
  });

  it('adds only testnets for configured wallet families', () => {
    const config = withConfiguredTestnetSupport(baseConfig, {
      evm: true,
      solana: false,
      stacks: false,
    });

    expect(config.supportedChains).toContain(84532);
    expect(config.supportedChains).not.toContain('solana-devnet');
    expect(config.supportedChains).not.toContain('stacks-testnet');
  });

  it('adds testnet support for the public pay facilitator', () => {
    const config = withPublicPayTestnetSupport(
      {
        subdomain: 'pay',
        custom_domain: null,
        additional_domains: '[]',
        encrypted_private_key: 'encrypted-evm-key',
        encrypted_solana_private_key: 'encrypted-solana-key',
        encrypted_stacks_private_key: 'encrypted-stacks-key',
      },
      baseConfig
    );

    expect(config.supportedChains).toContain(84532);
    expect(config.supportedChains).toContain('solana-devnet');
    expect(config.supportedChains).toContain('stacks-testnet');
  });

  it('does not add testnet support to other facilitators', () => {
    const config = withPublicPayTestnetSupport(
      {
        subdomain: 'customer',
        custom_domain: null,
        additional_domains: '[]',
        encrypted_private_key: 'encrypted-evm-key',
        encrypted_solana_private_key: 'encrypted-solana-key',
        encrypted_stacks_private_key: 'encrypted-stacks-key',
      },
      { ...baseConfig, subdomain: 'customer' }
    );

    expect(config.supportedChains).not.toContain(84532);
    expect(config.supportedChains).not.toContain('solana-devnet');
    expect(config.supportedChains).not.toContain('stacks-testnet');
  });
});

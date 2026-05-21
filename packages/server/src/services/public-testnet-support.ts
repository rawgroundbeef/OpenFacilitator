import { knownTokens, type FacilitatorConfig, type TokenConfig } from '@openfacilitator/core';
import type { FacilitatorRecord } from '../db/types.js';

const BASE_SEPOLIA_CHAIN_ID = 84532;
const SOLANA_DEVNET_CHAIN_ID = 'solana-devnet';
const STACKS_TESTNET_CHAIN_ID = 'stacks-testnet';

export const BASE_SEPOLIA_USDC_TOKEN: TokenConfig = {
  symbol: 'USDC',
  address: knownTokens.USDC[BASE_SEPOLIA_CHAIN_ID],
  decimals: 6,
  chainId: BASE_SEPOLIA_CHAIN_ID,
};

export const SOLANA_DEVNET_USDC_TOKEN: TokenConfig = {
  symbol: 'USDC',
  address: knownTokens.USDC[SOLANA_DEVNET_CHAIN_ID],
  decimals: 6,
  chainId: SOLANA_DEVNET_CHAIN_ID,
};

export const STACKS_TESTNET_TOKENS: TokenConfig[] = [
  {
    symbol: 'STX',
    address: knownTokens.STX[STACKS_TESTNET_CHAIN_ID],
    decimals: 6,
    chainId: STACKS_TESTNET_CHAIN_ID,
  },
  {
    symbol: 'sBTC',
    address: knownTokens.sBTC[STACKS_TESTNET_CHAIN_ID],
    decimals: 8,
    chainId: STACKS_TESTNET_CHAIN_ID,
  },
  {
    symbol: 'USDCx',
    address: knownTokens.USDCx[STACKS_TESTNET_CHAIN_ID],
    decimals: 6,
    chainId: STACKS_TESTNET_CHAIN_ID,
  },
];

function withChainAndTokens(
  config: FacilitatorConfig,
  chainId: number | string,
  tokens: TokenConfig[]
): FacilitatorConfig {
  const hasChain = config.supportedChains.some((supportedChainId) => String(supportedChainId) === String(chainId));
  const tokensToAdd = tokens.filter(
    (token) =>
      !config.supportedTokens.some(
        (supportedToken) =>
          String(supportedToken.chainId) === String(token.chainId) &&
          supportedToken.address.toLowerCase() === token.address.toLowerCase()
      )
  );

  return {
    ...config,
    supportedChains: hasChain ? config.supportedChains : [...config.supportedChains, chainId],
    supportedTokens: tokensToAdd.length === 0 ? config.supportedTokens : [...config.supportedTokens, ...tokensToAdd],
  };
}

export function withBaseSepoliaSupport(config: FacilitatorConfig): FacilitatorConfig {
  return withChainAndTokens(config, BASE_SEPOLIA_CHAIN_ID, [BASE_SEPOLIA_USDC_TOKEN]);
}

export function withSolanaDevnetSupport(config: FacilitatorConfig): FacilitatorConfig {
  return withChainAndTokens(config, SOLANA_DEVNET_CHAIN_ID, [SOLANA_DEVNET_USDC_TOKEN]);
}

export function withStacksTestnetSupport(config: FacilitatorConfig): FacilitatorConfig {
  return withChainAndTokens(config, STACKS_TESTNET_CHAIN_ID, STACKS_TESTNET_TOKENS);
}

export function withConfiguredTestnetSupport(
  config: FacilitatorConfig,
  configured: { evm?: boolean; solana?: boolean; stacks?: boolean }
): FacilitatorConfig {
  let nextConfig = config;

  if (configured.evm) {
    nextConfig = withBaseSepoliaSupport(nextConfig);
  }
  if (configured.solana) {
    nextConfig = withSolanaDevnetSupport(nextConfig);
  }
  if (configured.stacks) {
    nextConfig = withStacksTestnetSupport(nextConfig);
  }

  return nextConfig;
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

export function withPublicPayTestnetSupport(
  record: Pick<
    FacilitatorRecord,
    | 'subdomain'
    | 'custom_domain'
    | 'additional_domains'
    | 'encrypted_private_key'
    | 'encrypted_solana_private_key'
    | 'encrypted_stacks_private_key'
  >,
  config: FacilitatorConfig
): FacilitatorConfig {
  if (!isPublicPayFacilitator(record)) {
    return config;
  }

  return withConfiguredTestnetSupport(config, {
    evm: !!record.encrypted_private_key,
    solana: !!record.encrypted_solana_private_key,
    stacks: !!record.encrypted_stacks_private_key,
  });
}

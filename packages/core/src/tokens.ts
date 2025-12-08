import type { Address } from 'viem';
import type { TokenConfig } from './types.js';

/**
 * Well-known token addresses across chains
 */
export const knownTokens: Record<string, Record<number, Address>> = {
  // USDC addresses
  USDC: {
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  },
  // WETH addresses
  WETH: {
    8453: '0x4200000000000000000000000000000000000006', // Base
    84532: '0x4200000000000000000000000000000000000006', // Base Sepolia
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum
    11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia
  },
};

/**
 * Default token configurations for facilitators
 */
export const defaultTokens: TokenConfig[] = [
  // USDC on Base
  {
    address: knownTokens.USDC[8453],
    symbol: 'USDC',
    decimals: 6,
    chainId: 8453,
  },
  // USDC on Base Sepolia
  {
    address: knownTokens.USDC[84532],
    symbol: 'USDC',
    decimals: 6,
    chainId: 84532,
  },
];

/**
 * Get token config for a specific chain and address
 */
export function getTokenConfig(chainId: number, address: Address): TokenConfig | undefined {
  return defaultTokens.find(
    (t) => t.chainId === chainId && t.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get all tokens for a specific chain
 */
export function getTokensForChain(chainId: number): TokenConfig[] {
  return defaultTokens.filter((t) => t.chainId === chainId);
}

/**
 * Check if a token is supported on a chain
 */
export function isTokenSupported(chainId: number, address: Address): boolean {
  return defaultTokens.some(
    (t) => t.chainId === chainId && t.address.toLowerCase() === address.toLowerCase()
  );
}


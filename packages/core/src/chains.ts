import type { ChainConfig } from './types.js';

/**
 * Default supported chains for x402 facilitators
 */
export const defaultChains: Record<number, ChainConfig> = {
  // Base Mainnet
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
  },
  // Base Sepolia (Testnet)
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
  },
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorerUrl: 'https://etherscan.io',
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return defaultChains[chainId];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(defaultChains).map(Number);
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in defaultChains;
}

/**
 * Network name to chain ID mapping
 */
export const networkToChainId: Record<string, number> = {
  base: 8453,
  'base-sepolia': 84532,
  ethereum: 1,
  sepolia: 11155111,
};

/**
 * Chain ID to network name mapping
 */
export const chainIdToNetwork: Record<number, string> = {
  8453: 'base',
  84532: 'base-sepolia',
  1: 'ethereum',
  11155111: 'sepolia',
};

/**
 * Get chain ID from network name
 */
export function getChainIdFromNetwork(network: string): number | undefined {
  return networkToChainId[network.toLowerCase()];
}

/**
 * Get network name from chain ID
 */
export function getNetworkFromChainId(chainId: number): string | undefined {
  return chainIdToNetwork[chainId];
}


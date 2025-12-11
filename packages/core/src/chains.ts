import type { ChainConfig } from './types.js';

/**
 * Default supported chains for x402 facilitators
 */
export const defaultChains: Record<string, ChainConfig> = {
  // Base Mainnet
  '8453': {
    chainId: 8453,
    name: 'Base',
    network: 'base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    isEVM: true,
  },
  // Base Sepolia (Testnet)
  '84532': {
    chainId: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    isEVM: true,
  },
  // Ethereum Mainnet
  '1': {
    chainId: 1,
    name: 'Ethereum',
    network: 'ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorerUrl: 'https://etherscan.io',
    isEVM: true,
  },
  // Sepolia Testnet
  '11155111': {
    chainId: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isEVM: true,
  },
  // Solana Mainnet
  solana: {
    chainId: 'solana',
    name: 'Solana',
    network: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorerUrl: 'https://solscan.io',
    isEVM: false,
  },
  // Solana Devnet
  'solana-devnet': {
    chainId: 'solana-devnet',
    name: 'Solana Devnet',
    network: 'solana-devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    blockExplorerUrl: 'https://solscan.io/?cluster=devnet',
    isEVM: false,
  },
};

/**
 * Get chain configuration by chain ID or network name
 */
export function getChainConfig(chainIdOrNetwork: number | string): ChainConfig | undefined {
  const key = String(chainIdOrNetwork);
  return defaultChains[key] || Object.values(defaultChains).find(c => c.network === key);
}

/**
 * Get all supported chain IDs/networks
 */
export function getSupportedChains(): (number | string)[] {
  return Object.values(defaultChains).map(c => c.chainId);
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainIdOrNetwork: number | string): boolean {
  return !!getChainConfig(chainIdOrNetwork);
}

/**
 * Network name to chain ID mapping
 */
export const networkToChainId: Record<string, number | string> = {
  base: 8453,
  'base-sepolia': 84532,
  ethereum: 1,
  sepolia: 11155111,
  solana: 'solana',
  'solana-mainnet': 'solana', // Alias for compatibility
  'solana-devnet': 'solana-devnet',
};

/**
 * Chain ID to network name mapping
 */
export const chainIdToNetwork: Record<string | number, string> = {
  8453: 'base',
  84532: 'base-sepolia',
  1: 'ethereum',
  11155111: 'sepolia',
  solana: 'solana',
  'solana-mainnet': 'solana', // Alias
  'solana-devnet': 'solana-devnet',
};

/**
 * Get chain ID from network name
 */
export function getChainIdFromNetwork(network: string): number | string | undefined {
  return networkToChainId[network.toLowerCase()];
}

/**
 * Get network name from chain ID
 */
export function getNetworkFromChainId(chainId: number | string): string | undefined {
  return chainIdToNetwork[chainId];
}

/**
 * Production chains (mainnet only)
 */
export const productionChains = [8453, 'solana'] as const;

/**
 * Test chains
 */
export const testChains = [84532, 11155111, 'solana-devnet'] as const;

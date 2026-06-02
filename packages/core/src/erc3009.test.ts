import { beforeEach, describe, expect, it, vi } from 'vitest';

const viemMocks = vi.hoisted(() => ({
  createPublicClient: vi.fn(),
  createWalletClient: vi.fn(),
  http: vi.fn((url: string) => ({ url })),
  encodeFunctionData: vi.fn(() => '0xencoded'),
  parseSignature: vi.fn(() => ({
    v: 27n,
    r: '0x0000000000000000000000000000000000000000000000000000000000000001',
    s: '0x0000000000000000000000000000000000000000000000000000000000000002',
  })),
  defineChain: vi.fn((chain: unknown) => chain),
}));

const accountMocks = vi.hoisted(() => ({
  privateKeyToAccount: vi.fn(() => ({
    address: '0x1111111111111111111111111111111111111111',
  })),
}));

vi.mock('viem', () => viemMocks);
vi.mock('viem/accounts', () => accountMocks);

import { executeERC3009Settlement, type SettlementParams } from './erc3009.js';

const baseParams: SettlementParams = {
  chainId: 8453,
  tokenAddress: '0x2222222222222222222222222222222222222222',
  authorization: {
    from: '0x3333333333333333333333333333333333333333',
    to: '0x4444444444444444444444444444444444444444',
    value: '1000000',
    validAfter: 0,
    validBefore: 9999999999,
    nonce: '0x5555555555555555555555555555555555555555555555555555555555555555',
  },
  signature: '0xabcdef',
  facilitatorPrivateKey: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};

describe('executeERC3009Settlement gas estimation ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails estimateGas before acquiring an EVM nonce and releases the ERC-3009 processing lock', async () => {
    const getTransactionCount = vi.fn(async () => 7);
    const sendTransaction = vi.fn();
    const estimateGas = vi.fn(async () => {
      throw new Error('execution reverted during gas estimation');
    });

    viemMocks.createPublicClient.mockReturnValue({
      getGasPrice: vi.fn(async () => 1n),
      estimateMaxPriorityFeePerGas: vi.fn(async () => 1n),
      estimateGas,
      getBalance: vi.fn(async () => 10n ** 18n),
      getTransactionCount,
    });
    viemMocks.createWalletClient.mockReturnValue({ sendTransaction });

    const first = await executeERC3009Settlement(baseParams);
    const second = await executeERC3009Settlement(baseParams);

    expect(first).toMatchObject({
      success: false,
      errorMessage: 'execution reverted during gas estimation',
    });
    expect(second).toMatchObject({
      success: false,
      errorMessage: 'execution reverted during gas estimation',
    });
    expect(estimateGas).toHaveBeenCalledTimes(2);
    expect(getTransactionCount).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('checks facilitator balance against the buffered estimate before acquiring an EVM nonce', async () => {
    const getTransactionCount = vi.fn(async () => 7);
    const sendTransaction = vi.fn();

    viemMocks.createPublicClient.mockReturnValue({
      getGasPrice: vi.fn(async () => 100n),
      estimateMaxPriorityFeePerGas: vi.fn(async () => 10n),
      estimateGas: vi.fn(async () => 100_000n),
      getBalance: vi.fn(async () => 0n),
      getTransactionCount,
    });
    viemMocks.createWalletClient.mockReturnValue({ sendTransaction });

    const result = await executeERC3009Settlement({
      ...baseParams,
      authorization: {
        ...baseParams.authorization,
        nonce: '0x6666666666666666666666666666666666666666666666666666666666666666',
      },
    });

    expect(result).toMatchObject({
      success: false,
      errorMessage: 'Facilitator has insufficient ETH for estimated gas',
    });
    expect(getTransactionCount).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
  });
});

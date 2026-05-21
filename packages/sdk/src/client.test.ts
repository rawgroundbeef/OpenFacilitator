import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenFacilitator } from './client.js';

const supportedWithSolanaNetworks = {
  kinds: [
    {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana',
      extra: { feePayer: 'mainnet-fee-payer' },
    },
    {
      x402Version: 2,
      scheme: 'exact',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      extra: { feePayer: 'mainnet-caip-fee-payer' },
    },
    {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana-devnet',
      extra: { feePayer: 'devnet-fee-payer' },
    },
  ],
};

describe('OpenFacilitator client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the devnet Solana fee payer without matching mainnet by prefix', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(supportedWithSolanaNetworks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const facilitator = new OpenFacilitator({ url: 'https://facilitator.example' });

    await expect(facilitator.getFeePayer('solana-devnet')).resolves.toBe('devnet-fee-payer');
  });

  it('matches the Solana devnet CAIP-2 identifier to a v1 supported kind', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(supportedWithSolanaNetworks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const facilitator = new OpenFacilitator({ url: 'https://facilitator.example' });

    await expect(
      facilitator.getFeePayer('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
    ).resolves.toBe('devnet-fee-payer');
  });
});

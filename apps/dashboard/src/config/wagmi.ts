import { createConfig, http, injected } from 'wagmi';
import { mainnet, base, polygon } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, polygon],
  connectors: [injected()],
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
});

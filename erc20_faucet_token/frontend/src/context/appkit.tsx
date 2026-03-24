import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import type { AppKitNetwork } from '@reown/appkit/networks';
import React from 'react';
import { APP_CONFIG } from '../config/app';

const appUrl =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export const liskSepoliaNetwork: AppKitNetwork = {
  id: APP_CONFIG.expectedChainId,
  name: APP_CONFIG.networkName,
  chainNamespace: 'eip155',
  caipNetworkId: `eip155:${APP_CONFIG.expectedChainId}`,
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [APP_CONFIG.rpcUrl || 'https://lisk-sepolia.drpc.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://sepolia-blockscout.lisk.com',
    },
  },
  testnet: true,
};

const networks = [liskSepoliaNetwork] as [AppKitNetwork, ...AppKitNetwork[]];

const metadata = {
  name: 'KOMI dApp',
  description: 'KOMI token faucet and admin hub on Lisk Sepolia.',
  url: appUrl,
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

export const appkit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId: APP_CONFIG.projectId,
  allowUnsupportedChain: false,
  allWallets: 'SHOW',
  defaultNetwork: liskSepoliaNetwork,
  enableEIP6963: true,
  features: {
    analytics: true,
    allWallets: true,
    email: false,
    socials: [],
  },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

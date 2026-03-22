import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { sepolia, type AppKitNetwork } from "@reown/appkit/networks";
import React from 'react';

// 1. Get projectId
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID as string;

export const sepoliaTestnet: AppKitNetwork = {
  ...sepolia,
  id: 11155111,
  chainNamespace: "eip155",
  caipNetworkId: "eip155:11155111",
};

// 2. Set the networks
const networks = [sepolia] as [AppKitNetwork, ...AppKitNetwork[]];

// 3. Create a metadata object - optional
const metadata = {
  name: "Faucet claiming App",
  description: "A token minting dapp built on SepoliaETH",
  url: "https://localhost",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// 4. Create a AppKit instance
export const appkit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  allowUnsupportedChain: false,
  allWallets: "SHOW",
  defaultNetwork: sepolia,
  enableEIP6963: true,
  features: {
    analytics: true,
    allWallets: true,
    email: false,
    socials: [],
  },
});

appkit.switchNetwork(sepolia);

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

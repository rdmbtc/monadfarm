"use client";

import { AbstractWalletProvider } from "@/lib/wallet-adapters";

// Define the Monad Testnet chain object
const monadTestnet = {
  id: 10143, // Monad Testnet Chain ID
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] }
  },
  blockExplorers: {
    default: { url: "https://testnet.monadexplorer.com" }
  }
};

export const WalletContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <AbstractWalletProvider chain={monadTestnet}>
      {children}
    </AbstractWalletProvider>
  );
};
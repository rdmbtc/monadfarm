"use client"

import { ReactNode, useEffect } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { ReactTogether } from 'react-together'

// Define Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz'] },
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
}

export function Providers({ children }: { children: ReactNode }) {
  // Add debug logging for context initialization
  useEffect(() => {
    console.log("[Providers] Client-side providers initialized");
  }, []);

  return (
    <AbstractWalletProvider chain={monadTestnet}>
      <ReactTogether
        sessionParams={{
          appId: "monfarm-social-hub",
          apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "",
          name: "monfarm-social-hub-session"
        }}
        rememberUsers={true}
      >
        <GameProvider>
          <GuideProvider>
            {children}
          </GuideProvider>
        </GameProvider>
      </ReactTogether>
    </AbstractWalletProvider>
  )
}
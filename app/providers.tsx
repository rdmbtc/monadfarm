"use client"

import { ReactNode, useEffect, useState } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
// Note: ReactTogether completely removed to prevent duplicate WalletConnect initialization
// Using Multisynq instead for real-time features

// Define Monad Testnet chain configuration for Privy
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com'
    },
  },
  testnet: true,
})

export function Providers({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  // Add debug logging for context initialization
  useEffect(() => {
    setIsClient(true)
    console.log("[Providers] Client-side providers initialized");

    // Log configuration warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
        console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set. Wallet connections may not work properly.')
      }
      if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect features may not work properly.')
      }
      if (!process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY) {
        console.warn('⚠️ NEXT_PUBLIC_MULTISYNQ_API_KEY is not set. Real-time features may not work properly.')
      }
    }
  }, []);

  // Single provider configuration to prevent duplicate initialization
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/images/nooter.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'wallet'],
        // Only include WalletConnect if valid project ID is provided
        ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID && {
          walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        }),
        // Disable Coinbase Smart Wallet entirely for unsupported chains
        externalWallets: {
          coinbaseWallet: {
            // Force EOA only to prevent Smart Wallet chain compatibility errors
            connectionOptions: 'eoaOnly'
          }
        },
      }}
    >
      {/* Using Multisynq instead of ReactTogether to prevent duplicate initialization */}
      <GameProvider>
        <GuideProvider>
          {children}
        </GuideProvider>
      </GameProvider>
    </PrivyProvider>
  )


}
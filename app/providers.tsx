"use client"

import { ReactNode, useEffect, useState } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
// Note: ReactTogether removed to prevent duplicate WalletConnect initialization
// We're using Multisynq instead for real-time features

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

  // During SSR, provide all providers but with minimal configuration
  if (!isClient) {
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
          walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          // Configure supported wallets - exclude Coinbase Smart Wallet for Monad Testnet
          externalWallets: {
            coinbaseWallet: {
              // Disable Coinbase Smart Wallet for unsupported chains
              connectionOptions: 'smartWalletOnly'
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

  // On client side, provide all providers including those that need browser APIs
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        // Set Monad Testnet as the default chain
        defaultChain: monadTestnet,
        // Support only Monad Testnet for now
        supportedChains: [monadTestnet],
        // Configure appearance
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/images/nooter.png',
        },
        // Enable embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configure login methods
        loginMethods: ['email', 'wallet'],
        // Configure wallet connection options
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        // Configure supported wallets - exclude Coinbase Smart Wallet for Monad Testnet
        externalWallets: {
          coinbaseWallet: {
            // Disable Coinbase Smart Wallet for unsupported chains
            connectionOptions: 'smartWalletOnly'
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
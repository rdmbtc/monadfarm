"use client"

import { ReactNode, useEffect, useState } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
import { NoSSRWrapper } from '@/components/no-ssr-wrapper'
import { ErrorBoundary } from '@/components/error-boundary'

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
  const [hasInitialized, setHasInitialized] = useState(false)

  // Add debug logging for context initialization
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true)
      console.log("[Providers] Client-side providers initialized");

      // Log configuration warnings in development
      if (process.env.NODE_ENV === 'development') {
        if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
          console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set. Wallet connections may not work properly.')
        }
        if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
          console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect features may not work properly.')
        }
        if (!process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY) {
          console.warn('⚠️ NEXT_PUBLIC_REACT_TOGETHER_API_KEY is not set. Real-time features on specific pages may not work properly.')
        }
      }
    }
  }, []); // Empty dependency array to prevent re-initialization

  // Client-side only configuration (SSR disabled)
  return (
    <ErrorBoundary>
      <NoSSRWrapper fallback={<div>Loading...</div>}>
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
          // Configure supported wallets - disable Coinbase Smart Wallet for Monad Testnet
          externalWallets: {
            coinbaseWallet: {
              // Disable Coinbase Smart Wallet for unsupported chains
              connectionOptions: 'eoaOnly'
            }
          },
        }}
      >
        <GameProvider>
          <GuideProvider>
            {children}
          </GuideProvider>
        </GameProvider>
        </PrivyProvider>
      </NoSSRWrapper>
    </ErrorBoundary>
  )
}
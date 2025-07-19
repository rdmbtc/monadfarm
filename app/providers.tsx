"use client"

import { ReactNode, useEffect, useState } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
import { ReactTogether } from 'react-together'
import { NoSSRWrapper } from '@/components/no-ssr-wrapper'
import { FarmGameModel } from '@/models/farm-game-model'

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
  // Track if we're on the client side
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
      if (!process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY) {
        console.warn('⚠️ NEXT_PUBLIC_REACT_TOGETHER_API_KEY is not set. Real-time features may not work properly.')
      }
    }
  }, []);

  // Client-side only configuration (SSR disabled)
  return (
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
          // Configure supported wallets - exclude Coinbase Smart Wallet for Monad Testnet
          externalWallets: {
            coinbaseWallet: {
              // Disable Coinbase Smart Wallet for unsupported chains
              connectionOptions: 'smartWalletOnly'
            }
          },
        }}
      >
        {/* Only initialize ReactTogether on client side to prevent SSR issues */}
        {isClient ? (
          <ReactTogether
            sessionParams={{
              appId: "monfarm-social-hub",
              apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "",
              name: "monfarm-social-hub-session",
              model: FarmGameModel
            }}
            rememberUsers={true}
          >
            <GameProvider>
              <GuideProvider>
                {children}
              </GuideProvider>
            </GameProvider>
          </ReactTogether>
        ) : (
          <GameProvider>
            <GuideProvider>
              {children}
            </GuideProvider>
          </GameProvider>
        )}
      </PrivyProvider>
    </NoSSRWrapper>
  )
}
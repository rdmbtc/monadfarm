"use client"

import { ReactNode, useEffect, useState } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
import dynamic from 'next/dynamic'

// Dynamically import ReactTogether to avoid SSR issues
const ReactTogether = dynamic(
  () => import('react-together').then(mod => ({ default: mod.ReactTogether })),
  { ssr: false }
)

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
        }}
      >
        <ReactTogether
          sessionParams={{
            appId: "monfarm-social-hub",
            apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "",
            // Don't provide session name during SSR
          }}
          rememberUsers={true}
        >
          <GameProvider>
            <GuideProvider>
              {children}
            </GuideProvider>
          </GameProvider>
        </ReactTogether>
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
      }}
    >
      <ReactTogether
        sessionParams={{
          appId: "monfarm-social-hub",
          apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "",
          // Only provide session name on client side to prevent SSR connection attempts
          ...(typeof window !== 'undefined' && { name: "monfarm-social-hub-session" })
        }}
        rememberUsers={true}
      >
        <GameProvider>
          <GuideProvider>
            {children}
          </GuideProvider>
        </GameProvider>
      </ReactTogether>
    </PrivyProvider>
  )
}
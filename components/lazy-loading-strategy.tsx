// components/lazy-loading-strategy.tsx
// Optimized lazy loading for MonFarm components

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Game Components - Load only when needed
export const FarmGame = dynamic(() => import('./farm-game'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-96 rounded-lg" />
})

export const SlotMachine = dynamic(() => import('../app/slot-machine/page'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-96 rounded-lg" />
})

export const CrashoutGame = dynamic(() => import('./crashout-game'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-96 rounded-lg" />
})

// Social Components - Load progressively
export const SocialHub = dynamic(() => import('./monfarm-social-hub'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-64 rounded-lg" />
})

export const ChatComponent = dynamic(() => import('./simple-multisynq-chat'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-48 rounded-lg" />
})

// Heavy Libraries - Load on demand
export const PhaserGame = dynamic(() => import('./phaser-game'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-screen rounded-lg" />
})

// Wallet Components - Load when wallet interaction needed
export const WalletConnect = dynamic(() => import('./wallet-connect'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 h-12 w-32 rounded" />
})

// Wrapper for better loading states
export function LazyComponentWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-800 h-32 rounded-lg" />}>
      {children}
    </Suspense>
  )
}

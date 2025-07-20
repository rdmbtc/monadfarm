// components/lazy-loading-strategy.tsx
// Optimized lazy loading for MonFarm components

import dynamic from 'next/dynamic'
import { Suspense, Component } from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

// Enhanced loading component
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8 bg-[#171717] border border-[#333] rounded-lg">
    <Loader2 className="h-6 w-6 animate-spin mr-2 text-white" />
    <span className="text-white">{message}</span>
  </div>
)

// Error fallback component
const ErrorFallback = ({
  error,
  resetError,
  componentName = "Component"
}: {
  error?: Error
  resetError?: () => void
  componentName?: string
}) => (
  <div className="flex flex-col items-center justify-center p-8 bg-[#171717] border border-red-600/30 rounded-lg">
    <AlertTriangle className="h-8 w-8 text-red-400 mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">Failed to load {componentName}</h3>
    <p className="text-sm text-gray-400 mb-4 text-center">
      {error?.message || "An unexpected error occurred while loading this component."}
    </p>
    {resetError && (
      <button
        onClick={resetError}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    )}
  </div>
)

// Game Components - Load only when needed
export const FarmGame = dynamic(() => import('./farm-game/ClientWrapper'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Farm Game..." />
})

export const SlotMachine = dynamic(() => import('../app/slot-machine/components/enhanced-slot-machine'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Slot Machine..." />
})

export const CrashoutGame = dynamic(() => import('./crashout-game').then(mod => ({ default: mod.CrashoutGame })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Crashout Game..." />
})

// Social Components - Load progressively
export const SocialHub = dynamic(() => import('./monfarm-social-hub').then(mod => ({ default: mod.MonFarmSocialHub })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Social Hub..." />
})

export const ChatComponent = dynamic(() => import('./simple-multisynq-chat').then(mod => ({ default: mod.SimpleMultisynqChat })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Chat..." />
})

// Heavy Libraries - Load on demand
export const PhaserGame = dynamic(() => import('./farm-game/ClientWrapper'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Phaser Game..." />
})

// Wallet Components - Load when wallet interaction needed
export const WalletConnect = dynamic(() => import('./wallet-connect').then(mod => ({ default: mod.WalletConnect })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Wallet..." />
})

// Additional Components
export const BulletproofSocialFeed = dynamic(() => import('./bulletproof-social-feed').then(mod => ({ default: mod.BulletproofSocialFeed })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Social Feed..." />
})

export const ProfileEditModal = dynamic(() => import('./profile-edit-modal'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Profile Editor..." />
})

export const ReactTogetherChat = dynamic(() => import('./react-together-chat').then(mod => ({ default: mod.ReactTogetherChat })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading React Together Chat..." />
})

// Enhanced Wrapper for better loading states with error boundary
export function LazyComponentWrapper({
  children,
  fallback,
  errorFallback,
  componentName = "Component"
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  componentName?: string
}) {
  return (
    <Suspense
      fallback={fallback || <LoadingSpinner message={`Loading ${componentName}...`} />}
    >
      <ErrorBoundary fallback={errorFallback} componentName={componentName}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

// Error Boundary Class Component
class ErrorBoundary extends Component<
  {
    children: React.ReactNode
    fallback?: React.ReactNode
    componentName?: string
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
          componentName={this.props.componentName}
        />
      )
    }

    return this.props.children
  }
}

// Preload function for critical components
export function preloadCriticalComponents() {
  // Preload components that are likely to be used soon
  import('./bulletproof-social-feed')
  import('./simple-multisynq-chat')
  import('./wallet-connect')
}

// Utility function to check if component should be loaded
export function shouldLoadComponent(componentName: string): boolean {
  // Add logic to determine if component should be loaded based on user preferences, device capabilities, etc.
  const userPreferences = typeof window !== 'undefined' ? localStorage.getItem('componentPreferences') : null

  if (!userPreferences) return true

  try {
    const preferences = JSON.parse(userPreferences)
    return preferences[componentName] !== false
  } catch {
    return true
  }
}

// Performance monitoring for lazy loaded components
export function trackComponentLoad(componentName: string, loadTime: number) {
  if (typeof window !== 'undefined' && window.performance) {
    console.log(`[LazyLoad] ${componentName} loaded in ${loadTime}ms`)

    // Store performance metrics
    const metrics = JSON.parse(localStorage.getItem('componentMetrics') || '{}')
    metrics[componentName] = {
      loadTime,
      timestamp: Date.now()
    }
    localStorage.setItem('componentMetrics', JSON.stringify(metrics))
  }
}

// Export all lazy components for easy importing
export const LazyComponents = {
  FarmGame,
  SlotMachine,
  CrashoutGame,
  SocialHub,
  ChatComponent,
  PhaserGame,
  WalletConnect,
  BulletproofSocialFeed,
  ProfileEditModal,
  ReactTogetherChat
} as const

// Export loading components
export const LoadingComponents = {
  LoadingSpinner,
  ErrorFallback
} as const

// Default export for convenience
export default LazyComponents

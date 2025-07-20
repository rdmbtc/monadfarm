'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ReactTogetherErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a ReactTogether context error
    if (error.message.includes('useReactTogetherContext must be used within a ReactTogetherProvider')) {
      return { hasError: true, error }
    }
    // For other errors, don't catch them
    return { hasError: false }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes('useReactTogetherContext must be used within a ReactTogetherProvider')) {
      console.warn('ReactTogetherErrorBoundary: Caught ReactTogether context error:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] bg-black flex items-center justify-center rounded-lg border border-gray-700">
          <div className="text-center p-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ Multiplayer Unavailable</h3>
            <p className="text-gray-300 mb-2">
              ReactTogether context is not available.
            </p>
            <p className="text-sm text-gray-500">
              Please ensure the component is wrapped in a ReactTogetherProvider.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

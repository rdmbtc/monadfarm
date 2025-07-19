"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FallbackSocialFeed } from './fallback-social-feed';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ReactTogetherErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallbackFeed?: boolean;
}

export class ReactTogetherErrorBoundary extends React.Component<
  ReactTogetherErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ReactTogetherErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Together Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Connection Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                There was an issue connecting to the real-time social features.
              </p>
              <p className="text-sm text-gray-500">
                This might be due to network connectivity or server issues.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                {this.props.showFallbackFeed ? (
                  <Button
                    variant="outline"
                    onClick={() => this.setState({ hasError: false })}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Use Offline Mode
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => this.setState({ hasError: false })}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Continue Offline
                  </Button>
                )}
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-red-400 mt-2 p-2 bg-gray-800 rounded overflow-auto">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ConfigStatus {
  name: string
  key: string
  value: string | undefined
  required: boolean
  status: 'success' | 'warning' | 'error'
  description: string
}

export function ConfigChecker() {
  const [configs, setConfigs] = useState<ConfigStatus[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const configChecks: ConfigStatus[] = [
      {
        name: 'Privy App ID',
        key: 'NEXT_PUBLIC_PRIVY_APP_ID',
        value: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
        required: true,
        status: process.env.NEXT_PUBLIC_PRIVY_APP_ID ? 'success' : 'error',
        description: 'Required for wallet authentication'
      },
      {
        name: 'WalletConnect Project ID',
        key: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
        value: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        required: true,
        status: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? 'success' : 'error',
        description: 'Required for WalletConnect functionality'
      },
      {
        name: 'Multisynq API Key',
        key: 'NEXT_PUBLIC_MULTISYNQ_API_KEY',
        value: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY,
        required: true,
        status: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY ? 'success' : 'warning',
        description: 'Required for real-time synchronization'
      },
      {
        name: 'React Together API Key',
        key: 'NEXT_PUBLIC_REACT_TOGETHER_API_KEY',
        value: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY,
        required: false,
        status: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY ? 'success' : 'warning',
        description: 'Optional - for enhanced real-time features'
      }
    ]

    setConfigs(configChecks)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Configured'
      case 'warning': return 'Missing (Optional)'
      case 'error': return 'Missing (Required)'
      default: return 'Unknown'
    }
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Check Config
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-black/90 border-gray-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Configuration Status</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {configs.map((config) => (
            <div key={config.key} className="flex items-center justify-between p-2 rounded border border-gray-700">
              <div className="flex-1">
                <div className="font-medium text-sm">{config.name}</div>
                <div className="text-xs text-gray-400">{config.description}</div>
                {config.value && (
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {config.value.substring(0, 20)}...
                  </div>
                )}
              </div>
              <Badge className={`${getStatusColor(config.status)} text-white text-xs`}>
                {getStatusText(config.status)}
              </Badge>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-4">
            Missing required configs? Check your .env file and restart the development server.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

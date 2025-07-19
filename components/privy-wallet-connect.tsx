"use client"

import React, { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Wallet, LogOut, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface PrivyWalletConnectProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
  className?: string
}

export function PrivyWalletConnect({
  onConnect,
  onDisconnect,
  className = ""
}: PrivyWalletConnectProps) {
  const [isClient, setIsClient] = useState(false)

  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkWallet,
    unlinkWallet
  } = usePrivy()

  const { wallets } = useWallets()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle login/connect
  const handleConnect = async () => {
    try {
      await login()

      // Get the connected wallet address
      if (wallets.length > 0) {
        const address = wallets[0].address
        onConnect?.(address)
        toast.success('🎉 Connected to Monad Testnet!')
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to connect wallet. Please try again.'

      if (error?.message?.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user.'
      } else if (error?.message?.includes('MetaMask')) {
        errorMessage = 'MetaMask connection failed. Please ensure MetaMask is installed and unlocked.'
      } else if (error?.message?.includes('WalletConnect')) {
        errorMessage = 'WalletConnect failed. Please check your internet connection.'
      } else if (error?.message?.includes('Coinbase')) {
        errorMessage = 'Coinbase Wallet connection failed. Note: Monad Testnet may not be supported by Coinbase Smart Wallet.'
      }

      toast.error(errorMessage)
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await logout()
      onDisconnect?.()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      toast.error('Failed to disconnect wallet')
    }
  }

  // Handle linking additional wallets
  const handleLinkWallet = async () => {
    try {
      await linkWallet()
      toast.success('Additional wallet linked!')
    } catch (error) {
      console.error('Failed to link wallet:', error)
      toast.error('Failed to link wallet')
    }
  }

  // Show loading state while Privy initializes or on server side
  if (!isClient || !ready) {
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white/70">Initializing wallet connection...</p>
        </CardContent>
      </Card>
    )
  }

  // Show connected state
  if (authenticated && user) {
    const primaryWallet = wallets.find(wallet => wallet.walletClientType !== 'privy')
    const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy')
    
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Connected to Monad Testnet
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="space-y-2">
            {user.email && (
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Email:</span>
                <span className="text-white text-sm">{user.email.address}</span>
              </div>
            )}
            
            {user.phone && (
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Phone:</span>
                <span className="text-white text-sm">{user.phone.number}</span>
              </div>
            )}
          </div>

          {/* Wallet Info */}
          <div className="space-y-3">
            {primaryWallet && (
              <div className="p-3 bg-[#111] border border-[#333] rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">External Wallet:</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {primaryWallet.walletClientType}
                  </Badge>
                </div>
                <div className="text-white text-sm font-mono">
                  {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
                </div>
              </div>
            )}
            
            {embeddedWallet && (
              <div className="p-3 bg-[#111] border border-[#333] rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Embedded Wallet:</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Privy
                  </Badge>
                </div>
                <div className="text-white text-sm font-mono">
                  {embeddedWallet.address.slice(0, 6)}...{embeddedWallet.address.slice(-4)}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleLinkWallet}
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Link Wallet
            </Button>
            
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent border-red-500 text-red-400 hover:bg-red-500/10 rounded-none"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show connection prompt
  return (
    <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-4 bg-[#111] border border-[#333] rounded-full w-20 h-20 flex items-center justify-center">
          <Wallet className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-2xl text-white">Connect to MonFarm</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-white/70 text-center">
          Connect your wallet or create a new one to access the Social Hub and interact with other farmers on Monad Testnet.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Secure wallet connection</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Monad Testnet support</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Email & social login options</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Embedded wallet creation</span>
          </div>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleConnect}
            className="w-full bg-white text-black hover:bg-white/90 rounded-none font-semibold py-3"
            size="lg"
          >
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
        </motion.div>
        
        <p className="text-xs text-white/50 text-center">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  )
}

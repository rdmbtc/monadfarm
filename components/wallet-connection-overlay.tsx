"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWalletAuth } from '@/context/wallet-auth-context';
import { useToast } from '@/components/ui/use-toast';

interface WalletConnectionOverlayProps {
  onClose?: () => void;
}

export function WalletConnectionOverlay({ onClose }: WalletConnectionOverlayProps) {
  const { 
    isConnected, 
    isConnecting, 
    isOnCorrectNetwork, 
    connectWallet, 
    switchToMonadNetwork 
  } = useWalletAuth();
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected to Nooter's Farm!",
      });
      onClose?.();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToMonadNetwork();
      toast({
        title: "Network Switched",
        description: "Successfully switched to Monad Testnet!",
      });
    } catch (error) {
      console.error("Error switching network:", error);
      toast({
        title: "Network Switch Failed",
        description: "Could not switch to Monad Testnet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // If wallet is connected and on correct network, don't show overlay
  if (isConnected && isOnCorrectNetwork) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#171717] border border-[#333] rounded-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-[#111] border border-[#333] rounded-full w-20 h-20 flex items-center justify-center">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white noot-text">
              Connect Wallet to Play
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-white/70 mb-4 noot-text">
                You need to connect your wallet to access Nooter's Farm and save your progress on the blockchain.
              </p>
              
              {!isConnected && (
                <div className="bg-[#111] border border-[#333] rounded-none p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium noot-text">Wallet Required</span>
                  </div>
                  <p className="text-white/60 text-sm noot-text">
                    Connect your MetaMask or compatible wallet to start farming and track your progress.
                  </p>
                </div>
              )}

              {isConnected && !isOnCorrectNetwork && (
                <div className="bg-[#111] border border-[#333] rounded-none p-4 mb-4">
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium noot-text">Wrong Network</span>
                  </div>
                  <p className="text-white/60 text-sm noot-text">
                    Please switch to Monad Testnet to continue playing.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!isConnected ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="w-full bg-white text-black hover:bg-white/90 rounded-none font-semibold py-3 noot-text"
                    size="lg"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-5 w-5 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : !isOnCorrectNetwork ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSwitchNetwork}
                    className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-none font-semibold py-3 noot-text"
                    size="lg"
                  >
                    Switch to Monad Testnet
                  </Button>
                </motion.div>
              ) : null}
            </div>

            <div className="text-center">
              <p className="text-xs text-white/50 noot-text">
                Your game progress will be saved securely on the Monad blockchain
              </p>
            </div>

            <div className="border-t border-[#333] pt-4">
              <div className="text-center">
                <h4 className="text-white font-medium mb-2 noot-text">Why Connect Your Wallet?</h4>
                <ul className="text-sm text-white/70 space-y-1 text-left noot-text">
                  <li>• Save your farm progress on the blockchain</li>
                  <li>• Secure ownership of your crops and items</li>
                  <li>• Trade with other players</li>
                  <li>• Earn real tokens from farming</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-white/40 noot-text">
                Don't have a wallet? Download MetaMask to get started
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

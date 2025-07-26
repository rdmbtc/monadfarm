"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Monad Testnet constants
const MONAD_CHAIN_ID = 10143;
const MONAD_CHAIN_NAME = "Monad Testnet";
const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";

interface WalletAuthContextType {
  walletAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isOnCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToMonadNetwork: () => Promise<void>;
  checkNetwork: () => Promise<void>;
}

const WalletAuthContext = createContext<WalletAuthContextType>({
  walletAddress: null,
  isConnected: false,
  isConnecting: false,
  isOnCorrectNetwork: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToMonadNetwork: async () => {},
  checkNetwork: async () => {},
});

interface WalletAuthProviderProps {
  children: ReactNode;
}

export const WalletAuthProvider = ({ children }: WalletAuthProviderProps) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);

  const isConnected = !!walletAddress;

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await checkNetwork();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      };

      const handleChainChanged = () => {
        checkNetwork();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);
        setIsOnCorrectNetwork(currentChainId === MONAD_CHAIN_ID);
      } catch (error) {
        console.error('Error checking network:', error);
        setIsOnCorrectNetwork(false);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      await checkNetwork();

      if (!isOnCorrectNetwork) {
        await switchToMonadNetwork();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsOnCorrectNetwork(false);
  };

  const switchToMonadNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MONAD_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
                chainName: MONAD_CHAIN_NAME,
                rpcUrls: [MONAD_RPC_URL],
                nativeCurrency: {
                  name: 'MON',
                  symbol: 'MON',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://testnet.monadexplorer.com'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Monad network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching to Monad network:', switchError);
        throw switchError;
      }
    }
  };

  const value: WalletAuthContextType = {
    walletAddress,
    isConnected,
    isConnecting,
    isOnCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToMonadNetwork,
    checkNetwork,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader, ExternalLink, Coins, ArrowRight } from "lucide-react";
import { Contract, getAddress } from "ethers";
import { getProvider } from "@/lib/ethers-utils";

// New Monad Testnet token addresses
const TOKEN_ADDRESSES = {
  aprMON: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  YAKI: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  CHOG: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  DAK: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  gMON: "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
  shMON: "0x3a98250F98Dd388C211206983453837C8365BDc1",
  MON: "0x0000000000000000000000000000000000000000" // Native MON token
};

// Token information for display
const TOKEN_INFO = {
  aprMON: { symbol: "aprMON", name: "April Monad" },
  YAKI: { symbol: "YAKI", name: "Moyaki" },
  CHOG: { symbol: "CHOG", name: "Chog" },
  DAK: { symbol: "DAK", name: "Molandak" },
  gMON: { symbol: "gMON", name: "gMON" },
  shMON: { symbol: "shMON", name: "ShMonad" },
  MON: { symbol: "MON", name: "Monad" }
};

// Contract addresses - UPDATE THIS AFTER DEPLOYMENT
const FARM_SWAP_ADDRESS = "0xCF7A306338f67D609932aB3f309A2C8FEa76ea85"; // TODO: Replace with actual deployed contract address

// Monad Testnet configuration
const MONAD_TESTNET_CHAIN_ID = "0x279F"; // 10143 in hex
const MONAD_BLOCK_EXPLORER = "https://testnet.monadexplorer.com";

// Contract ABIs
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
];

const SWAP_ABI = [
  "function swapTokenForFarmCoins(address tokenAddress, uint256 amount) external",
  "function swapNativeForFarmCoins() external payable",
  "function getFarmCoinsBalance(address user) external view returns (uint256)",
  "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 balance, uint256 actualBalance, string memory symbol, string memory name)",
  "function getAllSupportedTokens() external view returns (address[])",
  "function totalFarmCoins() external view returns (uint256)"
];

// Helper function for address formatting
const getChecksumAddress = (address: string): string => {
  try {
    return getAddress(address.toLowerCase());
  } catch (error) {
    console.error("Error formatting address:", error);
    return address.toLowerCase();
  }
};

interface MonadTokenSwapProps {
  farmCoins: number;
  updateFarmCoins: (newAmount: number) => void;
}

export function MonadTokenSwap({ farmCoins, updateFarmCoins }: MonadTokenSwapProps) {
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [farmCoinsBalance, setFarmCoinsBalance] = useState<string>("0");

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setWalletAddress(accounts[0]);
          await fetchBalances(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setWalletAddress(accounts[0]);
          await switchToMonadTestnet();
          await fetchBalances(accounts[0]);
          toast.success("Wallet connected successfully!");
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast.error("Failed to connect wallet");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please install MetaMask to use this feature");
    }
  };

  const switchToMonadTestnet = async () => {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId === MONAD_TESTNET_CHAIN_ID) {
        return true;
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
      });

      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MONAD_TESTNET_CHAIN_ID,
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'Monad',
                symbol: 'MON',
                decimals: 18
              },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: [MONAD_BLOCK_EXPLORER],
            }]
          });
          return true;
        } catch (addError) {
          console.error("Error adding chain:", addError);
          return false;
        }
      }
      return false;
    }
  };

  const fetchBalances = async (address: string) => {
    if (!window.ethereum) return;

    try {
      const provider = getProvider(window.ethereum);
      const balances: Record<string, string> = {};

      // Fetch token balances
      for (const [tokenKey, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        if (tokenKey === 'MON') {
          // Get native MON balance
          const balance = await provider.getBalance(address);
          balances[tokenKey] = (parseFloat(balance.toString()) / 1e18).toFixed(4);
        } else {
          // Get ERC20 token balance
          try {
            const tokenContract = new Contract(tokenAddress, TOKEN_ABI, provider);
            const balance = await tokenContract.balanceOf(address);
            balances[tokenKey] = (parseFloat(balance.toString()) / 1e18).toFixed(4);
          } catch (error) {
            console.error(`Error fetching balance for ${tokenKey}:`, error);
            balances[tokenKey] = "0";
          }
        }
      }

      setTokenBalances(balances);

      // Fetch Farm Coins balance from contract (if deployed)
      if (FARM_SWAP_ADDRESS !== "0x0000000000000000000000000000000000000000") {
        try {
          const swapContract = new Contract(FARM_SWAP_ADDRESS, SWAP_ABI, provider);
          const farmBalance = await swapContract.getFarmCoinsBalance(address);
          setFarmCoinsBalance((parseFloat(farmBalance.toString()) / 1e18).toFixed(2));
        } catch (error) {
          console.error("Error fetching farm coins balance:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const handleSwap = async () => {
    if (!selectedToken || !swapAmount || !isWalletConnected) {
      toast.error("Please select a token, enter an amount, and connect your wallet");
      return;
    }

    if (FARM_SWAP_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast.error("Farm Swap contract not deployed yet. Please wait for deployment.");
      return;
    }

    try {
      setIsLoading(true);
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amount = parseFloat(swapAmount);
      if (amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const amountWei = (amount * 1e18).toString();

      if (selectedToken === 'MON') {
        // Swap native MON for Farm Coins
        const swapContract = new Contract(FARM_SWAP_ADDRESS, SWAP_ABI, signer);
        const tx = await swapContract.swapNativeForFarmCoins({ value: amountWei });
        
        toast.loading("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        
        toast.success(`Successfully swapped ${amount} MON for ${amount} Farm Coins!`);
      } else {
        // Swap ERC20 token for Farm Coins
        const tokenAddress = TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES];
        const tokenContract = new Contract(tokenAddress, TOKEN_ABI, signer);
        const swapContract = new Contract(FARM_SWAP_ADDRESS, SWAP_ABI, signer);

        // First approve the swap contract
        toast.loading("Approving token transfer...");
        const approveTx = await tokenContract.approve(FARM_SWAP_ADDRESS, amountWei);
        await approveTx.wait();

        // Then perform the swap
        toast.loading("Swapping tokens for Farm Coins...");
        const swapTx = await swapContract.swapTokenForFarmCoins(tokenAddress, amountWei);
        await swapTx.wait();

        toast.success(`Successfully swapped ${amount} ${selectedToken} for ${amount} Farm Coins!`);
      }

      // Update local farm coins balance
      updateFarmCoins(farmCoins + amount);
      
      // Refresh balances
      if (walletAddress) {
        await fetchBalances(walletAddress);
      }

      // Reset form
      setSwapAmount("");
      setSelectedToken("");

    } catch (error: any) {
      console.error("Swap error:", error);
      toast.error(error.message || "Failed to swap tokens");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Monad Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isWalletConnected ? (
          <Button 
            onClick={connectWallet} 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
            Connect Wallet
          </Button>
        ) : (
          <>
            <div className="text-sm text-gray-400">
              Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Select Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="bg-[#2a2a2a] border-[#444]">
                  <SelectValue placeholder="Choose a token to swap" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#444]">
                  {Object.entries(TOKEN_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {info.symbol} - {info.name}
                      {tokenBalances[key] && (
                        <span className="text-gray-400 ml-2">
                          (Balance: {tokenBalances[key]})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Amount</label>
              <Input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="Enter amount to swap"
                className="bg-[#2a2a2a] border-[#444] text-white"
              />
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="text-center p-3 bg-[#2a2a2a] rounded border-[#444]">
              <div className="text-sm text-gray-300">You will receive</div>
              <div className="text-lg font-bold text-green-400">
                {swapAmount || "0"} Farm Coins
              </div>
            </div>

            <Button 
              onClick={handleSwap}
              disabled={isLoading || !selectedToken || !swapAmount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Swap for Farm Coins
            </Button>

            <div className="text-center text-sm text-gray-400">
              Current Farm Coins: {farmCoinsBalance}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

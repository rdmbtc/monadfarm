"use client"

import { useState, useContext, useEffect } from "react"
import React from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownUp, RefreshCw, ArrowRightLeft, AlertCircle, Coins, ArrowDown, Loader, ExternalLink, CheckCircle2, Plus } from "lucide-react"
// Import specific functions from ethers v6
import { ethers, Contract, formatUnits, parseUnits, BrowserProvider, JsonRpcProvider, getAddress, id, zeroPadValue } from "ethers"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Note: This component is deprecated in favor of monad-token-swap.tsx
// Keeping for backward compatibility but recommend using the new component

// Create compatibility layer for ethers v5/v6
const etherUtils = {
  formatUnits: (value: bigint | string | number, decimals: number | string): string => {
    try {
      // Use the imported formatUnits
      return formatUnits(value, decimals);
    } catch (err) {
      // Last resort fallback
      return String(Number(value) / Math.pow(10, Number(decimals)));
    }
  },
  parseUnits: (value: string, decimals: number | string): bigint => {
    try {
      // Use the imported parseUnits
      return parseUnits(value, decimals);
    } catch (err) {
      // Last resort fallback (not ideal but better than crashing)
      return BigInt(Math.floor(Number(value) * Math.pow(10, Number(decimals))));
    }
  }
};

// Create provider compatibility layer
const getProvider = (ethereum: any) => {
  try {
    // Use proper ethers v6 BrowserProvider
    return new BrowserProvider(ethereum);
  } catch (err) {
    // If all else fails, throw an error
    throw new Error("Cannot create provider with current ethers version");
  }
};

// Monad Testnet contract addresses
// Farm Coins are the internal currency - no specific token address needed
const FARM_COINS_SYMBOL = "FARM";
// This is our new MonadFarmSwap contract address - will be updated after deployment
const FARM_SWAP_ADDRESS = "0xCF7A306338f67D609932aB3f309A2C8FEa76ea85"; // To be updated after deployment



// New Monad Testnet token addresses
const TOKEN_ADDRESSES = {
  aprMON: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  YAKI: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  CHOG: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  DAK: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  gMON: "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
  shMON: "0x3a98250F98Dd388C211206983453837C8365BDc1",
  MON: "0x0000000000000000000000000000000000000000" // Native MON token (confirmed from contract docs)
};

// Token information with symbols and names
const TOKEN_INFO = {
  aprMON: { symbol: "aprMON", name: "April Monad" },
  YAKI: { symbol: "YAKI", name: "Moyaki" },
  CHOG: { symbol: "CHOG", name: "Chog" },
  DAK: { symbol: "DAK", name: "Molandak" },
  gMON: { symbol: "gMON", name: "gMON" },
  shMON: { symbol: "shMON", name: "ShMonad" },
  MON: { symbol: "MON", name: "Monad" }
};

// Block explorer URL
const MONAD_BLOCK_EXPLORER = "https://testnet.monadexplorer.com";

// Token ABI - minimal for ERC-20 interactions
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

// Updated Swap ABI to match the deployed contract
const SWAP_ABI = [
    "function swapTokenForFarmCoins(address tokenAddress, uint256 amount) external",
    "function swapNativeForFarmCoins() external payable",
    "function addToken(address tokenAddress, string memory symbol, string memory name) external",
    "function removeToken(address tokenAddress) external",
    "function fundToken(address tokenAddress, uint256 amount) external",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 balance, uint256 actualBalance, string memory symbol, string memory name)",
    "function getAllSupportedTokens() external view returns (address[])",
    "function getFarmCoinsBalance(address user) external view returns (uint256)",
    "function emergencyWithdraw(address tokenAddress, uint256 amount, address recipient) external",
    "function addMultipleTokens(address[] memory tokenAddresses, string[] memory symbols, string[] memory names) external",
    "function totalFarmCoins() external view returns (uint256)"
];

// Add a helper function to properly format addresses for ethers v6
const getChecksumAddress = (address: string): string => {
  try {
    // Ensure the address is lowercase first to avoid checksum errors
    const lowercaseAddress = address.toLowerCase();
    return getAddress(lowercaseAddress);
  } catch (error) {
    console.error("Error formatting address:", error);
    return address.toLowerCase(); // Return lowercase address as fallback
  }
};

const MONAD_TESTNET_CHAIN_ID = "0x279F"; // 10143 in hex

// Add wallet connection options
const WALLET_OPTIONS = {
  METAMASK: "metamask"
}

// Add the FAUCET constants near other contract constants
const FAUCET_ADDRESS = '0x324B6DA594145093b003Ec9b305e2A478A76Ba88'; // Updated to match new contract address
const FAUCET_ABI = [
  "function requestTokens() external",
  "function getTokenBalance() external view returns (uint256)"
]; // Simplified ABI, add more functions if needed

// Utility function to format addresses (removed  -specific functionality)
const formatAddress = (address: string): string => {
  // Ensure the address starts with 0x
  const normalizedAddress = address.startsWith('0x')
    ? address.toLowerCase()
    : `0x${address.toLowerCase()}`;

  return normalizedAddress;
};

export const TokenSwap = () => {
  const { farmCoins, addFarmCoins, setFarmCoins } = useContext(GameContext)
  const [swapAmount, setSwapAmount] = useState<number>(100)
  const [farmToMonAmount, setFarmToMonAmount] = useState<number>(100)
  const [MonBalance, setMonBalance] = useState<number>(0)
  const [actualMonBalance, setActualMonBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFarmToMonLoading, setIsFarmToMonLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [farmToMonError, setFarmToMonError] = useState<string>("")
  const [showTxDetails, setShowTxDetails] = useState<boolean>(false)
  const [currentTx, setCurrentTx] = useState<{hash: string, status: string}>({ hash: "", status: "pending" })
  
  // New wallet connection states
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  const [activeWallet, setActiveWallet] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false)
  
  // Add new state for token management
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({})
  const [selectedToken, setSelectedToken] = useState<string>("aprMON")
  const [showTokenSelector, setShowTokenSelector] = useState<boolean>(false)
  const [supportedTokens, setSupportedTokens] = useState<string[]>([])
  const [isMultiSwapLoading, setIsMultiSwapLoading] = useState<boolean>(false)
  const [swapDirection, setSwapDirection] = useState<'Mon-to-token' | 'token-to-Mon'>('Mon-to-token')
  const [expectedOutputAmount, setExpectedOutputAmount] = useState<number>(0)
  
  const [contractMonBalance, setContractMonBalance] = useState("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGettingTestTokens, setIsGettingTestTokens] = useState(false);
  
  // Wallet connection state (removed   dependencies)
  
  // Initialize wallet providers
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  
  // Dev tools state variables (added here to avoid duplicates)
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [fundAmount, setFundAmount] = useState<number>(100);
  const [selectedFundToken, setSelectedFundToken] = useState<string>("Mon");
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [contractTokenBalances, setContractTokenBalances] = useState<{[key: string]: string}>({});
  const [isLoadingContractBalances, setIsLoadingContractBalances] = useState<boolean>(false);
  
  // Add support for registering new tokens
  const [newTokenAddress, setNewTokenAddress] = useState<string>("");
  const [newTokenExchangeRate, setNewTokenExchangeRate] = useState<number>(1);
  const [isAddingToken, setIsAddingToken] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if MetaMask is connected
    const checkMetaMaskConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsWalletConnected(true);
            setActiveWallet(WALLET_OPTIONS.METAMASK);
            setWalletAddress(accounts[0]);
            setMetamaskProvider(window.ethereum);
            fetchMonBalance(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
        }
      }
    };

    checkMetaMaskConnection();

    // Set up event listeners for wallet changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setIsWalletConnected(true);
      setWalletAddress(accounts[0]);
      fetchMonBalance(accounts[0]);
    } else {
      // If MetaMask is active wallet and disconnected
      if (activeWallet === WALLET_OPTIONS.METAMASK) {
        handleDisconnect();
      }
    }
  };
  
  // Get current provider based on active wallet
  const getCurrentProvider = () => {
    console.log("Getting provider for wallet type:", activeWallet);

    switch (activeWallet) {
      case WALLET_OPTIONS.METAMASK:
        if (!metamaskProvider) {
          console.warn("metamaskProvider not available yet for MetaMask wallet");
          return null;
        }
        console.log("Returning MetaMask provider");
        return metamaskProvider;
      default:
        const defaultProvider = window.ethereum || null;
        console.log("Returning default provider:", defaultProvider ? "Available" : "Not available");
        return defaultProvider;
    }
  };
  
  // Get a proper ethers provider based on the wallet type
  const getEthersProvider = async () => {
    switch (activeWallet) {
      case WALLET_OPTIONS.METAMASK:
        if (!metamaskProvider) {
          throw new Error("No MetaMask provider available");
        }
        const ethProviderMM = getProvider(metamaskProvider);
        return {
          provider: ethProviderMM,
          signer: await ethProviderMM.getSigner(),
          is : false
        };

      default:
        if (!window.ethereum) {
          throw new Error("No wallet provider detected");
        }
        const ethProvider = getProvider(window.ethereum);
        return {
          provider: ethProvider,
          signer: await ethProvider.getSigner(),
          is : false
        };
    }
  };
  
  // Connect wallet
  const connectWallet = async (walletType: string) => {
    try {
      setIsLoading(true);

      switch (walletType) {
        case WALLET_OPTIONS.METAMASK:
          await connectMetaMask();
          break;
        default:
          console.error("Unknown wallet type");
      }

      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      toast.error(`Failed to connect to ${walletType}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect to MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask extension.");
      throw new Error("MetaMask not available");
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.METAMASK);
        setWalletAddress(accounts[0]);
        setMetamaskProvider(window.ethereum);
        
        // Switch to Monad Testnet
        await switchToMonadTestnet(window.ethereum);
        
        // Fetch Mon balance
        fetchMonBalance(accounts[0]);
        toast.success("Connected to MetaMask");
      } else {
        throw new Error("No accounts found after connecting MetaMask");
      }
    } catch (error) {
      console.error("MetaMask connection error:", error);
      throw error;
    }
  };
  
  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      switch (activeWallet) {
        case WALLET_OPTIONS.METAMASK:
          // MetaMask doesn't have a disconnect method in its API
          // We just reset the state
          break;
      }

      // Reset connection state
      setIsWalletConnected(false);
      setActiveWallet(null);
      setWalletAddress(null);
      setActualMonBalance("0");

      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };
  
  // Update switchToMonadTestnet to support multiple providers
  const switchToMonadTestnet = async (provider: any = null) => {
    // Use provided provider or get current provider
    const targetProvider = provider || getCurrentProvider();

    if (!targetProvider) {
      toast.error("No wallet provider detected");
      return false;
    }

    try {
      // Check current network
      const chainId = await targetProvider.request({ method: 'eth_chainId' });
      console.log("Current chain ID:", chainId);

      // Already on Monad Testnet
      if (chainId === MONAD_TESTNET_CHAIN_ID) {
        toast.success("Already connected to Monad Testnet");
        return true;
      }

      // Try to switch to Monad Testnet
      await targetProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CHAIN_ID }], // Monad Testnet
      });

      toast.success("Successfully switched to Monad Testnet");
      return true;
    } catch (switchError: any) {
      // This error code indicates the chain has not been added to the wallet
      if (switchError.code === 4902 || (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902)) {
        try {
          console.log("Chain not added to wallet. Attempting to add it now...");
          await targetProvider.request({
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
              iconUrls: []
            }]
          });
          toast.success("Monad Testnet added to your wallet");
          return true;
        } catch (addError) {
          console.error("Error adding chain:", JSON.stringify(addError, Object.getOwnPropertyNames(addError)));
          toast.error("Could not add Monad Testnet to your wallet");
          return false;
        }
      } else {
        console.error("Error switching network:", switchError);
        toast.error("Failed to switch to Monad Testnet. Please switch manually in your wallet.");
        return false;
      }
    }
  };
  
  // Update fetchMonBalance to support multiple providers
  const fetchMonBalance = async (address: string) => {
    try {
      console.log("Fetching Mon balance for address:", address);
      
      const provider = getCurrentProvider();
      if (!provider) {
        console.log("No provider found");
        setActualMonBalance("0");
        return;
      }

      // Get provider information consistently using our standardized approach
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for balance check, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for balance check:", error);
        setActualMonBalance("0");
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const is  = ethersProviderInfo.is ;
      
      // Check network/chain ID
      let chainId;

      // For standard wallets, check current network
      chainId = await provider.request({ method: 'eth_chainId' });
      console.log("Current chain ID when fetching balance:", chainId);

      // Ensure wallet address is properly checksummed
      const checksummedWalletAddress = getChecksumAddress(address);
      console.log("Wallet address (checksummed):", checksummedWalletAddress);

      // If we're not on Monad Testnet, show placeholder balance
      if (chainId !== MONAD_TESTNET_CHAIN_ID) {
        console.log("Not on Monad Testnet, showing placeholder balance");
        setActualMonBalance("0");
        return;
      }

      try {
        // Check if MON is native token (zero address) or ERC-20
        const monTokenAddress = TOKEN_ADDRESSES.MON;
        console.log("Checking MON balance for address:", monTokenAddress);

        if (monTokenAddress === "0x0000000000000000000000000000000000000000") {
          // MON is native token - check native balance
          console.log("MON is native token - checking native balance...");
          try {
            const nativeBalance = await ethersProvider.getBalance(checksummedWalletAddress);
            const formattedMonBalance = etherUtils.formatUnits(nativeBalance, 18);

            console.log("Native MON balance:", formattedMonBalance);
            setActualMonBalance(formattedMonBalance);

            if (parseFloat(formattedMonBalance) > 0) {
              console.log(`Found ${formattedMonBalance} native MON!`);
            } else {
              console.log("No native MON found. You may need to get some MON tokens.");
            }
          } catch (error) {
            console.log("Error checking native MON balance:", error);
            setActualMonBalance("0");
          }
        } else {
          // MON is ERC-20 token - check token balance
          console.log("MON is ERC-20 token - checking token balance...");
          try {
            const checksummedMonAddress = getChecksumAddress(monTokenAddress);
            const monTokenContract = new Contract(checksummedMonAddress, TOKEN_ABI, ethersProvider);
            const monBalance = await monTokenContract.balanceOf(checksummedWalletAddress);
            const formattedMonBalance = etherUtils.formatUnits(monBalance, 18);

            console.log("ERC-20 MON token balance:", formattedMonBalance);
            setActualMonBalance(formattedMonBalance);

            if (parseFloat(formattedMonBalance) > 0) {
              console.log(`Found ${formattedMonBalance} ERC-20 MON tokens!`);
            } else {
              console.log("No ERC-20 MON tokens found. Try the 'Find MON Tokens' button.");
            }
          } catch (error) {
            console.log("Error checking ERC-20 MON token balance:", error);
            setActualMonBalance("0");
          }
        }

        // Also check contract's native MON balance for UI display
        try {
          const contractBalance = await ethersProvider.getBalance(getChecksumAddress(FARM_SWAP_ADDRESS));
          const formattedContractBalance = etherUtils.formatUnits(contractBalance, 18);
          console.log("Contract native MON balance:", formattedContractBalance);
          setContractMonBalance(formattedContractBalance);
        } catch (error) {
          console.log("Error checking contract native MON balance:", error);
          setContractMonBalance("0");
        }
        
        // Also fetch all token balances
        fetchAllTokenBalances();
      } catch (e) {
        console.error("Error accessing contract:", e);
        // Don't update the state on error - keeps previous valid balance
      }
    } catch (error) {
      console.error("Error fetching Mon balance:", error);
      // Set fallback values on complete error
      setActualMonBalance("0");  
    }
  };
  
  // Update checkContractBalance to handle missing provider better
  const checkContractBalance = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      console.warn("No provider detected in checkContractBalance - will retry later");
      // Don't show an error toast as this might be called during initialization
      return;
    }
    
    try {
      // Get provider information consistently using our standardized approach
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for contract balance check, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for contract balance check:", error);
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const is  = ethersProviderInfo.is ;
      
      // Check chain ID
      let chainId;

      // For standard wallets, check current network
      chainId = await provider.request({ method: 'eth_chainId' });
      console.log("Current chain ID for contract balance check:", chainId);

      if (chainId !== MONAD_TESTNET_CHAIN_ID) {
        console.log(`Currently on chain ID ${chainId}, not on Monad Testnet`);
        return;
      }
      
      // Check native MON balance of the contract
      const balanceWei = await ethersProvider.getBalance(FARM_SWAP_ADDRESS);
      const balanceFormatted = etherUtils.formatUnits(balanceWei, 18);

      setContractMonBalance(balanceFormatted);
      console.log(`Farm Swap contract native MON balance: ${balanceFormatted}`);
    } catch (error) {
      console.error("Failed to check contract balance:", error);
    }
  };
  
  // Force refresh all balances
  const forceRefreshAllBalances = async () => {
    console.log("Force refreshing all balances");
    
    if (!isWalletConnected || !walletAddress) {
      console.log("No connected wallet, skipping balance refresh");
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Try multiple times with short delays for reliability
      let retryCount = 0;
      let MonSuccess = false;
      let contractSuccess = false;
      
      while ((retryCount < 3) && (!MonSuccess || !contractSuccess)) {
        console.log(`Balance refresh attempt ${retryCount + 1}/3`);
        
        if (!MonSuccess) {
          try {
            // Update Mon balance
            await fetchMonBalance(walletAddress);
            MonSuccess = true;
            console.log("Mon balance refresh successful");
          } catch (error) {
            console.error(`Mon balance refresh attempt ${retryCount + 1} failed:`, error);
            // Will retry unless max retries reached
          }
        }
        
        if (!contractSuccess) {
          try {
            // Update contract balance
            await checkContractBalance();
            contractSuccess = true;
            console.log("Contract balance refresh successful");
          } catch (error) {
            console.error(`Contract balance refresh attempt ${retryCount + 1} failed:`, error);
            // Will retry unless max retries reached
          }
        }
        
        if (!MonSuccess || !contractSuccess) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between retries
          retryCount++;
        }
      }
      
      // Log final status
      if (MonSuccess && contractSuccess) {
        console.log("All balances refreshed successfully");
      } else {
        console.warn("Some balance refreshes failed after 3 attempts", {
          MonSuccess,
          contractSuccess
        });
      }
    } catch (error) {
      console.error("Error refreshing balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Make the Farm Coins state update more responsive
  const updateFarmCoins = (newAmount: number) => {
    console.log(`Updating Farm Coins to ${newAmount}`);
    setFarmCoins(newAmount);
    // Add a small delay and then refresh balances again to ensure sync
    setTimeout(() => {
      forceRefreshAllBalances();
    }, 1000);
  };
  
  // Monitor transaction for confirmation
  const monitorTransaction = async (txHash: string, onConfirm: () => void) => {
    const provider = getCurrentProvider();
    if (!provider) return;
    
    try {
      // Get provider information consistently
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for transaction monitoring, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for monitoring:", error);
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      
      // Wait for transaction to be mined
      const receipt = await ethersProvider.waitForTransaction(txHash);
      
      // Check if receipt exists and was successful
      if (receipt && receipt.status === 1) {
        console.log(`Transaction ${txHash} confirmed`);
        // Call callback
        onConfirm();
        // Also refresh balances
        forceRefreshAllBalances();
      } else {
        console.error(`Transaction ${txHash} failed or null receipt`);
      }
    } catch (error) {
      console.error(`Error monitoring transaction ${txHash}:`, error);
    }
  };
  
  // Add a function to view token on explorer
  const viewOnExplorer = (type: "token" | "address" | "contract" | string, address: string) => {
    let url = MONAD_BLOCK_EXPLORER;
    
    switch(type) {
      case "token":
        url += `/token/${address}`;
        break;
      case "address":
        url += `/address/${address}`;
        break;
      case "contract":
        url += `/address/${address}`;
        break;
      default:
        url += `/${type}/${address}`;
    }
    
    window.open(url, '_blank');
  };
  
  // Debug function to verify contract configuration
  const debugContractConfig = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("No wallet provider detected");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Checking contract configuration...", { id: "debug-toast" });
      
      // Get provider information consistently
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for contract debugging, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for debugging:", error);
        toast.error("Could not connect to your wallet for debugging");
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      
      // Check if we're using the correct addresses
      const checksummedMonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Create contract instances 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function name() view returns (string)"];
      const MonContract = new Contract(checksummedMonAddress, tokenAbi, ethersProvider);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      // Verify Mon token contract is valid
      const tokenName = await MonContract.name().catch(e => "Error: Cannot read token name");
      
      // Check what token the FarmSwap contract thinks it's using
      const contractTokenAddress = await swapContract.MonToken().catch(e => "Error: Cannot read token address from FarmSwap");
      
      // Check FarmSwap contract's Mon balance
      const contractMonBalanceWei = await MonContract.balanceOf(checksummedFarmSwapAddress).catch(e => "Error: Cannot read contract balance");
      
      // Format balances for display
      let formattedContractBalance: string;
      try {
        formattedContractBalance = formatUnits(contractMonBalanceWei, 18);
      } catch (err) {
        formattedContractBalance = etherUtils.formatUnits(contractMonBalanceWei, 18);
      }
      
      toast.dismiss("debug-toast");
      
      // Display results
      const debugInfo = {
        MonTokenAddress: checksummedMonAddress,
        farmSwapAddress: checksummedFarmSwapAddress,
        tokenName: tokenName,
        // FIX: Only call getChecksumAddress if it's a valid address string
        contractTokenAddress: (typeof contractTokenAddress === 'string' && contractTokenAddress.startsWith('0x')) 
           ? getChecksumAddress(contractTokenAddress) 
           : contractTokenAddress, // Keep the error string as is
        contractMonBalance: formattedContractBalance
      };
      
      console.log("Contract configuration:", debugInfo);
      
      // Check if addresses match
      const addressesMatch = typeof contractTokenAddress === 'string' && contractTokenAddress.startsWith('0x') && checksummedMonAddress.toLowerCase() === contractTokenAddress.toLowerCase();
      
      if (addressesMatch) {
        console.log("✅ Token addresses match between UI and FarmSwap contract");
        toast.success("Contract configuration looks good!");
      } else {
        console.log("❌ Token addresses DON'T MATCH between UI and FarmSwap contract");
        toast.error("Contract configuration mismatch! Check console for details.");
      }
      
      // Return debug info for UI rendering
      return debugInfo;
    } catch (error) {
      console.error("Debug error:", error);
      toast.dismiss("debug-toast");
      toast.error("Error checking contract configuration");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced refresh function with loading state
  const handleManualRefresh = async () => {
    if (isRefreshing || !isWalletConnected) return;
    
    setIsRefreshing(true);
    toast.success("Refreshing balances...");
    
    try {
      await forceRefreshAllBalances();
      toast.success("All balances updated successfully!");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh balances. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add wallet options dialog
  const WalletOptionsDialog = () => (
    <Dialog open={showWalletOptions} onOpenChange={setShowWalletOptions}>
      <DialogContent className="bg-[#111] border border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-white Mon-title">Connect Wallet</DialogTitle>
          <DialogDescription className="text-white/60 Mon-text">
            Choose a wallet to connect to Moners Farm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {/* MetaMask */}
          <Button
            onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
            className="bg-[#F6851B] hover:bg-[#E2761B] text-white flex items-center justify-between w-full"
            disabled={isLoading}
          >
            <span>MetaMask</span>
            {isLoading && activeWallet === WALLET_OPTIONS.METAMASK ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <img src="/images/metamask-logo.svg" alt="MetaMask" className="h-5 w-5" />
            )}
          </Button>
          

        </div>
        
        <DialogFooter>
          <Button
            onClick={() => setShowWalletOptions(false)}
            variant="outline"
            className="w-full border-[#333]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Get test tokens from faucet
  const getTestTokens = async () => {
    setIsGettingTestTokens(true);
    setError("");

    // Even if the faucet call fails, we'll still provide Farm Coins as a fallback
    let faucetSuccess = false;
    
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      setIsGettingTestTokens(false);
      return;
    }

    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      setIsGettingTestTokens(false);
      return;
    }

    try {
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsGettingTestTokens(false);
        return;
      }
      
      // Extract provider information
      const is  = ethersProviderInfo.is ;
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;

      // Check network ID to ensure we're on Monad Testnet
      let chainId;
      try {
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Current chain ID:", chainId);

        // Check if on Monad Testnet
        if (chainId !== MONAD_TESTNET_CHAIN_ID) {
          console.log("Not on Monad Testnet, attempting to switch network...");
          const switched = await switchToMonadTestnet();
          if (!switched) {
            setError("Failed to switch to Monad Testnet. Please switch manually in your wallet.");

            // Provide Farm Coins anyway as fallback
            updateFarmCoins(farmCoins + 500);
            toast.success("Added 500 Farm Coins as a fallback, but you need to switch to Monad Testnet for full functionality.");

            setIsGettingTestTokens(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setError("Failed to switch to Monad Testnet. Please switch manually in your wallet.");
        setIsGettingTestTokens(false);
        return;
      }

      // Get wallet address
      let walletAddr;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      walletAddr = accounts[0];
      console.log("Using wallet address:", walletAddr);

      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsGettingTestTokens(false);
        return;
      }

      // Create contract instance
      const checksummedFaucetAddress = getChecksumAddress(FAUCET_ADDRESS);
      console.log("Using faucet address:", checksummedFaucetAddress);

      console.log("Requesting test tokens...");
      toast.loading("Requesting test tokens...", {id: "faucet-toast"});

      // Standard wallet transaction handling
      try {
        let txHash;

        // For standard wallets
        const faucetContract = new Contract(checksummedFaucetAddress, FAUCET_ABI, signer);

        const tx = await faucetContract.requestTokens({
          gasLimit: 300000,
        });

        txHash = tx.hash;
        console.log("Test token request transaction sent:", txHash);

        // Set transaction details
        setCurrentTx({
          hash: txHash,
          status: "pending"
        });
        setShowTxDetails(true);

        toast.loading("Transaction sent. Waiting for confirmation...", {id: "faucet-toast"});

        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("faucet-toast");

        // Update transaction status
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));

        if (receipt && receipt.status === 1) {
          // Transaction successful
          await fetchMonBalance(walletAddr);
          toast.success("Successfully received test tokens!");

          // Force refresh after a delay
          setTimeout(() => forceRefreshAllBalances(), 2000);

          // Mark faucet request as successful
          faucetSuccess = true;
        } else {
          toast.error("Failed to get test tokens. The transaction was reverted.");
          // faucetSuccess remains false for the fallback to kick in
        }
      } catch (error: any) {
        toast.dismiss("faucet-toast");
        console.error("Transaction error:", error);
        
        // More detailed error analysis and logging
        console.log("Detailed transaction error info:", {
          code: error?.code,
          message: error?.message || "Unknown error",
          data: error?.data,
          reason: error?.reason,
          error: error?.error,
          receipt: error?.receipt,
          transaction: error?.transaction
        });
        
        // Check receipt status for transaction reversion
        const hasReceipt = error?.receipt || error?.transaction?.receipt;
        const reverted = hasReceipt && hasReceipt.status === 0;
        
        // More detailed error handling with proper error typing
        if (error?.code === "ACTION_REJECTED") {
          setError("You rejected the transaction");
          toast.error("You rejected the transaction. Please try again if you want test tokens.");
        } else {
          // Provide more detailed error information 
          const errorReason = error?.reason || error?.message || "Unknown error";
          const detailedError = error?.details || (error?.data ? error.data.message : "") || "";
          
          // Prepare user-friendly message based on the error
          let userFriendlyMessage = "Transaction failed";
          
          if (reverted) {
            userFriendlyMessage = "Contract execution reverted";
            // Check if it's likely a rate limiting or already claimed issue
            if (errorReason.toLowerCase().includes("limit") || 
                detailedError.toLowerCase().includes("limit") ||
                errorReason.toLowerCase().includes("already") || 
                detailedError.toLowerCase().includes("already")) {
              userFriendlyMessage = "You may have already claimed tokens recently";
            }
          }
          
          setError(`Transaction failed: ${errorReason}`);
          
          console.log("Detailed error information:", {
            error,
            message: error?.message || "No message",
            reason: error?.reason || "No reason",
            details: error?.details || "No details",
            data: error?.data || "No data"
          });
          
          // Create error toast with proper React elements
          const errorToastContent = React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, userFriendlyMessage + ":"),
            React.createElement("p", { className: "text-xs", key: "message" }, errorReason),
            detailedError ? React.createElement("p", { className: "text-xs text-red-300", key: "details" }, detailedError) : null,
            reverted ? React.createElement("p", { className: "text-xs text-yellow-300 mt-1", key: "suggestion" }, 
              "This usually means you've already claimed tokens or there's a time limit between claims.") : null
          ]);
          
          toast.error(errorToastContent, {duration: 10000});
          
          // If transaction reverted, check contract balance and try a fallback direct claim
          if (reverted) {
            setTimeout(() => {
              console.log("Checking contract balance after revert...");
              checkContractBalance()
                .then(() => console.log("Balance check completed"))
                .catch(err => console.error("Error checking balance:", err));
            }, 2000);
            
            // Try using a direct Mon to Farm Coins swap as fallback
            setTimeout(() => {
              toast("Trying alternative approach to get coins...", 
                {icon: "⚙️", duration: 3000});
              
              // Add some farm coins directly as fallback 
              updateFarmCoins(farmCoins + 500);
              toast.success("Added 500 Farm Coins as a fallback. Try the swap functionality instead.", 
                {duration: 5000});
            }, 3000);
          }
        }
      }
    } catch (error: any) {
      toast.dismiss("faucet-toast");
      console.error("Error getting test tokens:", error);
      toast.error(`An unexpected error occurred: ${error?.message || "Unknown error"}`);
    } finally {
      // If faucet request failed, provide Farm Coins as fallback to enable gameplay
      if (!faucetSuccess) {
        console.log("Faucet request failed or was rejected. Adding Farm Coins as fallback.");
        setTimeout(() => {
          // Add Farm Coins directly since Mon token request failed
          updateFarmCoins(farmCoins + 500);
          toast.success(
            React.createElement("div", { className: "space-y-1 text-sm" }, [
              React.createElement("p", { className: "font-semibold", key: "title" }, "Added 500 Farm Coins as fallback!"),
              React.createElement("p", { className: "text-xs", key: "message" }, "You can continue playing with Farm Coins even without Mon tokens.")
            ]),
            {duration: 5000}
          );
        }, 500);
      }
      
      setIsGettingTestTokens(false);
    }
  };

  // Add Mon token to wallet - using a reliable manual approach instead of problematic wallet_watchAsset
  const addTokenToWallet = async () => {
    try {
      // Get checksummed address
      const checksummedAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      console.log("Adding token to wallet:", checksummedAddress);
      
      const provider = getCurrentProvider();
      if (!provider) {
        toast.error("No wallet provider detected");
        return;
      }
      

      
      // Try to use wallet_watchAsset for other wallets
      try {
        console.log("Attempting to add token using wallet_watchAsset method");
        
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC20',
              options: {
                address: checksummedAddress,
                symbol: 'Mon',
                decimals: 18,
                image: 'https://Moners.farm/logo.png',
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added successfully!');
          toast.success("Mon token added to your wallet!");
        } else {
          console.log('User rejected adding the token, using fallback method');
          fallbackToManualMethod(checksummedAddress);
        }
      } catch (error) {
        console.error("Error using wallet_watchAsset:", error);
        // Use fallback method without throwing a new error
        console.log("wallet_watchAsset not supported, using fallback method");
        fallbackToManualMethod(checksummedAddress);
      }
    } catch (error) {
      console.error("Token addition error:", error);
      toast.error("Error adding token to wallet", {
        duration: 5000,
      });
      fallbackToManualMethod(TOKEN_ADDRESSES.MON);
    }
  };
  
  // Fallback method for adding tokens
  const fallbackToManualMethod = (tokenAddress: string) => {
    // Copy the checksummed token address to clipboard
    navigator.clipboard.writeText(tokenAddress).then(() => {
      // Show token address copied confirmation
      toast.success("Token address copied to clipboard!", {
        duration: 5000,
        icon: "📋"
      });
      
      // Show detailed instructions toast
      setTimeout(() => {
        toast.success(
          React.createElement("div", { className: "text-xs space-y-1" },
            React.createElement("p", { className: "font-bold" }, "Add $Mon to your wallet:"),
            React.createElement("p", null, "1. Open your wallet"),
            React.createElement("p", null, "2. Select \"Import token\" or \"Add token\""),
            React.createElement("p", null, "3. Paste the address"),
            React.createElement("p", null, "4. Enter \"Mon\" for symbol and \"18\" for decimals")
          ),
          { duration: 7000 }
        );
      }, 1000);
    }).catch(err => {
      console.error("Clipboard error:", err);
      // Fallback for clipboard errors
      toast(
        React.createElement("div", { className: "text-xs space-y-1 mt-2" },
          React.createElement("p", { className: "font-semibold" }, "Add token manually with these details:"),
          React.createElement("p", null, "Address: ", React.createElement("span", { className: "font-mono bg-black/40 px-1" }, tokenAddress)),
          React.createElement("p", null, "Symbol: Mon | Decimals: 18")
        ),
        { duration: 10000 }
      );
    });
  };

  // Add the selected token to wallet
  const addSelectedTokenToWallet = async (tokenKey = selectedToken) => {
    if (!tokenKey) return;
    
    try {
      // Get the token address and info
      const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
      const tokenInfo = TOKEN_INFO[tokenKey as keyof typeof TOKEN_INFO];
      
      if (!tokenAddress || !tokenInfo) {
        toast.error("Token information not found");
        return;
      }
      
      console.log(`Adding ${tokenKey} token to wallet:`, tokenAddress);
      
      const provider = getCurrentProvider();
      if (!provider) {
        toast.error("No wallet provider detected");
        return;
      }
      

      
      // Try to use wallet_watchAsset for other wallets
      try {
        console.log("Attempting to add token using wallet_watchAsset method");
        
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC20',
              options: {
                address: tokenAddress,
                symbol: tokenInfo.symbol,
                decimals: 18,
                image: `https://Moners.farm/tokens/${tokenKey.toLowerCase()}.png`, // Fallback image path
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added successfully!');
          toast.success(`${tokenInfo.symbol} token added to your wallet!`);
        } else {
          console.log('User rejected adding the token, using fallback method');
          fallbackToManualTokenMethod(tokenAddress, tokenInfo);
        }
      } catch (error) {
        console.error("Error using wallet_watchAsset:", error);
        // Use fallback method without throwing a new error
        console.log("wallet_watchAsset not supported, using fallback method");
        fallbackToManualTokenMethod(tokenAddress, tokenInfo);
      }
    } catch (error) {
      console.error("Token addition error:", error);
      toast.error("Error adding token to wallet", {
        duration: 5000,
      });
    }
  };

  // Fallback method for adding any token
  const fallbackToManualTokenMethod = (tokenAddress: string, tokenInfo: {symbol: string, name: string}) => {
    // Copy the checksummed token address to clipboard
    navigator.clipboard.writeText(tokenAddress).then(() => {
      // Show token address copied confirmation
      toast.success("Token address copied to clipboard!", {
        duration: 5000,
        icon: "📋"
      });
      
      // Show detailed instructions toast
      setTimeout(() => {
        toast.success(
          React.createElement("div", { className: "text-xs space-y-1" },
            React.createElement("p", { className: "font-bold" }, `Add ${tokenInfo.symbol} to your wallet:`),
            React.createElement("p", null, "1. Open your wallet"),
            React.createElement("p", null, "2. Select \"Import token\" or \"Add token\""),
            React.createElement("p", null, "3. Paste the address"),
            React.createElement("p", null, `4. Enter "${tokenInfo.symbol}" for symbol and "18" for decimals`)
          ),
          { duration: 7000 }
        );
      }, 1000);
    }).catch(err => {
      console.error("Clipboard error:", err);
      // Fallback for clipboard errors
      toast(
        React.createElement("div", { className: "text-xs space-y-1 mt-2" },
          React.createElement("p", { className: "font-semibold" }, `Add token manually with these details:`),
          React.createElement("p", null, "Address: ", React.createElement("span", { className: "font-mono bg-black/40 px-1" }, tokenAddress)),
          React.createElement("p", null, `Symbol: ${tokenInfo.symbol} | Decimals: 18`)
        ),
        { duration: 10000 }
      );
    });
  };

  // Swap MON for Farm Coins with blockchain transaction
  const swapMonForFarmCoins = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsLoading(false);
        return;
      }
      
      // For blockchain swaps, we need to check actual balance
      if (parseFloat(actualMonBalance) < swapAmount) {
        toast.error(`Not enough MON tokens. You have ${actualMonBalance} MON`);
        setIsLoading(false);
        return;
      }
      
      console.log("Preparing Mon to Farm Coins swap transaction...");
      
      // Calculate Farm Coins to receive (1 MON = 10,000 Farm Coins)
      const farmCoinsToReceive = swapAmount * 10000;
      
      // Store initial farm coins to ensure proper update
      const initialFarmCoins = farmCoins;
      
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Extract provider and signer from the provider info
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      const is  = ethersProviderInfo.is ;
      
      // Check network ID to ensure we're on Monad Testnet
      let chainId;
      try {
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Current chain ID:", chainId);

        // Check if on Monad Testnet
        if (chainId !== MONAD_TESTNET_CHAIN_ID) {
          console.log("Not on Monad Testnet, attempting to switch network...");
          const switched = await switchToMonadTestnet();
          if (!switched) {
            setError("Failed to switch to Monad Testnet. Please switch manually in your wallet.");
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setError("Failed to switch to Monad Testnet. Please switch manually in your wallet.");
        setIsLoading(false);
        return;
      }
      
      // Get the connected wallet address
      let walletAddr;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      walletAddr = accounts[0];
      console.log("Using wallet address:", walletAddr);
      
      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsLoading(false);
        return;
      }
      
      // Create contract instances
      const checksummedMonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      console.log("Creating contracts with signer:", signer ? "Available" : "Not available");
      const MonContract = new Contract(checksummedMonAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      console.log("Contract instances created");
      
      // Format amount with proper decimals for the blockchain
      const MonAmount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      console.log("Amount to swap:", MonAmount.toString());
      
      // STEP 1: Approve Mon tokens for spending
      console.log("Approving token spend...");
      try {
        // Check current allowance first
        const checksummedWalletAddress = getChecksumAddress(walletAddr);
        const currentAllowance = await MonContract.allowance(checksummedWalletAddress, checksummedFarmSwapAddress);
        console.log("Current allowance:", currentAllowance.toString());
        
        // Only approve if needed - use a much larger allowance to prevent frequent approvals
        if (currentAllowance < MonAmount) {
          console.log("Allowance insufficient, requesting approval...");
          
          // Due to limitations with MetaMask, we need to use a large approval amount for tokens
          const largeApprovalAmount = parseUnits("10000000", 18); // 10 million tokens
          
          toast.success(
            React.createElement("div", { className: "space-y-1 text-sm" },
              React.createElement("p", { className: "font-semibold" }, "Approval Required"),
              React.createElement("p", { className: "text-xs" }, "Please approve MON tokens in your wallet"),
              React.createElement("p", { className: "text-xs" }, "This is required only once")
            ),
            {duration: 8000}
          );
          
          // Before sending transaction, show toast that we're preparing approval
          toast.loading("Preparing approval transaction...", { id: "approval-toast" });
          
          try {
            // Execute approval - using a consistent approach for all wallet types
            console.log(`Executing approval with wallet type: ${activeWallet}`);
            
            let approvalTx: any;
            let approvalTxHash: string;
            
            // Standard wallets use regular ethers.js calls
            approvalTx = await MonContract.approve(checksummedFarmSwapAddress, largeApprovalAmount);
            approvalTxHash = approvalTx.hash;
            
            console.log("Approval transaction submitted:", approvalTxHash);
            
            // Show transaction details
            setCurrentTx({
              hash: approvalTxHash,
              status: "pending"
            });
            setShowTxDetails(true);

            // Handle confirmation for standard wallets
            toast.loading("Waiting for approval confirmation...", { id: "approval-toast" });
            await approvalTx.wait();

            toast.dismiss("approval-toast");
            toast.success("Mon spending approved!");
          } catch (approvalError: any) {
            toast.dismiss("approval-toast");
            console.error("Approval error:", approvalError);
            
            if (approvalError.code === "ACTION_REJECTED") {
              setError("You rejected the approval transaction");
              toast.error("Transaction canceled: You rejected the approval");
              setIsLoading(false);
              return;
            } else {
              setError(approvalError.reason || approvalError.message || "Approval transaction failed");
              toast.error("Approval failed: " + (approvalError.reason || approvalError.message || "Unknown error"));
              setIsLoading(false);
              return;
            }
          }
        } else {
          console.log("Sufficient allowance already granted");
        }
        
        // IMPORTANT: Use the correct swap function from the MonerSwap contract
        try {
          toast.loading("Processing swap via direct transfer...", { id: "swap-toast" });
          
          // Instead of direct transfer, use the swapMonForToken function directly
          // First determine which farm token to swap to (default to aprMON)
          const farmToken = selectedToken || "aprMON";
          const farmTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[farmToken as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Calling swapMonForToken with target token: ${farmToken} (${farmTokenAddress}) and amount: ${MonAmount.toString()}`);
          
          const tx = await swapContract.swapMonForToken(farmTokenAddress, MonAmount, {
            gasLimit: 2000000
          });
          
          console.log("Swap transaction submitted:", tx.hash);
          setCurrentTx({
            hash: tx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await tx.wait();
          toast.dismiss("swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              // Enhanced Dopamine Toast! ✨
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 text-2xl">💰</span>
                </span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP SUCCESS!</p>
                  <p className="text-sm text-white/90">You got {farmCoinsToReceive} Farm Coins!</p>
                </div>
              </div>,
              {
                duration: 4000, // Longer duration
                icon: '🎉', // Fun icon
                style: { // Remove default styling
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Update farm coins
            updateFarmCoins(farmCoinsToReceive);
            
            // Update Mon balance
            await fetchMonBalance(walletAddr);
            
            // Reset input
            setSwapAmount(0);
          } else {
            throw new Error("Swap transaction failed with status 0");
          }
        } catch (error: unknown) {
          console.error("Error in swap process:", error);
          setError(error instanceof Error ? error.message : "Something went wrong with the swap");
          toast.error("Failed to complete the swap");
        } finally {
          setIsLoading(false);
        }
      } catch (error: unknown) {
        console.error("Error in swap process:", error);
        setError(error instanceof Error ? error.message : "Something went wrong with the swap");
        toast.error("Failed to complete the swap");
      } finally {
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("Error in swap process:", error);
      setError(error instanceof Error ? error.message : "Something went wrong with the swap");
      toast.error("Failed to complete the swap");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap Farm Coins for Mon with blockchain transaction
  const swapFarmCoinsForMon = async () => {
    setIsFarmToMonLoading(true);
    setFarmToMonError("");
    
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      setIsFarmToMonLoading(false);
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      setIsFarmToMonLoading(false);
      return;
    }
    
    try {
      // Validate input
      if (farmToMonAmount <= 0) {
        toast.error("Please enter a valid amount of Farm Coins");
        setIsFarmToMonLoading(false);
        return;
      }
      
      if (farmToMonAmount > farmCoins) {
        toast.error(`Not enough Farm Coins. You have ${farmCoins} Farm Coins`);
        setIsFarmToMonLoading(false);
        return;
      }
      
      // Calculate Mon to receive (10 Farm Coins = 1 Mon)
      let MonToReceive = farmToMonAmount / 10;
      
      // IMPORTANT: Limit the maximum amount to claim to 10 Mon to avoid failures
      // The contract may not have enough Mon tokens for larger claims
      if (MonToReceive > 10) {
        MonToReceive = 10;
        toast.loading(
          React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, "Amount Reduced:"),
            React.createElement("p", { className: "text-xs", key: "message" }, 
              `Limited claim to 10 Mon to avoid contract errors. The contract may not have enough reserves for larger amounts.`)
          ]),
          {id: "limit-toast", duration: 3000}
        );
      }
      
      console.log(`Swapping ${farmToMonAmount} Farm Coins for ${MonToReceive} Mon...`);
      
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsFarmToMonLoading(false);
        return;
      }
      
      // Extract provider and signer from the provider info
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      const is  = ethersProviderInfo.is ;
      
      // Check network ID to ensure we're on Monad Testnet
      let chainId;
      try {
        // For standard wallets, check the chain ID
        if (false) {
          chainId = MONAD_TESTNET_CHAIN_ID;
          console.log("Using standard wallet, assuming chain ID:", chainId);
        } else {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Current chain ID:", chainId);
        }
        
        // Check if on Monad Testnet
        if (chainId !== MONAD_TESTNET_CHAIN_ID) {
          console.log("Not on Monad Testnet, attempting to switch network...");
          const switched = await switchToMonadTestnet();
          if (!switched) {
            setFarmToMonError("Failed to switch to Monad Testnet. Please switch manually in your wallet.");
            setIsFarmToMonLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setFarmToMonError("Failed to check or switch to Monad Testnet.");
        setIsFarmToMonLoading(false);
        return;
      }
      
      // Get the wallet address
      let walletAddr;
      if (false) {
        walletAddr = "";
        console.log("Using standard wallet address:", walletAddr);
      } else {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        walletAddr = accounts[0];
        console.log("Using wallet address:", walletAddr);
      }
      
      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsFarmToMonLoading(false);
        return;
      }
      
      // Create contract instances with contract runner that works for both   and standard wallets
      const checksummedMonTokenAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS); // Use FARM_SWAP_ADDRESS here
      const MonContract = new Contract(checksummedMonTokenAddress, TOKEN_ABI, ethersProvider);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      // First check contract's Mon balance
      const contractBalance = await MonContract.balanceOf(checksummedFarmSwapAddress);
      let formattedBalance;
      
      try {
        formattedBalance = formatUnits(contractBalance, 18);
      } catch (err) {
        formattedBalance = etherUtils.formatUnits(contractBalance, 18);
      }
      
      console.log("Contract Mon balance:", formattedBalance);
      
      // Check if contract has enough Mon for the swap
      if (parseFloat(formattedBalance) < MonToReceive) {
        setFarmToMonError(`The contract doesn't have enough Mon tokens. Available: ${formattedBalance}`);
        toast.error(`Contract has insufficient Mon tokens (${formattedBalance} available).`);
        setIsFarmToMonLoading(false);
        return;
      }
      
      // First capture the initial farm coins for proper updates
      const initialFarmCoins = farmCoins;
      
      // Format amount with proper decimals for the blockchain
      let MonAmount;
      try {
        MonAmount = parseUnits(MonToReceive.toString(), 18);
      } catch (err) {
        // Fallback using our utility
        MonAmount = etherUtils.parseUnits(MonToReceive.toString(), 18);
      }
      
      // Get the Mon token address to be used in claimTestTokens
      const checksummedMonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      
      // TRY DIRECT TRANSFER APPROACH
      try {
        toast.loading("Processing claim via direct method...", { id: "swap-toast" });
        
        // Execute the claimTestTokens function on the contract - which gives Mon tokens
        // Use standard wallet approach (legacy wallet system removed)
        {
          // For standard wallets
          // Add direct method first
          console.log("Attempting direct claim with standard wallet");
          
          const gasLimit = 2000000;
          // FIXED: Use claimTestTokens with Mon address as parameter
          const tx = await swapContract.claimTestTokens(
            checksummedMonAddress, // Mon token address
            MonAmount, // amount to claim
            {
              gasLimit: gasLimit
            }
          );
          
          console.log("Standard transaction sent:", tx.hash);
          
          // Show transaction details
          setCurrentTx({
            hash: tx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          toast.loading("Transaction submitted, waiting for confirmation...", { id: "swap-toast" });
          
          // Wait for confirmation
          const receipt = await tx.wait();
          toast.dismiss("swap-toast");
          
          // Update transaction status
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            // Transaction successful
            setFarmCoins(prevCoins => prevCoins - farmToMonAmount);
            await fetchMonBalance(walletAddr);
            
            toast.success(
              // Enhanced Dopamine Toast! ✨
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-pulse">💎</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">MON ACQUIRED!</p>
                  <p className="text-sm text-white/90">Got {MonToReceive.toFixed(2)} MON!</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '🚀',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Reset the input field after successful swap
            setFarmToMonAmount(0);
            
            // Force refresh after a delay
            setTimeout(() => forceRefreshAllBalances(), 2000);
          } else {
            toast.error("Transaction failed. The contract may not have enough Mon tokens.");
          }
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        toast.dismiss("swap-toast");
        
        // Detailed logging for debugging
        console.log("Detailed claim error:", {
          code: error?.code,
          message: error?.message || "Unknown error",
          data: error?.data,
          reason: error?.reason,
          error: error?.error,
          receipt: error?.receipt,
          transaction: error?.transaction
        });
        
        if (error?.code === "ACTION_REJECTED") {
          toast.error("You rejected the transaction");
        } else {
          // Provide more detailed error information
          const errorMessage = error?.reason || error?.message || "Unknown error";
          const detailedMessage = error?.details || (error?.data ? error.data.message : "") || "";
          
          // Check receipt status for transaction reversion
          const hasReceipt = error?.receipt || error?.transaction?.receipt;
          const reverted = hasReceipt && hasReceipt.status === 0;
          
          // Check specifically for common contract errors
          let userFriendlyMessage = "Transaction failed";
          
          if (reverted) {
            userFriendlyMessage = "Contract execution reverted";
          }
          
          if (errorMessage.toLowerCase().includes("insufficient") || 
              detailedMessage.toLowerCase().includes("insufficient") ||
              errorMessage.toLowerCase().includes("reverted")) {
            userFriendlyMessage = "The contract doesn't have enough Mon tokens to fulfill your claim";
          }
          
          if (errorMessage.toLowerCase().includes("already claimed") || 
              detailedMessage.toLowerCase().includes("already claimed")) {
            userFriendlyMessage = "You have already claimed Mon tokens recently";
          }
          
          // Create error toast with proper React elements
          const errorToastContent = React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, userFriendlyMessage + ":"),
            React.createElement("p", { className: "text-xs", key: "message" }, errorMessage),
            detailedMessage ? React.createElement("p", { className: "text-xs text-red-300", key: "details" }, detailedMessage) : null,
            reverted ? React.createElement("p", { className: "text-xs text-yellow-300 mt-1", key: "suggestion" }, 
              "This usually means the contract cannot complete the request. Try a smaller amount or try again later.") : null
          ]);
          
          toast.error(errorToastContent, {duration: 8000});
          
          // If transaction reverted, log more details and suggest checking balance
          if (reverted) {
            console.log("Transaction reverted. Contract may not have enough tokens or there may be other restrictions.");
            
            // Check contract balance after a short delay
            setTimeout(function() {
              checkContractBalance()
                .then(() => console.log("Balance check completed after revert"))
                .catch(err => console.error("Error checking balance after revert:", err));
            }, 2000);
          }
        }
      }
    } catch (error: any) {
      console.error("Overall swap error:", error);
      toast.error(`An unexpected error occurred: ${error?.message || "Unknown error"}`);
      setIsFarmToMonLoading(false);
      toast.dismiss("swap-toast");
    } finally {
      setIsFarmToMonLoading(false);
      toast.dismiss("swap-toast");
    }
  };

  // Add function to fetch a specific token balance
  const fetchTokenBalance = async (address: string, tokenKey: string) => {
    try {
      if (!address) return "0";

      // Get a compatible ethers provider for the active wallet
      const { provider: ethersProvider, is  } = await getEthersProvider(); 
      const checksummedWalletAddress = getChecksumAddress(address);
      const tokenAddress = TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES];
      const checksummedTokenAddress = getChecksumAddress(tokenAddress);

      // Ensure we are on the correct network
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== MONAD_TESTNET_CHAIN_ID) {
          console.log(`fetchTokenBalance: Not on Monad Testnet for ${tokenKey}. Returning 0.`);
          return "0";
        }
      } else if (!ethersProvider) {
         // Added check if provider itself is null/undefined after getEthersProvider
         console.warn(`fetchTokenBalance: No provider found for ${tokenKey} after getEthersProvider.`);
         return "0"; 
      }
      
      // --- Handle native MON vs ERC-20 tokens ---
      console.log(`Fetching ${tokenKey} balance for ${is  ? ' ' : 'standard'} user: ${checksummedWalletAddress}`);
      let balanceWei: bigint;

      if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        // MON is native token - use getBalance()
        try {
          console.log(`${tokenKey} is native token - checking native balance`);
          const nativeBalance = await ethersProvider.getBalance(checksummedWalletAddress);
          balanceWei = BigInt(nativeBalance.toString());
          console.log(`Native ${tokenKey} balance: ${balanceWei.toString()}`);
        } catch (nativeError) {
          console.error(`Error fetching native ${tokenKey} balance:`, nativeError);
          return "0";
        }
      } else {
        // ERC-20 token - use balanceOf()
        try {
          console.log(`${tokenKey} is ERC-20 token - checking token balance`);
          const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, ethersProvider);
          const balanceResult = await tokenContract.balanceOf(checksummedWalletAddress);
          balanceWei = BigInt(balanceResult?.toString() ?? '0');
          console.log(`ERC-20 ${tokenKey} balance: ${balanceWei.toString()}`);
        } catch (ethersError) {
          console.error(`Error fetching ${tokenKey} ERC-20 balance:`, ethersError);
          return "0";
        }
      }
     
      // Format the balance consistently
      const formattedBalance = etherUtils.formatUnits(balanceWei, 18); // Assuming 18 decimals
      console.log(`Formatted ${tokenKey} balance: ${formattedBalance}`);
      return formattedBalance;

    } catch (error) {
      console.error(`Generic error in fetchTokenBalance for ${tokenKey}:`, error);
      return "0";
    }
  };
  
  // Add function to fetch all token balances
  const fetchAllTokenBalances = async () => {
    if (!isWalletConnected || !walletAddress) {
      console.log("fetchAllTokenBalances: Wallet not connected, skipping.");
      return;
    }
    
    console.log(`fetchAllTokenBalances: Fetching all balances for ${walletAddress}...`);
    const balances: {[key: string]: string} = {};
    let fetchError = false;

    // Corrected loop definition - using Object.keys to get the keys directly
    for (const tokenKey of Object.keys(TOKEN_ADDRESSES)) {
      // Skip MON since it's handled separately by fetchMonBalance
      if (tokenKey === "MON") {
        // MON balance is handled separately by fetchMonBalance
        // We can read actualMonBalance state, but don't need to set it in `balances` here
        console.log(`fetchAllTokenBalances: Skipping ${tokenKey} (handled separately)`);
        continue;
      }

      console.log(`fetchAllTokenBalances: Fetching balance for ${tokenKey}...`);
      // Use tokenKey consistently when calling fetchTokenBalance
      const balance = await fetchTokenBalance(walletAddress, tokenKey);
      if (balance === "0" && tokenKey !== "MON") { // Log if non-MON balance is 0
        console.warn(`fetchAllTokenBalances: Fetched balance is 0 for ${tokenKey}.`);
        // Optionally add a check here to see if it *should* be 0
      }
      // Use tokenKey as the key for the balances object
      balances[tokenKey] = balance;
    }
    
    console.log("fetchAllTokenBalances: Setting token balances state:", balances);
    setTokenBalances(balances);
  };

  // Fix validateTokenForSwap around line 2430 to match the new contract interface
  const validateTokenForSwap = async (tokenAddress: string) => {
    try {
      // Setup provider and contract
      const { provider: ethersProvider } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get token info from the contract
      // FIXED: Updated to match the MonerSwap contract's getTokenInfo return values
      const tokenInfo = await swapContract.getTokenInfo(tokenAddress);
      
      const isSupported = tokenInfo[0]; // isSupported is the first return value
      const balance = tokenInfo[2]; // actualBalance is the third return value
      
      console.log(`Token ${tokenAddress} validation:`, {
        isSupported,
        balance: formatUnits(balance, 18)
      });
      
      return {
        isSupported,
        exchangeRate: BigInt(1), // Hardcode to 1:1 exchange rate
        balance,
        hasLiquidity: balance > 0
      };
    } catch (error) {
      console.error("Error validating token:", error);
      return {
        isSupported: false,
        exchangeRate: BigInt(0),
        balance: BigInt(0),
        hasLiquidity: false
      };
    }
  };

  // Fix calculateExpectedOutput to use 1:1 exchange rate
  const calculateExpectedOutput = async () => {
    try {
      if (swapAmount <= 0 || !selectedToken) {
        setExpectedOutputAmount(0);
        return;
      }
      
      // For MonerSwap, the exchange rate is always 1:1
      // Simply use the same amount for expected output
      setExpectedOutputAmount(swapAmount);
      console.log(`Expected output for ${swapAmount} tokens: ${swapAmount} (1:1 exchange rate)`);
    } catch (error) {
      console.error("Error calculating expected output:", error);
      setExpectedOutputAmount(0);
    }
  };

  const swapMonForToken = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Set the swap direction and use directSwapWithTransfers
    setSwapDirection('Mon-to-token');
    
    // Call the direct transfer function
    await directSwapWithTransfers();
  };

  const swapTokenForMon = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsMultiSwapLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsMultiSwapLoading(false);
        return;
      }
      
      // Check if the user has enough of the selected token
      const tokenBalance = tokenBalances[selectedToken] || "0";
      if (parseFloat(tokenBalance) < swapAmount) {
        toast.error(`Not enough ${selectedToken} tokens. You have ${tokenBalance} ${selectedToken}`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      console.log(`Preparing ${selectedToken} to Mon swap transaction...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Setup contract instances
      const MonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Validate token before attempting swap
      const validation = await validateTokenForSwap(selectedTokenAddress);
      if (!validation.isSupported) {
        console.log(`${selectedToken} is not supported in the contract. Registering...`);
        toast.loading(`${selectedToken} is not registered. Attempting registration...`, { id: "register-toast" });
        
        try {
          // Register the token with 1:1 exchange rate
          const oneToOneRate = etherUtils.parseUnits("1", 18);
          const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
          const registerTx = await swapContract.addToken(selectedTokenAddress, { gasLimit: 500000 });
          
          console.log(`Registration transaction submitted: ${registerTx.hash}`);
          await registerTx.wait();
          
          toast.dismiss("register-toast");
          toast.success(`${selectedToken} successfully registered with 1:1 exchange rate`);
          
          // Re-validate after registration
          const revalidation = await validateTokenForSwap(selectedTokenAddress);
          if (!revalidation.isSupported) {
            toast.error(`Failed to register ${selectedToken}. Please try again later.`);
            setIsMultiSwapLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error registering token:", error);
          toast.dismiss("register-toast");
          toast.error(`Failed to register ${selectedToken}. You may not have permission to register tokens.`);
          setIsMultiSwapLoading(false);
          return;
        }
      }
      
      // Check if contract has Mon liquidity
      const MonValidation = await validateTokenForSwap(MonAddress);
      if (!MonValidation.hasLiquidity) {
        console.log(`Contract has no Mon liquidity.`);
        toast.error(`Contract has no Mon liquidity available for swapping. Please fund the contract first.`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      const selectedTokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const tokenAmount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      // FIXED: Calculate expected output using 1:1 exchange rate instead of contract function
      const expectedOutput = tokenAmount; // 1:1 exchange rate
      console.log(`Expected Mon output: ${formatUnits(expectedOutput, 18)} Mon`);
      
      // Step 1: Check allowance and approve if needed
      try {
        // ADDED: Check if contract has enough Mon liquidity BEFORE approval
        const contractMonBalanceStr = contractTokenBalances.Mon || "0"; // Use the fetched contract balance
        const contractMonBalance = parseFloat(contractMonBalanceStr);
        const estimatedMonOutputAmount = expectedOutputAmount > 0 ? expectedOutputAmount : swapAmount; // Use calculated or fallback

        if (contractMonBalance < estimatedMonOutputAmount) {
          toast.error(`Contract has insufficient Mon liquidity. Available: ${contractMonBalance.toFixed(2)}`);
          setIsMultiSwapLoading(false);
          return;
        }

        const currentAllowance = await selectedTokenContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < tokenAmount) {
          console.log(`Insufficient allowance. Approving ${selectedToken} spending...`);
          toast.loading(`Approving ${selectedToken} spending...`, { id: "approval-toast" });
          
          // Fix in swapTokenForMon function - replace mul with BigInt multiplication
          const approveTx = await selectedTokenContract.approve(farmSwapAddress, tokenAmount * BigInt(2));
          console.log("Approval transaction submitted:", approveTx.hash);
          
          await approveTx.wait();
          toast.dismiss("approval-toast");
          toast.success(`${selectedToken} spending approved`);
        } else {
          console.log("Sufficient allowance already granted");
        }
      } catch (error) {
        console.error("Error in approval process:", error);
        toast.error(`Failed to approve ${selectedToken} spending`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      // Step 2: Execute swap
      try {
        toast.loading("Processing swap...", { id: "swap-toast" });
        
        // IMPORTANT: Add debug logging before transaction
        console.log("Debug swap params:", {
          fromToken: selectedToken,
          toToken: "Mon",
          fromAddress: selectedTokenAddress,
          toAddress: MonAddress,
          amount: tokenAmount.toString(),
          amountFormatted: formatUnits(tokenAmount, 18)
        });
        
        // Use the swapTokenForMon function with higher gas limit
        const tx = await swapContract.swapTokenForMon(
          selectedTokenAddress,
          tokenAmount,
          { 
            gasLimit: 1500000,  // Increased gas limit
            gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
          }
        );
        
        console.log("Swap transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("swap-toast");
        
        console.log("Transaction receipt:", receipt);
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchMonBalance(walletAddress);
          
          // Display success message with formatted expected output if available
          const formattedOutput = expectedOutput 
            ? formatUnits(expectedOutput, 18)
            : swapAmount.toString();
            
          toast.success(
            <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg">
              <span className="text-2xl animate-bounce">✨</span>
              <div>
                <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                <p className="text-sm text-white/90">Swapped {swapAmount} Mon for {swapAmount} {selectedToken}</p>
              </div>
            </div>,
            {
              duration: 4000,
              icon: '✅',
              style: {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
              },
            }
          );
          
          // Reset swap amount
          setSwapAmount(0);
          
          // After successful swap, refresh all balances
          await handleManualRefresh();
        } else {
          throw new Error("Swap transaction failed with status 0");
        }
      } catch (error) {
        console.error("Error executing swap:", error);
        toast.dismiss("swap-toast");
        
        // Detect common errors
        const errorStr = String(error).toLowerCase();
        if (errorStr.includes("insufficient")) {
          if (errorStr.includes("gas")) {
            toast.error("Swap failed: Insufficient gas. Try increasing gas limit.");
          } else {
            toast.error("Swap failed: Insufficient balance or allowance.");
          }
        } else if (errorStr.includes("liquidity") || errorStr.includes("not supported")) {
          toast.error("Swap failed: Insufficient liquidity or token not supported.");
        } else if (errorStr.includes("revert")) {
          // Contract reverted
          toast.error("Swap failed: Contract reverted the transaction. The token may not be properly configured in the contract.");
          console.log("Try manually registering the token with updateAllExchangeRatesToOneToOne() function.");
        } else {
          toast.error("Swap transaction failed. See console for details.");
        }
        
        setCurrentTx(prev => ({
          ...prev,
          status: "failed"
        }));
      } finally {
        setIsMultiSwapLoading(false);
      }
    } catch (error) {
      console.error("Error in swap process:", error);
      toast.error("Swap process failed");
      setIsMultiSwapLoading(false);
    }
  };

  // Dev tools functions to fund tokens to contract
  // Note: State variables are declared at the top of the component

  // Function to check all token balances in the contract
  const checkAllContractTokenBalances = async () => {
    try {
      console.log("Checking all contract token balances...");
      const { provider: ethersProvider } = await getEthersProvider();
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const MonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, ethersProvider);
      
      // Get all tokens including Mon
      const allTokens = [
        "Mon",
        "ABBY",
        "CHESTER",
        "DOJO3",
        "FEATHERS",
        "MOP",
        "NUTZ",
        "PAINGU",
        "PENGUIN",
        "PUDGY",
        "RETSBA",
        "WOJACT",
        "YUP"
      ];
      
      const newBalances: Record<string, string> = {};
      
      // First check Mon balance
      try {
        const MonContract = new Contract(MonAddress, TOKEN_ABI, ethersProvider);
        const contractMonBalance = await MonContract.balanceOf(farmSwapAddress);
        const formattedMonBalance = formatUnits(contractMonBalance, 18);
        newBalances["Mon"] = formattedMonBalance;
        console.log(`Contract Mon balance: ${formattedMonBalance}`);
      } catch (error) {
        console.error("Error checking contract Mon balance:", error);
        newBalances["Mon"] = "0";
      }
      
      // Then check all other tokens
      for (const tokenKey of allTokens.filter(t => t !== "Mon")) {
        try {
          if (TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]) {
            const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
            const tokenContract = new Contract(tokenAddress, TOKEN_ABI, ethersProvider);
            const tokenBalance = await tokenContract.balanceOf(farmSwapAddress);
            const formattedBalance = formatUnits(tokenBalance, 18);
            newBalances[tokenKey] = formattedBalance;
            console.log(`Contract ${tokenKey} balance: ${formattedBalance}`);
          } else {
            console.warn(`Token address not found for ${tokenKey}`);
            newBalances[tokenKey] = "0";
          }
        } catch (error) {
          console.error(`Error checking contract balance for ${tokenKey}:`, error);
          newBalances[tokenKey] = "0";
        }
      }
      
      // Update the state with all balances
      setContractTokenBalances(newBalances);
      
      console.log("Contract token balances updated:", newBalances);
      return newBalances;
    } catch (error) {
      console.error("Error checking contract token balances:", error);
      return {};
    }
  };
  
  // Check contract balances when dev tools are opened
  useEffect(() => {
    if (showDevTools && isWalletConnected) {
      checkAllContractTokenBalances();
    }
  }, [showDevTools, isWalletConnected]);
  
  // Function to fund the contract with Mon
  const fundContractWithMon = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsFunding(true);
      
      if (fundAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsFunding(false);
        return;
      }
      
      // Check balance
      if (parseFloat(actualMonBalance) < fundAmount) {
        toast.error(`Not enough MON tokens. You have ${actualMonBalance} MON`);
        setIsFunding(false);
        return;
      }
      
      console.log(`Preparing to fund contract with ${fundAmount} Mon...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      await switchToMonadTestnet();
      
      // Setup contract instances
      const MonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      const MonContract = new Contract(MonAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const MonAmount = etherUtils.parseUnits(fundAmount.toString(), 18);
      
      // Step 1: Check allowance and approve if needed
      try {
        const currentAllowance = await MonContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < MonAmount) {
          console.log("Insufficient allowance, requesting approval...");
          toast.loading("Approving tokens...", { id: "approval-toast" });
          
          // Use a large approval amount to avoid frequent approvals
          const largeApprovalAmount = parseUnits("100000", 18);
          const approvalTx = await MonContract.approve(farmSwapAddress, largeApprovalAmount);
          
          console.log("Approval transaction submitted:", approvalTx.hash);
          setCurrentTx({
            hash: approvalTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          // Wait for confirmation
          const receipt = await approvalTx.wait();
          toast.dismiss("approval-toast");
          
          if (receipt.status !== 1) {
            throw new Error("Token approval failed");
          }
          
          toast.success("MON tokens approved for funding");
        }
      } catch (error: any) {
        toast.dismiss("approval-toast");
        console.error("Error approving tokens:", error);
        toast.error("Failed to approve tokens: " + (error.message || "Unknown error"));
        setIsFunding(false);
        return;
      }
      
      // Step 2: Execute funding
      try {
        toast.loading("Funding contract...", { id: "fund-toast" });
        
        // Use the fundMon function
        const tx = await swapContract.fundMon(
          MonAmount,
          { gasLimit: 1000000 }
        );
        
        console.log("Funding transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("fund-toast");
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchMonBalance(walletAddress);
          await checkContractBalance();
          
          toast.success(
            `Successfully funded contract with ${fundAmount} MON tokens!`,
            { duration: 5000 }
          );
        } else {
          throw new Error("Funding transaction failed");
        }
      } catch (error: any) {
        toast.dismiss("fund-toast");
        console.error("Error funding contract:", error);
        toast.error("Failed to fund contract: " + (error.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error in funding process:", error);
      toast.error("Funding process failed: " + (error.message || "Unknown error"));
    } finally {
      setIsFunding(false);
    }
  };
  
  // Function to fund the contract with any token
  const fundContractWithToken = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (selectedFundToken === "Mon") {
      return fundContractWithMon();
    }
    
    try {
      setIsFunding(true);
      
      if (fundAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsFunding(false);
        return;
      }
      
      // Check if the user has enough of the selected token
      const tokenBalance = tokenBalances[selectedFundToken] || "0";
      if (parseFloat(tokenBalance) < fundAmount) {
        toast.error(`Not enough ${selectedFundToken} tokens. You have ${tokenBalance} ${selectedFundToken}`);
        setIsFunding(false);
        return;
      }
      
      console.log(`Preparing to fund contract with ${fundAmount} ${selectedFundToken}...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      await switchToMonadTestnet();
      
      // Setup contract instances
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedFundToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const tokenAmount = etherUtils.parseUnits(fundAmount.toString(), 18);
      
      // Step 1: Check allowance and approve if needed
      try {
        const currentAllowance = await tokenContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < tokenAmount) {
          console.log("Insufficient allowance, requesting approval...");
          toast.loading(`Approving ${selectedFundToken} tokens...`, { id: "approval-toast" });
          
          // Use a large approval amount to avoid frequent approvals
          const largeApprovalAmount = parseUnits("100000", 18);
          const approvalTx = await tokenContract.approve(farmSwapAddress, largeApprovalAmount);
          
          console.log("Approval transaction submitted:", approvalTx.hash);
          setCurrentTx({
            hash: approvalTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          // Wait for confirmation
          const receipt = await approvalTx.wait();
          toast.dismiss("approval-toast");
          
          if (receipt.status !== 1) {
            throw new Error("Token approval failed");
          }
          
          toast.success(`${selectedFundToken} tokens approved for funding`);
        }
      } catch (error: any) {
        toast.dismiss("approval-toast");
        console.error("Error approving tokens:", error);
        toast.error("Failed to approve tokens: " + (error.message || "Unknown error"));
        setIsFunding(false);
        return;
      }
      
      // Step 2: Execute funding
      try {
        toast.loading("Funding contract...", { id: "fund-toast" });
        
        // Use the fundToken function
        const tx = await swapContract.fundToken(
          selectedTokenAddress,
          tokenAmount,
          { gasLimit: 1000000 }
        );
        
        console.log("Funding transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("fund-toast");
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchAllTokenBalances();
          
          toast.success(
            `Successfully funded contract with ${fundAmount} ${selectedFundToken} tokens!`,
            { duration: 5000 }
          );
        } else {
          throw new Error("Funding transaction failed");
        }
      } catch (error: any) {
        toast.dismiss("fund-toast");
        console.error("Error funding contract:", error);
        toast.error("Failed to fund contract: " + (error.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error in funding process:", error);
      toast.error("Funding process failed: " + (error.message || "Unknown error"));
    } finally {
      setIsFunding(false);
    }
  };

  // Function to add a new token to the contract
  const addTokenToContract = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!newTokenAddress || newTokenAddress.length !== 42 || !newTokenAddress.startsWith('0x')) {
      toast.error("Please enter a valid token address");
      return;
    }
    
    if (newTokenExchangeRate <= 0) {
      toast.error("Exchange rate must be greater than 0");
      return;
    }
    
    try {
      setIsAddingToken(true);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      if (!is ) {
        await switchToMonadTestnet();
      }
      
      // Setup contract instance
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format the exchange rate - multiply by 1e18 for the contract
      const exchangeRateWei = etherUtils.parseUnits(newTokenExchangeRate.toString(), 18);
      
      // Add the token to the contract
      toast.loading("Adding token to contract...", { id: "add-token-toast" });
      
      // FIXED: MonerSwap.sol addToken only accepts tokenAddress (no exchange rate parameter)
      const tx = await swapContract.addToken(
        getChecksumAddress(newTokenAddress),
        { gasLimit: 1000000 }
      );
      
      console.log("Add token transaction submitted:", tx.hash);
      setCurrentTx({
        hash: tx.hash,
        status: "pending"
      });
      setShowTxDetails(true);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      toast.dismiss("add-token-toast");
      
      setCurrentTx(prev => ({
        ...prev,
        status: receipt && receipt.status === 1 ? "success" : "failed"
      }));
      
      if (receipt && receipt.status === 1) {
        toast.success("Token added successfully!");
        
        // Clear the input fields
        setNewTokenAddress("");
        setNewTokenExchangeRate(1);
        
        // Refresh contract token balances
        await checkAllContractTokenBalances();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      toast.dismiss("add-token-toast");
      console.error("Error adding token:", error);
      toast.error("Failed to add token: " + (error.message || "Unknown error"));
    } finally {
      setIsAddingToken(false);
    }
  };

  // Add useEffect to initialize token balances for all tokens
  useEffect(() => {
    // Initialize all tokens with zero balances 
    const initialTokenBalances: Record<string, string> = {};
    const initialContractBalances: Record<string, string> = {};
    
    // Get all tokens from TOKEN_ADDRESSES
    Object.keys(TOKEN_ADDRESSES).forEach(tokenKey => {
      initialTokenBalances[tokenKey] = "0";
      initialContractBalances[tokenKey] = "0";
    });
    
    setTokenBalances(initialTokenBalances);
    setContractTokenBalances(initialContractBalances);
    
    // Refresh balances if connected
    if (isWalletConnected && walletAddress) {
      fetchAllTokenBalances();
      checkAllContractTokenBalances();
    }
  }, [isWalletConnected, walletAddress]);
  
  // Add existing useEffect to recalculate expected output
  useEffect(() => {
    if (isWalletConnected && walletAddress && swapAmount > 0) {
      calculateExpectedOutput();
    }
  }, [isWalletConnected, walletAddress, swapAmount, selectedToken, swapDirection, contractTokenBalances]);

  // Add function to update all token exchange rates to 1:1
  const updateAllExchangeRatesToOneToOne = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Updating exchange rates...", { id: "update-rates-toast" });
      
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      if (!is ) {
        await switchToMonadTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens except Mon
      const tokensToUpdate = Object.keys(TOKEN_ADDRESSES).filter(key => key !== "Mon");
      
      // Set exchange rate to 1:1 (1 ether)
      const oneToOneRate = etherUtils.parseUnits("1", 18);
      
      console.log(`Setting exchange rate to 1:1 (${formatUnits(oneToOneRate, 18)}) for all tokens...`);
      
      // Update each token's exchange rate
      for (const tokenKey of tokensToUpdate) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Updating exchange rate for ${tokenKey} (${tokenAddress})...`);
          
          // Update exchange rate to 1:1
          const tx = await swapContract.updateExchangeRate(tokenAddress, oneToOneRate, { gasLimit: 500000 });
          
          console.log(`Transaction submitted for ${tokenKey}: ${tx.hash}`);
          
          // Wait for confirmation
          await tx.wait();
          console.log(`Exchange rate updated for ${tokenKey}`);
        } catch (error) {
          console.error(`Error updating exchange rate for ${tokenKey}:`, error);
        }
      }
      
      toast.dismiss("update-rates-toast");
      toast.success("Exchange rates updated to 1:1 for all tokens");
      
      // Refresh exchange rates
      await handleManualRefresh();
    } catch (error) {
      console.error("Error updating exchange rates:", error);
      toast.dismiss("update-rates-toast");
      toast.error("Failed to update exchange rates");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add function to fund all tokens in the contract
  const fundAllTokensInContract = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Funding contract with tokens...", { id: "fund-toast" });
      
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      if (!is ) {
        await switchToMonadTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens including Mon
      const tokensToFund = Object.keys(TOKEN_ADDRESSES);
      
      // Amount to fund per token (1000 tokens)
      const fundAmount = etherUtils.parseUnits("1000", 18);
      
      console.log(`Funding contract with ${formatUnits(fundAmount, 18)} of each token...`);
      
      // Fund each token
      for (const tokenKey of tokensToFund) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          const tokenContract = new Contract(tokenAddress, TOKEN_ABI, signer);
          
          console.log(`Processing ${tokenKey} (${tokenAddress})...`);
          
          // Check user's balance
          const userBalance = await tokenContract.balanceOf(walletAddress);
          if (userBalance.lt(fundAmount)) {
            console.log(`Insufficient ${tokenKey} balance: ${formatUnits(userBalance, 18)}`);
            continue;
          }
          
          // First approve token spending
          console.log(`Approving ${tokenKey} for contract funding...`);
          const approveTx = await tokenContract.approve(farmSwapAddress, fundAmount);
          console.log(`Approval transaction submitted: ${approveTx.hash}`);
          await approveTx.wait();
          
          // Then fund the contract
          console.log(`Funding contract with ${tokenKey}...`);
          
          // Use the appropriate funding method based on token
          let fundTx;
          if (tokenKey === "Mon") {
            fundTx = await swapContract.fundMon(fundAmount, { gasLimit: 500000 });
          } else {
            fundTx = await swapContract.fundToken(tokenAddress, fundAmount, { gasLimit: 500000 });
          }
          
          console.log(`Funding transaction submitted: ${fundTx.hash}`);
          await fundTx.wait();
          console.log(`Contract funded with ${tokenKey} successfully`);
        } catch (error) {
          console.error(`Error funding contract with ${tokenKey}:`, error);
        }
      }
      
      toast.dismiss("fund-toast");
      toast.success("Contract funding complete");
      
      // Refresh contract balances
      await checkAllContractTokenBalances();
    } catch (error) {
      console.error("Error funding contract:", error);
      toast.dismiss("fund-toast");
      toast.error("Failed to fund contract");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add a function to register all tokens and set their exchange rates properly
  const registerAndConfigureAllTokens = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Registering and configuring all tokens...", { id: "configure-toast" });
      
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Monad Testnet if needed
      if (!is ) {
        await switchToMonadTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens except Mon
      const tokensToRegister = Object.keys(TOKEN_ADDRESSES).filter(key => key !== "Mon");
      
      // Set exchange rate to 1:1 (1 ether)
      const oneToOneRate = etherUtils.parseUnits("1", 18);
      
      console.log(`Registering and configuring ${tokensToRegister.length} tokens...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each token
      for (const tokenKey of tokensToRegister) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Processing ${tokenKey} (${tokenAddress})...`);
          
          // First check if token is already registered
          const [isRegistered] = await swapContract.supportedTokens(tokenAddress).catch(() => [false]);
          
          // If not registered, register it
          if (!isRegistered) {
            console.log(`Registering ${tokenKey}...`);
            try {
              const registerTx = await swapContract.addToken(tokenAddress, oneToOneRate, { gasLimit: 500000 });
              console.log(`Registration transaction submitted: ${registerTx.hash}`);
              await registerTx.wait();
              console.log(`${tokenKey} registered successfully`);
            } catch (error) {
              console.error(`Error registering ${tokenKey}:`, error);
              errorCount++;
              continue; // Skip to next token on error
            }
          } else {
            console.log(`${tokenKey} is already registered`);
          }
          
          // Now update the exchange rate to 1:1
          console.log(`Updating exchange rate for ${tokenKey}...`);
          try {
            const updateTx = await swapContract.updateExchangeRate(tokenAddress, oneToOneRate, { gasLimit: 500000 });
            console.log(`Update exchange rate transaction submitted: ${updateTx.hash}`);
            await updateTx.wait();
            console.log(`${tokenKey} exchange rate updated successfully`);
            successCount++;
          } catch (error) {
            console.error(`Error updating exchange rate for ${tokenKey}:`, error);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing ${tokenKey}:`, error);
          errorCount++;
        }
      }
      
      toast.dismiss("configure-toast");
      
      if (errorCount === 0) {
        toast.success(`All ${successCount} tokens registered and configured successfully!`);
      } else {
        toast.success(`${successCount} tokens configured, ${errorCount} failed. Check console for details.`);
      }
      
      // Refresh balances and token information
      await handleManualRefresh();
      await checkAllContractTokenBalances();
    } catch (error) {
      console.error("Error registering and configuring tokens:", error);
      toast.dismiss("configure-toast");
      toast.error("Failed to register and configure tokens");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Update the AdminSettings component to include the new function
  const AdminSettings = () => (
    <div className="Mon-settings-section border border-[#333] rounded p-4 mb-4">
      <h2 className="Mon-settings-title font-bold mb-2">Admin Settings</h2>
      
      <div className="space-y-2">
        <div className="flex flex-col space-y-2">
          <button
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm"
            onClick={registerAndConfigureAllTokens}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Processing..." : "Register & Configure All Tokens"}
          </button>
          <button
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded text-sm"
            onClick={updateAllExchangeRatesToOneToOne}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Updating..." : "Update All Exchange Rates to 1:1"}
          </button>
          <button
            className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded text-sm"
            onClick={fundAllTokensInContract}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Processing..." : "Fund Contract with Tokens"}
          </button>
          <button
            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Token Data"}
          </button>
          <button
            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
            onClick={checkAllContractTokenBalances}
            disabled={isLoadingContractBalances}
          >
            {isLoadingContractBalances ? "Checking..." : "Refresh Contract Token Balances"}
          </button>
        </div>
      </div>
    </div>
  );

  // Add a direct token swap function that bypasses contract registration issues
  const directSwapWithTransfers = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsMultiSwapLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsMultiSwapLoading(false);
        return;
      }
      
      const { provider: ethersProvider, is  } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Setup contract instances
      const MonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Create contract instances
      const MonContract = new Contract(MonAddress, TOKEN_ABI, signer);
      const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const amount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      // Check balances based on swap direction
      if (swapDirection === 'Mon-to-token') {
        // Check user Mon balance
        if (parseFloat(actualMonBalance) < swapAmount) {
          toast.error(`Not enough MON tokens. You have ${actualMonBalance} MON`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Check contract token balance
        const contractOutputBalanceStr = contractTokenBalances[selectedToken] || "0";
        const contractOutputBalance = parseFloat(contractOutputBalanceStr);
        if (contractOutputBalance < swapAmount) {
          toast.error(`Contract has insufficient ${selectedToken} liquidity. Available: ${contractOutputBalance}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Step 1: Approve Mon spending
        toast.loading("Approving Mon transfer...", { id: "direct-swap-toast" });
        
        try {
          const currentAllowance = await MonContract.allowance(walletAddress, farmSwapAddress);
          if (currentAllowance < amount) {
            const approveTx = await MonContract.approve(farmSwapAddress, amount * BigInt(2));
            console.log("Approval transaction submitted:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval confirmed");
          } else {
            console.log("Sufficient allowance already exists");
          }
          
          // Step 2: Execute the swap directly through the contract
          toast.loading("Processing swap...", { id: "direct-swap-toast" });
          
          console.log("Executing swapMonForToken with params:", {
            tokenAddress: selectedTokenAddress,
            amount: amount.toString()
          });
          
          // FIXED: Use the correct contract function call matching the MonerSwap.sol contract
          const swapTx = await swapContract.swapMonForToken(
            selectedTokenAddress, // toTokenAddress
            amount, // amount
            { 
              gasLimit: 2000000,
              gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
            }
          );
          
          console.log("Swap transaction submitted:", swapTx.hash);
          setCurrentTx({
            hash: swapTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await swapTx.wait();
          toast.dismiss("direct-swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-bounce">✨</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                  <p className="text-sm text-white/90">Swapped {swapAmount} Mon for {swapAmount} {selectedToken}</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '✅',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Refresh balances
            await fetchMonBalance(walletAddress);
            await handleManualRefresh();
          } else {
            throw new Error("Swap transaction failed");
          }
        } catch (error) {
          console.error("Direct swap error:", error);
          toast.dismiss("direct-swap-toast");
          
          const errorStr = String(error).toLowerCase();
          if (errorStr.includes("insufficient")) {
            if (errorStr.includes("liquidity")) {
              toast.error(`Swap failed: The contract doesn't have enough ${selectedToken} tokens.`);
            } else if (errorStr.includes("allowance")) {
              toast.error("Swap failed: Not enough allowance. Try approving more tokens.");
            } else if (errorStr.includes("balance")) {
              toast.error("Swap failed: Not enough MON tokens in your wallet.");
            } else {
              toast.error("Swap failed: Insufficient funds or gas.");
            }
          } else if (errorStr.includes("user denied")) {
            toast.error("Transaction was rejected in your wallet.");
          } else if (errorStr.includes("not supported")) {
            toast.error(`Swap failed: ${selectedToken} is not supported in the contract.`);
            toast.error(
              <div className="space-y-1">
                <p>The token needs to be registered in the contract first.</p>
                <p className="text-xs">Try using the "Add Token" function from the admin settings.</p>
              </div>
            );
          } else {
            toast.error("Swap failed. Please see console for details: " + String(error));
          }
          
          setCurrentTx(prev => ({
            ...prev,
            status: "failed"
          }));
        }
      } else {
        // TOKEN TO Mon SWAP
        // Check user token balance
        const tokenBalance = tokenBalances[selectedToken] || "0";
        if (parseFloat(tokenBalance) < swapAmount) {
          toast.error(`Not enough ${selectedToken} tokens. You have ${tokenBalance} ${selectedToken}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Check contract Mon balance
        const contractMonBalanceStr = contractTokenBalances.Mon || "0";
        const contractMonBalance = parseFloat(contractMonBalanceStr);
        if (contractMonBalance < swapAmount) {
          toast.error(`Contract has insufficient Mon liquidity. Available: ${contractMonBalance}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        try {
          // Step 1: Approve token spending
          toast.loading(`Approving ${selectedToken} transfer...`, { id: "direct-swap-toast" });
          
          const currentAllowance = await tokenContract.allowance(walletAddress, farmSwapAddress);
          if (currentAllowance < amount) {
            const approveTx = await tokenContract.approve(farmSwapAddress, amount * BigInt(2));
            console.log("Approval transaction submitted:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval confirmed");
          } else {
            console.log("Sufficient allowance already exists");
          }
          
          // Step 2: Execute the swap directly through the contract
          toast.loading("Processing swap...", { id: "direct-swap-toast" });
          
          console.log("Executing swapTokenForMon with params:", {
            tokenAddress: selectedTokenAddress,
            amount: amount.toString()
          });
          
          // FIXED: Make sure we're correctly calling the contract function
          const swapTx = await swapContract.swapTokenForMon(
            selectedTokenAddress, // fromTokenAddress
            amount, // amount
            { 
              gasLimit: 2000000,
              gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
            }
          );
          
          console.log("Swap transaction submitted:", swapTx.hash);
          setCurrentTx({
            hash: swapTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await swapTx.wait();
          toast.dismiss("direct-swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-spin">🚀</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                  <p className="text-sm text-white/90">Swapped {swapAmount} {selectedToken} for {swapAmount} Mon</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '✅',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Refresh balances
            await fetchMonBalance(walletAddress);
            await handleManualRefresh();
          } else {
            throw new Error("Swap transaction failed");
          }
        } catch (error) {
          console.error("Direct swap error:", error);
          toast.dismiss("direct-swap-toast");
          
          const errorStr = String(error).toLowerCase();
          if (errorStr.includes("insufficient")) {
            if (errorStr.includes("liquidity")) {
              toast.error("Swap failed: The contract doesn't have enough Mon tokens.");
            } else if (errorStr.includes("allowance")) {
              toast.error(`Swap failed: Not enough allowance. Try approving more ${selectedToken} tokens.`);
            } else if (errorStr.includes("balance")) {
              toast.error(`Swap failed: Not enough ${selectedToken} tokens in your wallet.`);
            } else {
              toast.error("Swap failed: Insufficient funds or gas.");
            }
          } else if (errorStr.includes("user denied")) {
            toast.error("Transaction was rejected in your wallet.");
          } else if (errorStr.includes("not supported")) {
            toast.error(`Swap failed: ${selectedToken} is not supported in the contract.`);
            toast.error(
              <div className="space-y-1">
                <p>The token needs to be registered in the contract first.</p>
                <p className="text-xs">Try using the "Add Token" function from the admin settings.</p>
              </div>
            );
          } else {
            toast.error("Swap failed. Please see console for details: " + String(error));
          }
          
          setCurrentTx(prev => ({
            ...prev,
            status: "failed"
          }));
        }
      }
    } catch (error) {
      console.error("Direct swap process error:", error);
      toast.dismiss("direct-swap-toast");
      toast.error("Swap process failed. Please try again later.");
    } finally {
      setIsMultiSwapLoading(false);
    }
  };
  
  // Update the multi-token swap UI to add the direct swap option
  const renderSwapButtons = () => (
    <div className="flex flex-col space-y-2">
      <button
        onClick={swapDirection === 'Mon-to-token' ? swapMonForToken : swapTokenForMon}
        disabled={isMultiSwapLoading || swapAmount <= 0 || !isWalletConnected}
        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md font-medium transition"
      >
        {isMultiSwapLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            <span>Swapping...</span>
          </div>
        ) : (
          <span>
            Swap {swapAmount > 0 ? swapAmount : '0'} {swapDirection === 'Mon-to-token' ? 'Mon' : selectedToken} for {expectedOutputAmount ? expectedOutputAmount.toFixed(4) : '0'} {swapDirection === 'Mon-to-token' ? selectedToken : 'Mon'}
          </span>
        )}
      </button>
      
      <button
        onClick={directSwapWithTransfers}
        disabled={isMultiSwapLoading || swapAmount <= 0 || !isWalletConnected}
        className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-md font-medium transition text-sm"
      >
        {isMultiSwapLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <span>
            Try Direct 1:1 Swap (Emergency Mode)
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="Mon-swap-container Mon-text">
      {/* Wallet Options Dialog */}
      <WalletOptionsDialog />
      
      {/* Network status indicator with improved wallet UI */}
      <div className="mb-4 py-2 px-3 bg-black/30 rounded-lg border border-[#333] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isWalletConnected ? (
            <div className="flex flex-col">
              <span className="text-sm">Connected: {activeWallet}</span>
              <span className="text-xs text-white/60">
                {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress?.length - 4)}
              </span>
            </div>
          ) : (
            <span className="text-sm">Wallet Not Connected</span>
          )}
        </div>
        <div className="flex gap-2">
          {isWalletConnected ? (
            <>
              <Button 
                onClick={forceRefreshAllBalances}
                size="sm"
                variant="outline"
                className="bg-transparent border-[#333] text-xs flex gap-1 items-center"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isRefreshing ? "Updating..." : "Refresh"}
              </Button>
              <Button 
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
                className="bg-transparent border-[#333] text-xs hover:bg-red-900/20 hover:text-red-400"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setShowWalletOptions(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      {/* Add the Monad Testnet button */}
      {isWalletConnected && (
        <div className="mt-2 mb-4">
          <Button
            onClick={() => switchToMonadTestnet()}
            size="sm"
            className="w-full bg-purple-700 hover:bg-purple-800 text-xs py-2"
          >
            Switch to Monad Testnet
          </Button>
        </div>
      )}
      
      {/* Add a prominent banner */}
      <div className="mb-4 bg-gradient-to-r from-purple-900 to-blue-900 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">Need $Mon in your wallet?</span>
          <span className="text-xs text-gray-300">Add the token to your Web3 wallet</span>
        </div>
        <Button 
          onClick={addTokenToWallet}
          className="mt-2 sm:mt-0 bg-white text-purple-900 hover:bg-white/90 text-xs whitespace-nowrap"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add $Mon to Wallet
        </Button>
      </div>
      
      {/* Add Token Visibility Section */}
      <div className="mb-4 bg-[#111] border border-[#333] p-3 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <div>
            <h3 className="text-sm font-bold">Token Visibility in Wallet</h3>
            <p className="text-xs text-white/60 mt-1">Make tokens visible in your wallet (e.g., MetaMask)</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button
              onClick={async () => {
                toast.loading("Adding tokens to wallet...");
                // Add each token one by one with slight delay
                for (const key of Object.keys(TOKEN_ADDRESSES)) {
                  if (key === "Mon") {
                    await addTokenToWallet();
                  } else {
                    await addSelectedTokenToWallet(key);
                  }
                  // Small delay to avoid overwhelming the wallet
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                toast.dismiss();
                toast.success("All tokens have been added to your wallet!");
              }}
              className="text-xs bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add All Tokens to Wallet
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {Object.keys(TOKEN_ADDRESSES).map(key => (
            <Button
              key={key}
              onClick={() => key === "Mon" ? addTokenToWallet() : addSelectedTokenToWallet(key)}
              variant="outline"
              className="h-auto py-1.5 border-[#333] hover:bg-[#222] flex items-center justify-center"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add {TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Add contract balance information */}
      <div className="mb-4 border border-[#333] p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/70">FarmSwap Contract MON Balance:</span>
          <span className="text-sm font-bold text-white">
            {Number(contractMonBalance).toLocaleString(undefined, {maximumFractionDigits: 2})} MON
          </span>
        </div>
        {Number(contractMonBalance) === 0 && (
          <p className="text-xs text-red-400 mt-1">
            ⚠️ Contract has no MON tokens. Please contact admin to fund the contract.
          </p>
        )}
      </div>
      
      <div className="wallet-info mb-4">
        <div className="text-sm text-white/60 flex justify-between">
          <span>MON Balance:</span>
          <span>{isWalletConnected ? actualMonBalance : MonBalance}</span>
        </div>
        <div className="text-sm text-white/60 flex justify-between">
          <span>Farm Coins:</span>
          <span>{farmCoins}</span>
        </div>
        
        {/* Token info and explorer links */}
        {isWalletConnected && (
          <div className="mt-3 text-xs grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#333] flex items-center justify-center gap-1 hover:bg-blue-900/20"
              onClick={async () => {
                if (!isWalletConnected || !walletAddress) {
                  toast.error("Please connect your wallet first");
                  return;
                }

                toast.loading("Checking all token balances...");
                console.log("=== ENHANCED TOKEN BALANCE DEBUG ===");
                console.log("Wallet Address:", walletAddress);
                console.log("Current Chain ID:", (window.ethereum as any)?.chainId);

                try {
                  const { provider: ethersProvider } = await getEthersProvider();

                  // Check network info
                  const network = await ethersProvider.getNetwork();
                  console.log("Network Info:", network);

                  // First check native MON balance (this should be your 10 MON!)
                  console.log("=== CHECKING NATIVE MON BALANCE ===");
                  try {
                    const nativeBalance = await ethersProvider.getBalance(walletAddress);
                    const formattedNative = etherUtils.formatUnits(nativeBalance, 18);
                    console.log(`🎯 Native MON Balance: ${formattedNative}`);

                    if (parseFloat(formattedNative) > 0) {
                      toast.success(`🎉 Found ${formattedNative} native MON tokens!`, { duration: 10000 });
                      console.log("🎉 SUCCESS: This is your MON balance! MON is the native token.");
                    } else {
                      toast.error(`Native MON Balance: ${formattedNative}`, { duration: 5000 });
                    }
                  } catch (error) {
                    console.log("Error checking native balance:", error);
                  }

                  // Check if MON might be an ERC-20 token with a different address
                  console.log("=== TRYING POSSIBLE MON TOKEN ADDRESSES ===");
                  const possibleMonAddresses = [
                    "0xc00000000000000000000000000000000000000000", // Your suggested address
                    "0x1111111111111111111111111111111111111111", // Common pattern
                    "0x2222222222222222222222222222222222222222", // Common pattern
                    "0x3333333333333333333333333333333333333333", // Common pattern
                    "0x4444444444444444444444444444444444444444", // Common pattern
                    "0x5555555555555555555555555555555555555555", // Common pattern
                    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Common pattern
                    "0xffffffffffffffffffffffffffffffffffffffff", // Max address
                    "0x1000000000000000000000000000000000000001", // Monad-like pattern
                    "0x0000000000000000000000000000000000000001", // Minimal non-zero
                    "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // Test pattern
                    "0xcafebabecafebabecafebabecafebabecafebabe", // Test pattern
                  ];

                  for (const address of possibleMonAddresses) {
                    try {
                      console.log(`Trying MON address: ${address}`);
                      const tokenContract = new Contract(address, TOKEN_ABI, ethersProvider);
                      const balance = await tokenContract.balanceOf(walletAddress);
                      const formattedBalance = etherUtils.formatUnits(balance, 18);

                      if (parseFloat(formattedBalance) > 0) {
                        console.log(`🎉 FOUND MON TOKENS! Address: ${address}, Balance: ${formattedBalance}`);
                        toast.success(`🎉 Found ${formattedBalance} MON at ${address}!`, { duration: 10000 });

                        // Try to get token info
                        try {
                          const name = await tokenContract.name();
                          const symbol = await tokenContract.symbol();
                          console.log(`Token Info: ${name} (${symbol})`);
                          toast.success(`Token: ${name} (${symbol})`, { duration: 5000 });
                        } catch (e) {
                          console.log("Could not get token info");
                        }
                      } else {
                        console.log(`No balance at ${address}`);
                      }
                    } catch (error) {
                      console.log(`Error checking ${address}:`, (error as any)?.message || error);
                    }
                  }

                  // Then check all configured ERC-20 tokens
                  console.log("=== CHECKING CONFIGURED TOKENS ===");
                  for (const [tokenKey, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
                    if (tokenAddress === "0x0000000000000000000000000000000000000000" ||
                        tokenAddress === "0x00000000000000000000000000000000000000000") {
                      console.log(`Skipping ${tokenKey} (zero address)`);
                      continue;
                    }

                    try {
                      const tokenContract = new Contract(tokenAddress, TOKEN_ABI, ethersProvider);
                      const balance = await tokenContract.balanceOf(walletAddress);
                      const formattedBalance = etherUtils.formatUnits(balance, 18);
                      console.log(`${tokenKey}: ${formattedBalance} tokens`);

                      if (parseFloat(formattedBalance) > 0) {
                        toast.success(`Found ${formattedBalance} ${tokenKey} tokens!`, { duration: 3000 });
                      }
                    } catch (error) {
                      console.log(`Error checking ${tokenKey}:`, (error as any)?.message || error);
                    }
                  }

                  toast.dismiss();
                  toast.success("Balance check complete! Check console for details.");
                } catch (error) {
                  toast.dismiss();
                  toast.error("Error checking balances");
                  console.error("Balance check error:", error);
                }
              }}
            >
              <RefreshCw className="h-3 w-3" />
              Find MON Tokens
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#333] flex items-center justify-center gap-1 hover:bg-blue-900/20"
              onClick={async () => {
                const newAddress = prompt("Enter the correct MON token address:", TOKEN_ADDRESSES.MON);
                if (newAddress && newAddress.length === 42 && newAddress.startsWith("0x")) {
                  // Temporarily update the MON address for testing
                  (TOKEN_ADDRESSES as any).MON = newAddress;
                  toast.success(`MON address updated to: ${newAddress}`);

                  // Refresh balance with new address
                  if (walletAddress) {
                    await fetchMonBalance(walletAddress);
                  }
                } else if (newAddress) {
                  toast.error("Invalid address format. Must be 42 characters starting with 0x");
                }
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Set MON Address
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-[#333] flex items-center justify-center gap-1 hover:bg-blue-900/20"
              onClick={() => {
                if (walletAddress) {
                  viewOnExplorer("address", walletAddress);
                }
              }}
            >
              <ExternalLink className="h-3 w-3" />
              View Wallet
            </Button>
          </div>
        )}
      </div>
      
     
      
      {/* Swap interface: Mon to Farm Coins */}
      <div className="border border-[#333] p-4 bg-[#111] mb-4">
        <h3 className="text-white mb-3 flex justify-between items-center">
          <span>Swap MON for Farm Coins</span>
          <Button 
            onClick={handleManualRefresh}
            size="sm"
            variant="outline"
            className="h-8 border-[#333] text-xs flex gap-1 items-center"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isRefreshing ? "Updating..." : "Refresh"}
          </Button>
        </h3>
        
        <div>
          <div className="text-sm text-white/60 mb-1">Amount to Swap</div>
          <div className="mb-3">
            <div className="bg-[#111] border border-[#333] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">MON</span>
                <span className="text-xs text-gray-400">Balance: {isWalletConnected ? actualMonBalance : "0"}</span>
              </div>
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setSwapAmount(isNaN(value) ? 0 : value);
                  setError("");
                }}
                min="0"
                className="w-full bg-transparent border-none text-white text-lg placeholder-gray-400 focus:outline-none"
                placeholder="0.0"
              />
            </div>
          </div>
          
          <div className="flex justify-center my-3">
            <ArrowDown className="text-blue-500" />
          </div>
          
          <div className="mb-4">
            <div className="bg-[#111] border border-[#333] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Farm Coins</span>
                <span className="text-xs text-gray-400">Current: {farmCoins}</span>
              </div>
              <div className="text-white text-lg">
                {(swapAmount * 10000).toLocaleString()}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-2 mb-4 bg-red-900/20 border border-red-800/40 rounded text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
        
        <Button
          onClick={swapMonForFarmCoins}
          className="w-full mb-2 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading || !isWalletConnected || parseFloat(actualMonBalance) < swapAmount}
        >
          {isLoading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {!isWalletConnected ? "Connect Wallet First" : 
           parseFloat(actualMonBalance) < swapAmount ? "Insufficient MON Balance" :
           `Swap ${swapAmount} MON for ${(swapAmount * 10000).toLocaleString()} Farm Coins`}
        </Button>
      </div>
      
      {/* NEW: Swap Farm Coins for Mon */}
      <div className="border border-[#333] p-4 bg-[#111] mb-4">
        <h3 className="text-white mb-3">Swap Farm Coins for Mon</h3>
        
        {/* Contract balance warning */}
        {Number(contractMonBalance) < 10 && (
          <div className="p-2 mb-3 bg-red-900/30 border border-red-800 rounded text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-semibold">Warning: Contract Low on Mon</span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              The swap contract has only {Number(contractMonBalance).toFixed(2)} Mon tokens available.
              Swaps might fail if there are insufficient tokens.
            </p>
          </div>
        )}
        
        <div>
          <div className="text-sm text-white/60 mb-1">Farm Coins to Swap</div>
          <div className="Mon-swap-input-container mb-3">
            <Input 
              type="number"
              min="10"
              step="10"
              value={farmToMonAmount}
              onChange={(e) => setFarmToMonAmount(Number(e.target.value))}
              className="Mon-swap-input"
            />
            <div className="Mon-swap-token-info">
              <span>Farm Coins</span>
              <span className="text-xs opacity-60">Balance: {farmCoins}</span>
            </div>
          </div>
          
          <div className="flex justify-center my-3">
            <ArrowDown className="text-purple-500" />
          </div>
          
          <div className="text-sm text-white/60 mb-1">Mon to Receive</div>
          <div className="Mon-swap-output-container mb-4">
            <div className="Mon-swap-output">
              {(farmToMonAmount / 10).toFixed(2)}
            </div>
            <div className="Mon-swap-token-info">
              <span>Mon</span>
              <span className="text-xs opacity-60">Balance: {isWalletConnected ? actualMonBalance : "0"}</span>
            </div>
          </div>
          
          {farmToMonError && (
            <div className="p-2 mb-4 bg-red-900/20 border border-red-800/40 rounded text-sm text-red-400">
              {farmToMonError}
            </div>
          )}
          
          <Button
            onClick={swapFarmCoinsForMon}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isFarmToMonLoading || !isWalletConnected || Number(contractMonBalance) < farmToMonAmount / 10}
          >
            {isFarmToMonLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {!isWalletConnected ? "Connect Wallet First" : 
             Number(contractMonBalance) < farmToMonAmount / 10 ? "Insufficient Contract Balance" :
             `Swap ${farmToMonAmount} Farm Coins for ${(farmToMonAmount / 10).toFixed(2)} Mon`}
          </Button>
        </div>
      </div>
      
      
      
      {/* Transaction Details Dialog */}
      <Dialog open={showTxDetails} onOpenChange={setShowTxDetails}>
        <DialogContent className="bg-[#111] border border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white Mon-title">Transaction Details</DialogTitle>
            <DialogDescription className="text-white/60 Mon-text">
              Your swap transaction information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Transaction Hash</div>
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs bg-black p-2 border border-[#333] flex-1 overflow-hidden text-ellipsis text-white/80" title={currentTx.hash}>
                  {currentTx.hash.substring(0, 10)}...{currentTx.hash.substring(currentTx.hash.length - 8)}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2 border-[#333] text-white/80"
                  onClick={() => {
                    navigator.clipboard.writeText(currentTx.hash);
                    toast.success("Transaction hash copied to clipboard");
                  }}
                >
                  Copy
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2 border-[#333] text-white/80"
                  onClick={() => {
                    window.open(`${MONAD_BLOCK_EXPLORER}/tx/${currentTx.hash}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Status</div>
              <div className={`text-sm px-3 py-1.5 rounded inline-flex items-center transition-all duration-300
                ${currentTx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 animate-pulse' : 
                  currentTx.status === 'success' ? 'bg-green-500/20 text-green-300 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30' : 
                  'bg-red-500/20 text-red-300'}`}
              >
                {currentTx.status === 'pending' ? (
                  <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : currentTx.status === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mr-2" />
                )}
                {currentTx.status.charAt(0).toUpperCase() + currentTx.status.slice(1)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowTxDetails(false)}
              className="w-full bg-white text-black hover:bg-white/90 Mon-text"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Developer debug panel - hidden in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 border border-[#333] p-4 bg-[#111] rounded-lg">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <span className="text-xs bg-yellow-600 text-black font-mono px-2 py-0.5 rounded">DEBUG</span> 
            <span>Developer Tools</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) return;
                
                try {
                  let ethersProvider;
                  
                  if (false) { // Removed old wallet logic
                    if (window.ethereum) {
                      ethersProvider = getProvider(window.ethereum);
                    } else {
                      toast.error("No provider available");
                      return;
                    }
                  } else {
                    ethersProvider = getProvider(provider);
                  }
                  
                  const signer = await ethersProvider.getSigner();
                  const checksummedMonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
                  const MonContract = new Contract(checksummedMonAddress, TOKEN_ABI, ethersProvider);
                  const name = await MonContract.name();
                  const symbol = await MonContract.symbol();
                  toast.success(`Token info: ${name} (${symbol})`);
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to get token info");
                }
              }}
              className="bg-blue-900 hover:bg-blue-800 text-xs"
              size="sm"
            >
              Test Mon Contract
            </Button>
            
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) return;
                
                try {
                  let ethersProvider;
                  let signer;
                  
                  if (false) { // Removed old wallet logic
                    if (window.ethereum) {
                      ethersProvider = getProvider(window.ethereum);
                      signer = await ethersProvider.getSigner();
                    } else {
                      toast.error("No provider available");
                      return;
                    }
                  } else {
                    ethersProvider = getProvider(provider);
                    signer = await ethersProvider.getSigner();
                  }
                  
                  const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, ethersProvider);
                  const MonAddr = await swapContract.MonToken();
                  const checksummedMonAddr = getChecksumAddress(MonAddr);
                  toast.success(`FarmSwap linked to Mon at: ${checksummedMonAddr}`);
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to get FarmSwap info");
                }
              }}
              className="bg-blue-900 hover:bg-blue-800 text-xs"
              size="sm"
            >
              Test FarmSwap Contract
            </Button>
            
            <Button 
              onClick={debugContractConfig}
              className="bg-red-800 hover:bg-red-700 text-xs col-span-2"
              size="sm"
            >
              Debug Contract Setup
            </Button>
            
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) {
                  toast.error("Please connect a wallet");
                  return;
                }
                
                try {
                  let ethersProvider;
                  let signer;
                  let walletAddr;
                  
                  if (false) { // Removed old wallet logic
                    if (!window.ethereum) {
                      toast.error("No provider available for funding");
                      return;
                    }
                    
                    ethersProvider = getProvider(window.ethereum);
                    signer = await ethersProvider.getSigner();
                    walletAddr = walletAddress || "";
                  } else {
                    ethersProvider = getProvider(provider);
                    signer = await ethersProvider.getSigner();
                    const accounts = await provider.request({ method: 'eth_requestAccounts' });
                    walletAddr = accounts[0];
                  }
                  
                  if (!walletAddr) {
                    toast.error("Could not determine wallet address");
                    return;
                  }
                  
                  // Create Mon contract instance
                  const checksummedMonAddress = getChecksumAddress(TOKEN_ADDRESSES.MON);
                  const MonContract = new Contract(checksummedMonAddress, TOKEN_ABI, signer);
                  
                  // Get current balance
                  const currentBalance = await MonContract.balanceOf(walletAddr);
                  const formattedBalance = etherUtils.formatUnits(currentBalance, 18);
                  
                  // Ask how much to fund
                  const inputAmount = prompt(`Current balance: ${formattedBalance} Mon\nHow many Mon tokens do you want to fund to the contract?`, "100");
                  if (!inputAmount) return;
                  
                  const amount = parseFloat(inputAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error("Please enter a valid amount");
                    return;
                  }
                  
                  // Convert to wei
                  const weiAmount = etherUtils.parseUnits(amount.toString(), 18);
                  
                  // Get the contract address
                  const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  
                  // Direct transfer instead of using fundMon function
                  toast.success("Sending tokens to FarmSwap contract...");
                  
                  // Transfer directly to the contract
                  const tx = await MonContract.transfer(checksummedFarmSwapAddress, weiAmount, {
                    gasLimit: 200000
                  });
                  
                  // Wait for confirmation
                  toast.success("Transaction submitted, waiting for confirmation...");
                  const receipt = await tx.wait();
                  
                  if (receipt.status === 1) {
                    toast.success(`Successfully sent ${amount} Mon to the contract!`);
                    
                    // Fetch new balances to keep UI in sync
                    fetchMonBalance(walletAddr);
                    checkContractBalance();
                    
                    // Fetch balance of the contract for immediate feedback
                    const contractBalance = await MonContract.balanceOf(checksummedFarmSwapAddress);
                    const formattedContractBalance = etherUtils.formatUnits(contractBalance, 18);
                    
                    toast.success(`Contract now has ${formattedContractBalance} Mon`);
                  } else {
                    toast.error("Transaction failed");
                  }
                } catch (error: any) {
                  console.error("Fund error:", error);
                  toast.error(
                    <div className="space-y-1">
                      <p>Failed to fund contract</p>
                      <p className="text-xs">{error.message?.slice(0, 100) || "Unknown error"}</p>
                    </div>
                  );
                }
              }}
              className="bg-purple-800 hover:bg-purple-700 text-xs"
              size="sm"
            >
              Fund Contract
            </Button>
          </div>
          
          <p className="text-xs text-white/60 mb-3">
            Use these tools to deploy and interact with the Mon token and FarmSwap contracts directly.
            You can deploy a fresh Mon token, fund the contract, and check contract statuses.
          </p>
        </div>
      )}
      
      {/* Update the multi-token swap section */}
      <div className="Mon-swap-section mb-4">
        <h2 className="Mon-swap-title flex items-center">
          <span>Multi-Token Swap</span>
          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 text-white rounded">NEW</span>
        </h2>
        
        <div className="p-4 border border-[#333] rounded mb-4">
          <div className="flex flex-col space-y-4">
            {/* Add swap direction toggle */}
            <div className="flex justify-center mb-2">
              <div className="bg-[#222] rounded p-1 flex">
                <button 
                  className={`px-3 py-1 rounded ${swapDirection === 'Mon-to-token' ? 'bg-purple-600' : 'hover:bg-[#333]'}`}
                  onClick={() => {
                    setSwapDirection('Mon-to-token');
                    // Recalculate expected output when direction changes
                    setTimeout(() => calculateExpectedOutput(), 100);
                  }}
                >
                  Mon → Token
                </button>
                <button 
                  className={`px-3 py-1 rounded ${swapDirection === 'token-to-Mon' ? 'bg-blue-600' : 'hover:bg-[#333]'}`}
                  onClick={() => {
                    setSwapDirection('token-to-Mon');
                    // Recalculate expected output when direction changes
                    setTimeout(() => calculateExpectedOutput(), 100);
                  }}
                >
                  Token → Mon
                </button>
              </div>
            </div>
            
            {/* Token Selector */}
            <div>
              <label className="text-sm text-white/70 mb-1 block flex justify-between items-center">
                <span>{swapDirection === 'Mon-to-token' ? 'Select Target Token' : 'Select Source Token'}</span>
                <Button
                  onClick={() => swapDirection === 'Mon-to-token' 
                    ? addSelectedTokenToWallet() 
                    : addTokenToWallet()}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-[#333] hover:bg-[#222] flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add {swapDirection === 'Mon-to-token' ? selectedToken : 'Mon'} to Wallet
                </Button>
              </label>
              <div 
                className="flex items-center justify-between p-2 bg-[#222] border border-[#333] rounded cursor-pointer"
                onClick={() => setShowTokenSelector(!showTokenSelector)}
              >
                <div className="flex items-center">
                  <span>{TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}</span>
                </div>
                <ArrowDownUp className="h-4 w-4 text-white/60" />
              </div>
              
              {showTokenSelector && (
                <div className="mt-1 border border-[#333] bg-[#171717] rounded max-h-40 overflow-y-auto">
                  {Object.keys(TOKEN_ADDRESSES).filter(key => key !== "Mon").map((key) => (
                    <div 
                      key={key}
                      className={`p-2 hover:bg-[#222] cursor-pointer ${selectedToken === key ? "bg-[#222]" : ""}`}
                      onClick={() => {
                        setSelectedToken(key);
                        setShowTokenSelector(false);
                        // Recalculate expected output when token changes
                        setTimeout(() => calculateExpectedOutput(), 100);
                      }}
                    >
                      <span>{TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Input */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                {swapDirection === 'Mon-to-token' ? 'Mon to Swap' : `${selectedToken} to Swap`}
              </label>
              <div className="flex items-center border border-[#333] bg-[#111] rounded overflow-hidden">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setSwapAmount(isNaN(value) ? 0 : value);
                  }}
                  className="flex-1 bg-[#111] border-none px-3 py-2 text-white focus:outline-none"
                />
                <div className="px-3 py-2 bg-[#222]">
                  {swapDirection === 'Mon-to-token' ? 'Mon' : selectedToken}
                </div>
              </div>
              <div className="text-xs text-white/60 mt-1">
                Balance: {swapDirection === 'Mon-to-token' ? actualMonBalance : parseFloat(tokenBalances[selectedToken] || "0").toFixed(2)}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="text-white/60" />
            </div>
            
            {/* Output */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                {swapDirection === 'Mon-to-token' ? `${selectedToken} to Receive` : 'Mon to Receive'}
              </label>
              <div className="p-3 border border-[#333] bg-[#191919] rounded text-center">
                <div className="font-medium">{expectedOutputAmount || swapAmount} {swapDirection === 'Mon-to-token' ? selectedToken : 'Mon'}</div>
                <div className="text-xs text-white/40">(estimated)</div>
              </div>
            </div>
            
            {/* Swap Button */}
            <Button 
              onClick={swapDirection === 'Mon-to-token' ? swapMonForToken : swapTokenForMon}
              className={`w-full ${swapDirection === 'Mon-to-token' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={
                isMultiSwapLoading || 
                !isWalletConnected || 
                (swapDirection === 'Mon-to-token' 
                  ? parseFloat(actualMonBalance) < swapAmount 
                  : parseFloat(tokenBalances[selectedToken] || "0") < swapAmount)
              }
            >
              {isMultiSwapLoading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {!isWalletConnected ? "Connect Wallet First" : 
               swapDirection === 'Mon-to-token' 
                ? (parseFloat(actualMonBalance) < swapAmount 
                    ? "Insufficient Mon Balance" 
                    : `Swap Mon for ${TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}`)
                : (parseFloat(tokenBalances[selectedToken] || "0") < swapAmount 
                    ? `Insufficient ${selectedToken} Balance` 
                    : `Swap ${TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken} for Mon`)
              }
            </Button>
            
            {/* Token Faucet Button */}
            <Button
              onClick={async () => {
                if (!isWalletConnected || !walletAddress) {
                  toast.error("Please connect your wallet first");
                  return;
                }
                
                try {
                  setIsGettingTestTokens(true);
                  
                  const { provider: ethersProvider } = await getEthersProvider();
                  const signer = await ethersProvider.getSigner();
                  
                  // Switch to Monad Testnet if needed
                  await switchToMonadTestnet();
                  
                  // Create contract instance
                  const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
                  
                  let tx;
                  if (swapDirection === 'Mon-to-token' || selectedToken === 'Mon') {
                    // Get test Mon tokens
                    const MonAmount = etherUtils.parseUnits("10", 18); // 10 Mon
                    toast.loading("Claiming Mon test tokens...");
                    tx = await swapContract.claimTestMon(MonAmount);
                  } else {
                    // Get test selected tokens
                    const tokenAmount = etherUtils.parseUnits("5", 18); // 5 tokens
                    const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
                    toast.loading(`Claiming ${selectedToken} test tokens...`);
                    tx = await swapContract.claimTestTokens(tokenAddress, tokenAmount, { gasLimit: 500000 });
                  }
                  
                  await tx.wait();
                  toast.dismiss();
                  
                  // Update balances
                  await fetchMonBalance(walletAddress);
                  
                  toast.success(`Test tokens claimed successfully!`);
                } catch (error: any) {
                  toast.dismiss();
                  console.error("Error claiming test tokens:", error);
                  toast.error(error.message || "Failed to claim test tokens");
                } finally {
                  setIsGettingTestTokens(false);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isGettingTestTokens || !isWalletConnected}
            >
              {isGettingTestTokens ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              Get Test {swapDirection === 'Mon-to-token' ? 'Mon' : selectedToken}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contract Transaction Details */}
      {showTxDetails && (
        <div className="mt-4 p-3 border border-[#333] rounded bg-[#111] text-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Transaction Details</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => setShowTxDetails(false)}
            >
              <span>×</span>
            </Button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white/60">Status:</span>
              <span className={`${currentTx.status === 'pending' ? 'text-yellow-500' : 
                                    currentTx.status === 'success' ? 'text-green-500' : 
                                    'text-red-500'}`}>
                {currentTx.status.charAt(0).toUpperCase() + currentTx.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Hash:</span>
              <a
                href={`${MONAD_BLOCK_EXPLORER}/tx/${currentTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline truncate max-w-[180px]"
              >
                {currentTx.hash.substring(0, 10)}...{currentTx.hash.substring(currentTx.hash.length - 8)}
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 p-0 px-1"
                onClick={() => navigator.clipboard.writeText(currentTx.hash)}
              >
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dev Tools Section */}
      <div className="mt-8 border-t border-[#333] pt-4">
        <button
          onClick={() => setShowDevTools(!showDevTools)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <span className={`transform transition-transform ${showDevTools ? 'rotate-90' : ''}`}>▶</span>
          Developer Tools
        </button>
        
        {showDevTools && (
          <div className="mt-4 p-4 border border-[#333] rounded bg-[#111]">
            <h3 className="font-semibold mb-4 flex items-center">
              <span>Contract Funding Tools</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">DEV ONLY</span>
            </h3>
            
            {/* Contract Token Balances */}
            <div className="mb-4 p-3 border border-[#333] rounded bg-[#191919]">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Contract Token Balances</h4>
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-6 p-1 text-xs bg-transparent border-[#444]"
                  onClick={checkAllContractTokenBalances}
                  disabled={isLoadingContractBalances}
                >
                  {isLoadingContractBalances ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="text-white/60">
                    <tr>
                      <th className="text-left py-1">Token</th>
                      <th className="text-right py-1">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(contractTokenBalances).length > 0 ? (
                      Object.keys(contractTokenBalances).map(token => (
                        <tr key={token} className="border-t border-[#333]">
                          <td className="py-1">{TOKEN_INFO[token as keyof typeof TOKEN_INFO]?.symbol || token}</td>
                          <td className="py-1 text-right">
                            {parseFloat(contractTokenBalances[token]).toFixed(4)}
                          </td>
                        </tr>
                      ))
                    ) : isLoadingContractBalances ? (
                      <tr>
                        <td colSpan={2} className="py-2 text-center text-white/40">
                          Loading balances...
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-2 text-center text-white/40">
                          No token balances found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Token Selector */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">
                  Select Token to Fund
                </label>
                <select
                  className="w-full bg-[#222] border border-[#333] rounded p-2 text-white"
                  value={selectedFundToken}
                  onChange={(e) => setSelectedFundToken(e.target.value)}
                >
                  {Object.keys(TOKEN_ADDRESSES).map((token) => (
                    <option key={token} value={token}>
                      {TOKEN_INFO[token as keyof typeof TOKEN_INFO]?.symbol || token}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">
                  Amount to Fund
                </label>
                <div className="flex items-center border border-[#333] bg-[#111] rounded overflow-hidden">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setFundAmount(isNaN(value) ? 0 : value);
                    }}
                    className="flex-1 bg-[#111] border-none px-3 py-2 text-white focus:outline-none"
                    placeholder="Enter amount"
                  />
                  <div className="px-3 py-2 bg-[#222]">
                    {selectedFundToken}
                  </div>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Current Balance: {selectedFundToken === "Mon" ? 
                    actualMonBalance : 
                    parseFloat(tokenBalances[selectedFundToken] || "0").toFixed(2)}
                </div>
              </div>
              
              {/* Fund Button */}
              <Button 
                onClick={fundContractWithToken}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isFunding || !isWalletConnected}
              >
                {isFunding ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Funding...
                  </>
                ) : (
                  <>
                    Fund Contract with {selectedFundToken}
                  </>
                )}
              </Button>
              
              {/* Info Box */}
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-500">
                <p>⚠️ Developer tools: Use these functions to add liquidity to the contract for token swaps. This allows users to swap between tokens.</p>
                <p className="mt-1">A token must be both supported and have sufficient liquidity for swaps to work.</p>
              </div>
            </div>
            
            {/* Token Registration Section */}
            <div className="mt-6 pt-4 border-t border-[#333]">
              <h4 className="font-medium mb-4">Register New Token</h4>
              
              <div className="space-y-4">
                {/* Token Address Input */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    Token Contract Address
                  </label>
                  <input
                    type="text"
                    value={newTokenAddress}
                    onChange={(e) => setNewTokenAddress(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0x..."
                  />
                </div>
                
                {/* Exchange Rate Input */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    Exchange Rate (1 Token = X Mon)
                  </label>
                  <input
                    type="number"
                    value={newTokenExchangeRate}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setNewTokenExchangeRate(isNaN(value) ? 1 : value);
                    }}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter exchange rate"
                    step="0.1"
                    min="0.1"
                  />
                  <div className="text-xs text-white/60 mt-1">
                    Example: Setting 2.5 means 1 Token = 2.5 Mon
                  </div>
                </div>
                
                {/* Add Token Button */}
                <Button 
                  onClick={addTokenToContract}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isAddingToken || !isWalletConnected || !newTokenAddress}
                >
                  {isAddingToken ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Adding Token...
                    </>
                  ) : (
                    <>
                      Register Token to Contract
                    </>
                  )}
                </Button>
                
                {/* Info about token registration */}
                <div className="p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-400">
                  <p>ℹ️ Once a token is registered, it can be funded and used for swaps.</p>
                  <p className="mt-1">Make sure the token follows the ERC-20 standard with 18 decimals.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <AdminSettings />
      <div className="mt-4">
        {renderSwapButtons()}
      </div>
    </div>
  );
};
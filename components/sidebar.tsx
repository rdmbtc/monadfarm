"use client";

import { useContext, useState, useEffect } from "react";
import { GameContext } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Trophy, 
  Package, 
  Settings, 
  User, 
  Repeat, 
  ChevronRight, 
  Sprout, 
  ChevronsLeft, 
  ChevronsRight, 
  Home,
  BarChart,
  X,
  Sun,
  Moon,
  Coins,
  Gamepad2,
  ArrowRightLeft,
  Users,
  Wallet,
  Briefcase,
  BookOpen
} from "lucide-react";
import { Leaderboard } from "./leaderboard";
import { ethers, Contract } from "ethers";
import { AccessibilityMenu } from "./accessibility-menu";
import Link from "next/link";

// Add type declarations for window.gameFunctions
declare global {
  interface Window {
    gameFunctions?: {
      resetGame: () => void;
    };
  }
}

export interface SidebarProps {
  provider?: any; // Using a more generic type for provider
  isConnected?: boolean;
  setActiveView: (view: string) => void;
  activeView: string;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ 
  provider, 
  isConnected,
  setActiveView,
  activeView,
  showSidebar,
  setShowSidebar,
  activeTab,
  setActiveTab
}: SidebarProps) => {
  const { farmCoins, seeds, playerLevel, playerXp, upgradeSeed, resetGame } = useContext(GameContext);
  const [openTab, setOpenTab] = useState<string | null>("swap");
  const [collapsed, setCollapsed] = useState(false);
  const [clientSideFarmCoins, setClientSideFarmCoins] = useState<number>(0);
  const [isCoinAnimating, setIsCoinAnimating] = useState(false);
  
  // Enhanced farm coins synchronization with real-time updates and fallback mechanisms
  useEffect(() => {
    console.log('💰 Sidebar: Farm coins changed from', clientSideFarmCoins, 'to', farmCoins);

    // Always update when farmCoins changes, regardless of current value
    if (farmCoins !== clientSideFarmCoins) {
      // Trigger animation for any change (except initial load from 0)
      if (clientSideFarmCoins !== 0 && farmCoins !== 0) {
        setIsCoinAnimating(true);
        const timer = setTimeout(() => setIsCoinAnimating(false), 500);
        // Store timer reference for cleanup
        return () => clearTimeout(timer);
      }

      // Update the displayed value immediately
      setClientSideFarmCoins(farmCoins);
    }
  }, [farmCoins]); // Only depend on farmCoins to prevent loops

  // Force update on mount to ensure initial sync
  useEffect(() => {
    console.log('💰 Sidebar: Initial mount sync - farmCoins:', farmCoins);
    setClientSideFarmCoins(farmCoins);
  }, []); // Run only once on mount

  // Periodic sync to catch any missed updates (fallback mechanism)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (farmCoins !== clientSideFarmCoins) {
        console.log('💰 Sidebar: Periodic sync detected mismatch, fixing:', farmCoins, '!=', clientSideFarmCoins);
        setClientSideFarmCoins(farmCoins);
      }
    }, 1000); // Check every second

    return () => clearInterval(syncInterval);
  }, [farmCoins, clientSideFarmCoins]);

  // Force re-render when GameContext changes (additional safety net)
  const [forceUpdate, setForceUpdate] = useState(0);
  useEffect(() => {
    const forceUpdateInterval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 2000); // Force re-render every 2 seconds

    return () => clearInterval(forceUpdateInterval);
  }, []);

  // Additional fallback: Listen to localStorage changes directly
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'farm-coins' && e.newValue) {
        try {
          const newCoins = JSON.parse(e.newValue);
          console.log('💰 Sidebar: localStorage change detected:', newCoins);
          if (newCoins !== clientSideFarmCoins) {
            setClientSideFarmCoins(newCoins);
            setIsCoinAnimating(true);
            setTimeout(() => setIsCoinAnimating(false), 500);
          }
        } catch (error) {
          console.error('💰 Sidebar: Error parsing localStorage coins:', error);
        }
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also check localStorage directly on mount
    try {
      const storedCoins = localStorage.getItem('farm-coins');
      if (storedCoins) {
        const parsedCoins = JSON.parse(storedCoins);
        if (parsedCoins !== clientSideFarmCoins && parsedCoins !== farmCoins) {
          console.log('💰 Sidebar: Direct localStorage check found different value:', parsedCoins);
          setClientSideFarmCoins(parsedCoins);
        }
      }
    } catch (error) {
      console.error('💰 Sidebar: Error reading localStorage:', error);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Debug effect to track all changes
  useEffect(() => {
    console.log('💰 Sidebar: State update - farmCoins:', farmCoins, 'clientSide:', clientSideFarmCoins, 'animating:', isCoinAnimating, 'forceUpdate:', forceUpdate);
  }, [farmCoins, clientSideFarmCoins, isCoinAnimating, forceUpdate]);

  const handleMintNFT = async () => {
    if (!provider || !isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    try {
      const signer = await provider.getSigner();
      const contractAddress = "YOUR_NFT_CONTRACT_ADDRESS"; // Replace with actual address
      const nftABI = ["function mint(address to) external"];
      const contract = new Contract(contractAddress, nftABI, signer);
      const tx = await contract.mint(await signer.getAddress());
      await tx.wait();
      alert("NFT minted successfully!");
    } catch (error) {
      console.error("Mint failed:", error);
      alert("Failed to mint NFT.");
    }
  };

  const handleResetGame = () => {
    try {
      // Add confirmation dialog
      if (!window.confirm("Are you sure you want to delete your account? This will reset all your progress, farm coins, and game data. This action cannot be undone.")) {
        return; // User canceled
      }

      // Call the reset game function from the game component
      if (typeof window !== 'undefined') {
        // Clear all game data from localStorage including specific items
        localStorage.clear();

        // Explicitly reset farm coins to 0 in localStorage
        localStorage.setItem('farm-coins', '0');

        // Reset bonus claimed state
        localStorage.removeItem('bonus-claimed');

        // Call context resetGame function
        resetGame();

        // Call game component resetGame if available
        if (window.gameFunctions?.resetGame) {
          window.gameFunctions.resetGame();
          console.log("Game reset successfully");
        }

        // Show success message to user
        alert("Account deleted successfully. Your game data has been reset and coins set to 0.");

        // Force reload to ensure all state is reset
        window.location.reload();
      } else {
        console.error("Reset game function not available");
      }
    } catch (error) {
      console.error("Error resetting game:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const renderTabContent = () => {
    switch (openTab) {
      case "market":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-gradient">Market</h2>
            <p className="text-foreground/80">Coming soon! Buy special items for your farm.</p>
          </div>
        );
      case "leaderboard":
        return <Leaderboard />;
      case "inventory":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-gradient">Inventory</h2>
            <p className="text-foreground/80">Your items will appear here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "farm") {
      setActiveView('farm');
      window.location.href = '/';
    } else if (tab === "market") {
      setActiveView('market');
    } else if (tab === "case-simulator") {
      setActiveView('case-simulator');
      window.location.href = '/case-simulator';
    } else if (tab === "swap") {
      setActiveView('swap');
    } else if (tab === "profile" || tab === "settings") {
      setActiveView(tab);
    } else {
      setActiveView(tab);
    }
    
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 z-30 h-full w-72 bg-black border-r border-[#333] transition-all duration-300 transform overflow-hidden 
      ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex flex-col h-full overflow-auto">
        {/* Close button - only visible on mobile */}
        <div className="md:hidden absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-[#222] text-white"
            onClick={() => setShowSidebar(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Logo and game title */}
        <div className="p-4 border-b border-[#333] flex items-center justify-center">
          <div className="relative group">
            <div className="w-12 h-12 rounded-none bg-black border border-[#333] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden p-2">
              <img src="/images/logo mark/Monad Logo - Default - Logo Mark.png" alt="Monad" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="ml-3">
            <h1 className="font-bold text-xl text-white noot-title">MonFarm</h1>
            <p className="text-xs text-white/60 noot-text">Powered by Monad Blockchain</p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="px-2 py-4 space-y-1">
          <Button 
            variant={activeTab === "farm" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "farm" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("farm")}
          >
            <Home className="h-4 w-4 mr-2" />
            <span>Farm</span>
            {activeTab === "farm" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <Link href="/guide" passHref legacyBehavior>
            <Button 
              variant={"ghost"}
              className={`w-full justify-start rounded-none border border-transparent noot-text text-white/80 hover:bg-[#222] hover:text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Game Guide</span>
            </Button>
          </Link>
          
          <Button 
            variant={activeTab === "profile" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "profile" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("profile")}
          >
            <User className="h-4 w-4 mr-2" />
            <span>Profile</span>
            {activeTab === "profile" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <Button 
            variant={activeTab === "settings" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "settings" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            <span>Settings</span>
            {activeTab === "settings" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
         
          
          <Link href="/social-hub" passHref legacyBehavior>
            <Button
              variant={activeTab === "social" ? "default" : "ghost"}
              className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "social" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            >
              <Users className="h-4 w-4 mr-2" />
              <span>Social Hub</span>
              {activeTab === "social" && (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>
          </Link>
          
          <div className="flex-grow"></div>
          
          {!collapsed && (
            <div className="pt-4 border-t border-[#333] mt-4">
              <Button
                variant="outline"
                className="w-full justify-start rounded-none border-[#333] text-white hover:bg-[#222] hover:text-white noot-text transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                onClick={handleResetGame}
              >
                <Repeat className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          )}
        </nav>
        
        {/* Farm Coins display with real-time synchronization */}
        <div className="px-4 py-3 border-y border-[#333]">
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <div className="text-sm text-white/70 noot-text">Farm Coins</div>
              <div className={`font-bold text-lg noot-title transition-all duration-300 ${isCoinAnimating ? 'animate-pulse text-yellow-400 scale-105' : 'text-white'}`}>
                {(() => {
                  // Always show the most current value available
                  const displayValue = clientSideFarmCoins !== undefined ? clientSideFarmCoins : farmCoins;
                  return (displayValue || 0).toFixed(2);
                })()}
              </div>
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-1">
                  Debug: {farmCoins?.toFixed(2)} → {clientSideFarmCoins?.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tokenomics information */}
        <div className="p-4 border-t border-[#333] text-xs text-white/60 space-y-2 noot-text">
          <div className="flex justify-between">
            <span>Blockchain</span>
            <span>Monad</span>
          </div>
          <div className="flex justify-between">
            <span>Transactions per second</span>
            <span>10K TPS</span>
          </div>
          <div className="flex justify-between">
            <span>Testnet tokens</span>
            <span>https://testnet.monad.xyz/</span>
          </div>
          <div className="flex justify-between">
            <span>Created with Love</span>
            <span>by DR RDM</span>
          </div>
        </div>
      </div>
    </aside>
  );
};


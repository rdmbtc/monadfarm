"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { ClientOnlyWrapper } from "../../../components/client-only-wrapper"
import dynamic from "next/dynamic"
import { ReactTogether } from 'react-together'
import { ErrorBoundary } from "../../../components/error-boundary"

// Dynamically import FarmFeed to avoid SSR issues (using local version)
const FarmFeed = dynamic(() => import("../components/farm-feed"), {
  ssr: false,
  loading: () => <div className="text-white">Loading feed...</div>
})
import { EventsCarousel } from "../../../components/events-carousel"
// Dynamically import FriendSuggestions to avoid SSR issues (using local version)
const FriendSuggestions = dynamic(() => import("../components/friend-suggestions"), {
  ssr: false,
  loading: () => <div className="text-white">Loading friends...</div>
})
import AchievementShowcase from "../../../components/achievement-showcase"
import { PulseNotification } from "../../../components/ui/pulse-notification"
import { StreakCounter } from "../../../components/ui/streak-counter"
import { motion } from "framer-motion"
import { useState, useEffect, useContext } from "react"
import { useToast } from "../../../hooks/use-toast"
import { useIsTogether } from 'react-together'
import { GameContext } from "../../../context/game-context"
import { RewardPopup } from "../../../components/ui/reward-popup"
import BulletproofSocialFeed from "../../../components/bulletproof-social-feed"
import { NotificationDropdown } from "../../../components/notification-dropdown"
import { useUnifiedNickname } from "../../../hooks/useUnifiedNickname"
import ProfileEditModal from "../../../components/profile-edit-modal"
import { useFarmInventory } from "../../../hooks/useFarmInventory"
import { TradingSystem } from "../../../components/trading-system"

type CroquetConnectionType = 'connecting' | 'online' | 'fatal' | 'offline'

const useSessionStatus = (): CroquetConnectionType => {
  const [connectionStatus, set_connectionStatus] = useState<CroquetConnectionType>('offline')
  const isTogether = useIsTogether()

  useEffect(() => {
    const checkConnectionStatus = () => {
      const spinnerOverlay = document.getElementById('croquet_spinnerOverlay')
      const fatalElement = document.querySelector('.croquet_fatal')

      if      (fatalElement)   set_connectionStatus('fatal') //prettier-ignore
      else if (spinnerOverlay) set_connectionStatus('connecting') //prettier-ignore
      else if (isTogether)     set_connectionStatus('online') //prettier-ignore
      else                     set_connectionStatus('offline') //prettier-ignore
    }

    //initial check
    checkConnectionStatus()

    //set up observer to watch for changes in the body
    const observer = new MutationObserver(checkConnectionStatus)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    return () => observer.disconnect()
  }, [isTogether])

  return connectionStatus
}

interface SocialHubPageProps {
  farmCoins?: number;
  addFarmCoins?: (amount: number) => void;
  nickname?: string;
}

// Error boundary component for ReactTogether
function ReactTogetherErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Internal component that uses ReactTogether hooks
function SocialHubPageContent({
  farmCoins = 1000,
  addFarmCoins = (amount: number) => {console.log(`Added ${amount} coins`)},
  nickname = "FarmerJoe123"
}: SocialHubPageProps) {
  const [showDailyReward, setShowDailyReward] = useState(false)
  const [activeTab, setActiveTab] = useState<'social' | 'trading'>('social')
  const { toast } = useToast()

  // Use the unified nickname system
  const { nickname: currentNickname, updateNickname } = useUnifiedNickname();

  // Get real farm inventory data
  const farmInventory = useFarmInventory();

  // Get player level and XP from GameContext
  const { playerLevel, playerXp, playerXpToNext } = useContext(GameContext);

  // Use session status hook to monitor connection
  const sessionStatus = useSessionStatus();

  // Hide multisynq loading spinner
  useEffect(() => {
    // Inject CSS to hide spinner
    const style = document.createElement('style')
    style.textContent = `
      #croquet_spinnerOverlay {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .croquet_spinner {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `
    document.head.appendChild(style)

    const hideSpinner = () => {
      const spinnerOverlay = document.getElementById('croquet_spinnerOverlay')
      if (spinnerOverlay) {
        spinnerOverlay.style.display = 'none'
        spinnerOverlay.style.visibility = 'hidden'
        spinnerOverlay.style.opacity = '0'
        console.log('🌐 Hidden multisynq loading spinner in social hub', { sessionStatus })
      }

      // Also hide any spinner elements with class
      const spinnerElements = document.querySelectorAll('.croquet_spinner')
      spinnerElements.forEach(element => {
        (element as HTMLElement).style.display = 'none'
        ;(element as HTMLElement).style.visibility = 'hidden'
        ;(element as HTMLElement).style.opacity = '0'
      })
    }

    // Hide immediately if present
    hideSpinner()

    // Set up observer to hide spinner when it appears
    const observer = new MutationObserver(() => {
      hideSpinner()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // The unified hook handles all synchronization automatically

  // Show daily reward popup after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDailyReward(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClaimDailyReward = () => {
    // Add coins when claiming reward
    addFarmCoins(200)
    
    toast({
      title: "Daily Reward Claimed!",
      description: "Come back tomorrow for another reward!",
      variant: "default",
    })
    
    setShowDailyReward(false)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Real-time synchronization is handled by the dedicated ReactTogether wrapper for this page
  // The BulletproofSocialFeed component uses Multisynq for live updates

  return (
    <div className="min-h-screen bg-black">
      {showDailyReward && (
        <RewardPopup
          title="Social Hub Daily Reward!"
          description="Thanks for visiting the Social Hub today!"
          reward="200 Farm Coins + 5 Premium Seeds"
          icon="🎁"
          onClaim={handleClaimDailyReward}
          onClose={() => setShowDailyReward(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-[#333] py-3 px-4 flex justify-between items-center bg-[#111]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white rounded-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">🌾 MonFarm Social Hub</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <Button
            variant="outline"
            className="bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white rounded-none"
          >
            {farmCoins} 🪙
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-[#333] bg-[#111]">
        <div className="px-4 py-2 flex gap-2">
          <Button
            variant={activeTab === 'social' ? 'default' : 'outline'}
            onClick={() => setActiveTab('social')}
            className={activeTab === 'social'
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-transparent border-[#333] hover:bg-[#222] text-white"
            }
          >
            💬 Social Feed
          </Button>
          <Button
            variant={activeTab === 'trading' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trading')}
            className={activeTab === 'trading'
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-transparent border-[#333] hover:bg-[#222] text-white"
            }
          >
            🤝 Trading Hub
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Sidebar */}
          <motion.div variants={item} className="lg:col-span-1 space-y-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#171717] rounded-none shadow-md overflow-hidden border border-[#333]"
            >
              <div className="p-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white">Your Profile</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-16 w-16 rounded-full bg-[#111] overflow-hidden border border-[#333]"
                  >
                    <img
                      src="/images/nooter.png"
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{currentNickname}</h3>
                    <p className="text-sm text-white/60">Level {playerLevel} • Premium Farmer</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                        <span>XP Progress</span>
                        <span>{playerXp}/{playerXpToNext}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (playerXp / playerXpToNext) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                    title={`Total crops harvested: ${farmInventory.totalCrops}`}
                  >
                    <p className="text-sm text-white/60">Crops</p>
                    <p className="text-lg font-bold text-white">{farmInventory.totalCrops}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                    title={`Animals owned: ${farmInventory.totalAnimals}`}
                  >
                    <p className="text-sm text-white/60">Animals</p>
                    <p className="text-lg font-bold text-white">{farmInventory.totalAnimals}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                    title="Friends connected (placeholder)"
                  >
                    <p className="text-sm text-white/60">Friends</p>
                    <p className="text-lg font-bold text-white">12</p>
                  </motion.div>
                </div>
                
                <ProfileEditModal
                  currentNickname={currentNickname || nickname}
                  onNicknameChange={(newNickname) => {
                    console.log('Attempting to change nickname to:', newNickname);

                    try {
                      // Use the unified nickname system
                      const success = updateNickname(newNickname);

                      if (success) {
                        toast({
                          title: "Nickname Updated!",
                          description: `Your nickname has been changed to "${newNickname}"`,
                          variant: "default",
                        });
                        return true;
                      } else {
                        toast({
                          title: "Error",
                          description: "Failed to update nickname. Please try again.",
                          variant: "destructive",
                        });
                        return false;
                      }
                    } catch (error) {
                      console.error('Error changing nickname:', error);
                      toast({
                        title: "Error",
                        description: "An unexpected error occurred while changing your nickname.",
                        variant: "destructive",
                      });
                      return false;
                    }
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-2 rounded-none font-medium transition-colors bg-white text-black hover:bg-white/90"
                  >
                    Edit Profile
                  </motion.button>
                </ProfileEditModal>
              </div>
            </motion.div>

            <AchievementShowcase />
            <FriendSuggestions />
          </motion.div>

          {/* Middle - Content Feed */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            {activeTab === 'social' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <EventsCarousel />
                </motion.div>

                <BulletproofSocialFeed />
              </>
            )}

            {activeTab === 'trading' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TradingSystem />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-4 border-t border-[#333] bg-[#111] text-white/60 text-center text-sm">
        <p>© {new Date().getFullYear()} MonFarm Social Hub - All rights reserved</p>
      </footer>
    </div>
  )
}

// Main wrapper component with API key check and ReactTogether setup
export function SocialHubPage(props: SocialHubPageProps) {
  const apiKey = process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY;

  console.log('SocialHubPage: Initializing with API key:', apiKey ? 'Present' : 'Missing');

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">⚠️ API Key Missing</h1>
          <p className="text-gray-300 mb-4">
            React Together API key not found in environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Make sure NEXT_PUBLIC_REACT_TOGETHER_API_KEY is set in your .env file
          </p>
        </div>
      </div>
    );
  }

  console.log('SocialHubPage: Initializing ReactTogether session for social hub');

  return (
    <ReactTogetherErrorBoundary>
      <ReactTogether
        sessionParams={{
          apiKey: apiKey,
          appId: "monfarm.social.hub",
          name: "monfarm-social-hub-main",
          password: "public"
        }}
        rememberUsers={true}
        deriveNickname={(userId) => {
          // Custom logic to derive initial nickname from localStorage
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem('player-nickname');
            if (stored && stored.trim() !== '') {
              console.log('SocialHub ReactTogether deriveNickname: Using stored nickname:', stored);
              return stored;
            }
          }
          // Fallback to a farmer-themed name if no stored nickname
          const adjectives = ["Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden"];
          const farmTerms = ["Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher"];
          const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
          const term = farmTerms[Math.floor(Math.random() * farmTerms.length)];
          const fallbackName = `${adj} ${term}`;
          console.log('SocialHub ReactTogether deriveNickname: Using fallback nickname:', fallbackName);
          return fallbackName;
        }}
      >
        <SocialHubPageContent {...props} />
      </ReactTogether>
    </ReactTogetherErrorBoundary>
  );
}
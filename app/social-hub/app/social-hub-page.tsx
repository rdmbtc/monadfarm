"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "../../../components/ui/button"
import FarmFeed from "../../../components/farm-feed"
import { EventsCarousel } from "../../../components/events-carousel"
import FriendSuggestions from "../../../components/friend-suggestions"
import AchievementShowcase from "../../../components/achievement-showcase"
import { PulseNotification } from "../../../components/ui/pulse-notification"
import { StreakCounter } from "../../../components/ui/streak-counter"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useToast } from "../../../hooks/use-toast"
import { RewardPopup } from "../../../components/ui/reward-popup"
import { SocialFeed } from "../../../components/social-feed"
import { NotificationDropdown } from "../../../components/notification-dropdown"

interface SocialHubPageProps {
  farmCoins?: number;
  addFarmCoins?: (amount: number) => void;
  nickname?: string;
  playerLevel?: number;
}

export function SocialHubPage({ 
  farmCoins = 1000, 
  addFarmCoins = (amount: number) => {console.log(`Added ${amount} coins`)}, 
  nickname = "FarmerJoe123",
  playerLevel = 42
}: SocialHubPageProps) {
  const [showDailyReward, setShowDailyReward] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [userNickname, setUserNickname] = useState(nickname)
  const [showNicknameSetup, setShowNicknameSetup] = useState(false)
  const [activeTab, setActiveTab] = useState<'combined' | 'feed' | 'chat'>('combined')
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // React Together integration (only on client side)
  const {
    isConnected: isReactTogetherConnected,
    currentUser,
    users,
    onlineCount,
    setNickname: setReactTogetherNickname
  } = useReactTogether({
    chatKey: 'monfarm-social-hub'
  })

  // Handle wallet connection
  const handleWalletConnected = (address: string) => {
    setIsWalletConnected(true)
    setWalletAddress(address)

    // Show nickname setup if user doesn't have one set
    if (!userNickname || userNickname === "FarmerJoe123") {
      setShowNicknameSetup(true)
    } else {
      // Set nickname in React Together
      setReactTogetherNickname(userNickname)

      toast({
        title: "Welcome back to Social Hub!",
        description: "Your wallet is connected. You can now interact with other farmers!",
      })
    }
  }

  // Handle wallet disconnection
  const handleWalletDisconnected = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
  }

  // Handle nickname setup
  const handleNicknameSet = (newNickname: string) => {
    setUserNickname(newNickname)
    setShowNicknameSetup(false)

    // Set nickname in React Together
    setReactTogetherNickname(newNickname)

    toast({
      title: "Welcome to Social Hub!",
      description: `Your wallet is connected and you're ready to interact with other farmers!`,
    })
  }

  // Handle nickname setup skip
  const handleNicknameSkip = () => {
    setShowNicknameSetup(false)

    // Set default nickname in React Together
    setReactTogetherNickname(userNickname)

    toast({
      title: "Welcome to Social Hub!",
      description: "You can set your nickname later in profile settings.",
    })
  }

  // Show daily reward popup after a short delay (only if wallet connected)
  useEffect(() => {
    if (isWalletConnected) {
      const timer = setTimeout(() => {
        setShowDailyReward(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isWalletConnected])

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

  // Show loading state during SSR or while client is initializing
  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading Social Hub...</div>
      </div>
    )
  }

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
          <h1 className="text-xl font-bold text-white">Noot Quest Social Hub</h1>
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
                  <div>
                    <h3 className="text-lg font-bold text-white">{nickname}</h3>
                    <p className="text-sm text-white/60">Level {playerLevel} • Premium Farmer</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                  >
                    <p className="text-sm text-white/60">Crops</p>
                    <p className="text-lg font-bold text-white">128</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                  >
                    <p className="text-sm text-white/60">Animals</p>
                    <p className="text-lg font-bold text-white">64</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] p-2 border border-[#333] rounded-none"
                  >
                    <p className="text-sm text-white/60">Friends</p>
                    <p className="text-lg font-bold text-white">12</p>
                  </motion.div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-2 bg-white text-black hover:bg-white/90 rounded-none font-medium"
                >
                  Edit Profile
                </motion.button>
              </div>
            </motion.div>

            <AchievementShowcase />
            <FriendSuggestions />
          </motion.div>

          {/* Middle - Content Feed */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <EventsCarousel />
            </motion.div>

            <SocialFeed />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-4 border-t border-[#333] bg-[#111] text-white/60 text-center text-sm">
        <p>© {new Date().getFullYear()} Noot Quest - All rights reserved</p>
      </footer>
    </div>
  )
} 
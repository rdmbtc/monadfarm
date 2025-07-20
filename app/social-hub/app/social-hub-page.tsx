"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { ClientOnlyWrapper } from "../../../components/client-only-wrapper"
import dynamic from "next/dynamic"

// Dynamically import FarmFeed to avoid SSR issues
const FarmFeed = dynamic(() => import("../../../components/farm-feed"), {
  ssr: false,
  loading: () => <div className="text-white">Loading feed...</div>
})
import { EventsCarousel } from "../../../components/events-carousel"
// Dynamically import FriendSuggestions to avoid SSR issues
const FriendSuggestions = dynamic(() => import("../../../components/friend-suggestions"), {
  ssr: false,
  loading: () => <div className="text-white">Loading friends...</div>
})
import AchievementShowcase from "../../../components/achievement-showcase"
import { PulseNotification } from "../../../components/ui/pulse-notification"
import { StreakCounter } from "../../../components/ui/streak-counter"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useToast } from "../../../hooks/use-toast"
import { RewardPopup } from "../../../components/ui/reward-popup"
import BulletproofSocialFeed from "../../../components/bulletproof-social-feed"
import { NotificationDropdown } from "../../../components/notification-dropdown"
import { ReactTogether, useNicknames } from 'react-together'
import { ReactTogetherErrorBoundary } from "../../../components/react-together-error-boundary"
import ProfileEditModal from "../../../components/profile-edit-modal"

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
  const { toast } = useToast()

  // Use the official React Together useNicknames hook
  const [currentNickname, setCurrentNickname] = useNicknames()

  // Sync the passed nickname prop with React Together nickname
  useEffect(() => {
    if (nickname && nickname !== currentNickname) {
      console.log('SocialHubPage: Syncing nickname from prop to React Together:', nickname);
      setCurrentNickname(nickname);
    }
  }, [nickname, currentNickname, setCurrentNickname]);

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

  // Get API key and handle missing key
  const apiKey = process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY;

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

  return (
    <ReactTogetherErrorBoundary>
      <ReactTogether
        sessionParams={{
          apiKey: apiKey,
          appId: "monfarm.social.hub",
          name: "monfarm-social-hub-main",
          password: "public"
        }}
      >
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
                    <h3 className="text-lg font-bold text-white">{currentNickname}</h3>
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
                
                <ProfileEditModal
                  currentNickname={currentNickname || nickname}
                  onNicknameChange={(newNickname) => {
                    console.log('Attempting to change nickname to:', newNickname);

                    try {
                      // Use the official React Together setNickname function
                      setCurrentNickname(newNickname);

                      toast({
                        title: "Nickname Updated!",
                        description: `Your nickname has been changed to "${newNickname}"`,
                        variant: "default",
                      });

                      return true;
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <EventsCarousel />
            </motion.div>

            <BulletproofSocialFeed />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-4 border-t border-[#333] bg-[#111] text-white/60 text-center text-sm">
        <p>© {new Date().getFullYear()} MonFarm Social Hub - All rights reserved</p>
      </footer>
    </div>
    </ReactTogether>
    </ReactTogetherErrorBoundary>
  )
}
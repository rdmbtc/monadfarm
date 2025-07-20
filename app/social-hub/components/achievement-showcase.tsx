"use client"

import { useState, useEffect, useContext } from "react"
import { Trophy, ChevronRight, ChevronLeft, Star, Gift } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { RewardPopup } from "@/components/ui/reward-popup"
import { Confetti } from "@/components/ui/confetti"
import { GameContext } from "../../../context/game-context"
import { useFarmInventory } from "../../../hooks/useFarmInventory"
import { useStateTogether, useMyId } from 'react-together'

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  current: number;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  reward: string;
  claimable: boolean;
}

export default function AchievementShowcase() {
  const [currentPage, setCurrentPage] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [claimedRewards, setClaimedRewards] = useStateTogether<string[]>('claimed-achievements', [])
  const [rewardPopup, setRewardPopup] = useState<{
    show: boolean
    achievement: Achievement | null
  }>({ show: false, achievement: null })
  const { toast } = useToast()
  const myId = useMyId()

  // Get real game data
  const {
    cropsHarvested,
    seedsPlanted,
    totalCoinsEarned,
    playerLevel,
    farmCoins,
    animals,
    addFarmCoins
  } = useContext(GameContext)

  const farmInventory = useFarmInventory()

  // Define dynamic achievements based on real game data
  const achievements: Achievement[] = [
    {
      id: "first-harvest",
      title: "First Harvest",
      description: "Harvest your first crop",
      icon: "🌱",
      progress: Math.min(100, (cropsHarvested / 1) * 100),
      total: 1,
      current: cropsHarvested,
      rarity: "Common",
      reward: "50 Farm Coins",
      claimable: cropsHarvested >= 1 && !claimedRewards.includes("first-harvest")
    },
    {
      id: "crop-master",
      title: "Crop Master",
      description: "Harvest 100 crops",
      icon: "🌽",
      progress: Math.min(100, (cropsHarvested / 100) * 100),
      total: 100,
      current: cropsHarvested,
      rarity: "Uncommon",
      reward: "500 Farm Coins",
      claimable: cropsHarvested >= 100 && !claimedRewards.includes("crop-master")
    },
    {
      id: "farming-legend",
      title: "Farming Legend",
      description: "Harvest 1,000 crops",
      icon: "🏆",
      progress: Math.min(100, (cropsHarvested / 1000) * 100),
      total: 1000,
      current: cropsHarvested,
      rarity: "Legendary",
      reward: "2,000 Farm Coins",
      claimable: cropsHarvested >= 1000 && !claimedRewards.includes("farming-legend")
    },
    {
      id: "seed-planter",
      title: "Seed Planter",
      description: "Plant 50 seeds",
      icon: "🌰",
      progress: Math.min(100, (seedsPlanted / 50) * 100),
      total: 50,
      current: seedsPlanted,
      rarity: "Common",
      reward: "200 Farm Coins",
      claimable: seedsPlanted >= 50 && !claimedRewards.includes("seed-planter")
    },
    {
      id: "animal-lover",
      title: "Animal Lover",
      description: "Own 10 animals",
      icon: "🐄",
      progress: Math.min(100, (animals.length / 10) * 100),
      total: 10,
      current: animals.length,
      rarity: "Rare",
      reward: "1,000 Farm Coins",
      claimable: animals.length >= 10 && !claimedRewards.includes("animal-lover")
    },
    {
      id: "wealthy-farmer",
      title: "Wealthy Farmer",
      description: "Earn 10,000 total coins",
      icon: "💰",
      progress: Math.min(100, (totalCoinsEarned / 10000) * 100),
      total: 10000,
      current: totalCoinsEarned,
      rarity: "Epic",
      reward: "5,000 Farm Coins",
      claimable: totalCoinsEarned >= 10000 && !claimedRewards.includes("wealthy-farmer")
    },
    {
      id: "level-up",
      title: "Level Up",
      description: "Reach level 10",
      icon: "⭐",
      progress: Math.min(100, (playerLevel / 10) * 100),
      total: 10,
      current: playerLevel,
      rarity: "Uncommon",
      reward: "750 Farm Coins",
      claimable: playerLevel >= 10 && !claimedRewards.includes("level-up")
    },
    {
      id: "inventory-collector",
      title: "Inventory Collector",
      description: "Have 50 total items in inventory",
      icon: "📦",
      progress: Math.min(100, (farmInventory.totalCrops + farmInventory.totalCraftedItems + farmInventory.totalAnimalProducts) / 50 * 100),
      total: 50,
      current: farmInventory.totalCrops + farmInventory.totalCraftedItems + farmInventory.totalAnimalProducts,
      rarity: "Rare",
      reward: "1,500 Farm Coins",
      claimable: (farmInventory.totalCrops + farmInventory.totalCraftedItems + farmInventory.totalAnimalProducts) >= 50 && !claimedRewards.includes("inventory-collector")
    }
  ]

  const itemsPerPage = 2
  const totalPages = Math.ceil(achievements.length / itemsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentAchievements = achievements.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-500 dark:text-gray-400"
      case "Uncommon":
        return "text-green-500 dark:text-green-400"
      case "Rare":
        return "text-blue-500 dark:text-blue-400"
      case "Epic":
        return "text-purple-500 dark:text-purple-400"
      case "Legendary":
        return "text-yellow-500 dark:text-yellow-400"
      default:
        return "text-gray-500 dark:text-gray-400"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-orange-500"
    if (progress < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const handleClaimReward = (achievement: Achievement) => {
    setRewardPopup({ show: true, achievement })
  }

  const onClaimReward = () => {
    if (rewardPopup.achievement) {
      setClaimedRewards([...claimedRewards, rewardPopup.achievement.id])
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Parse and give the actual reward
      const rewardText = rewardPopup.achievement.reward
      const coinMatch = rewardText.match(/(\d+(?:,\d+)*)\s*Farm Coins/)
      if (coinMatch) {
        const coinAmount = parseInt(coinMatch[1].replace(/,/g, ''))
        addFarmCoins(coinAmount)
      }

      toast({
        title: "Reward Claimed!",
        description: `You've claimed: ${rewardPopup.achievement.reward}`,
        variant: "success",
      })
    }
    setRewardPopup({ show: false, achievement: null })
  }

  // Check for newly completed achievements
  useEffect(() => {
    const newlyCompleted = achievements.filter(achievement =>
      achievement.claimable && !claimedRewards.includes(achievement.id)
    )

    newlyCompleted.forEach(achievement => {
      // Only show notification if this is a new completion (not on initial load)
      if (achievement.current >= achievement.total) {
        toast({
          title: "Achievement Completed!",
          description: `You've completed: ${achievement.title}`,
          variant: "success",
        })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    })
  }, [cropsHarvested, seedsPlanted, totalCoinsEarned, playerLevel, animals.length, farmInventory.totalCrops, farmInventory.totalCraftedItems, farmInventory.totalAnimalProducts])

  return (
    <>
      {showConfetti && <Confetti />}
      {rewardPopup.show && rewardPopup.achievement && (
        <RewardPopup
          title={rewardPopup.achievement.title}
          description={`You've completed: ${rewardPopup.achievement.description}`}
          reward={rewardPopup.achievement.reward}
          icon={rewardPopup.achievement.icon}
          onClaim={onClaimReward}
          onClose={() => setRewardPopup({ show: false, achievement: null })}
        />
      )}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPage}
              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1}/{totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPage}
              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-2xl"
                  >
                    {achievement.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <AnimatedProgress
                        value={achievement.progress}
                        className="h-2 flex-1"
                        barClassName={getProgressColor(achievement.progress)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {achievement.current}/{achievement.total}
                      </span>
                    </div>
                    {achievement.claimable && !claimedRewards.includes(achievement.id) && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimReward(achievement)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        <Gift className="h-3 w-3" />
                        Claim Reward
                      </motion.button>
                    )}
                    {claimedRewards.includes(achievement.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"
                      >
                        <Star className="h-3 w-3 text-yellow-500" />
                        Reward Claimed
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

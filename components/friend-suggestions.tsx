"use client"

import { UserPlus, Users, X, Clock, Zap } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { CardContent } from "./ui/card"
import { CardHeader } from "./ui/card"
import { Avatar } from "./ui/avatar"
import { AvatarImage } from "./ui/avatar"
import { AvatarFallback } from "./ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useToast } from "../hooks/use-toast"
import { ShimmerButton } from "./ui/shimmer-button"
import { useMultisynq } from "../hooks/useMultisynq"
import { Badge } from "./ui/badge"

// Sample friend suggestions data
const friendSuggestionsData = [
  {
    id: 1,
    name: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 92,
    mutualFriends: 5,
  },
  {
    id: 2,
    name: "CropWizard",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 78,
    mutualFriends: 3,
  },
  {
    id: 3,
    name: "NooterTamer",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 65,
    mutualFriends: 8,
  },
  {
    id: 4,
    name: "HarvestKing",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 120,
    mutualFriends: 2,
  },
  {
    id: 5,
    name: "FarmQueen",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 105,
    mutualFriends: 6,
  },
]

export default function FriendSuggestions() {
  const [friendSuggestions, setFriendSuggestions] = useState(friendSuggestionsData)
  const [addedFriends, setAddedFriends] = useState<number[]>([])
  const [dismissedFriends, setDismissedFriends] = useState<number[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const { toast } = useToast()

  // Get real-time users from Multisynq
  const {
    isConnected,
    currentUser,
    users,
    onlineCount
  } = useMultisynq({
    autoConnect: false,
    sessionName: 'monfarm-social-hub'
  })

  // Update recent users when Multisynq users change
  useEffect(() => {
    if (isConnected && users.length > 0) {
      // Filter out current user and create suggestions from recent users
      const recentlyJoined = users
        .filter(user => user.userId !== currentUser?.userId)
        .sort((a, b) => b.joinedAt - a.joinedAt) // Sort by most recent
        .slice(0, 5) // Take top 5 recent users
        .map((user, index) => ({
          id: `recent-${user.userId}`,
          name: user.nickname,
          avatar: "/images/nooter.png",
          level: Math.floor(Math.random() * 50) + 20, // Random level for demo
          mutualFriends: Math.floor(Math.random() * 10),
          isOnline: user.isOnline,
          joinedAt: user.joinedAt,
          isRecent: true
        }))

      setRecentUsers(recentlyJoined)
    }
  }, [users, currentUser, isConnected])

  const handleAddFriend = (id: string | number) => {
    setAddedFriends([...addedFriends, typeof id === 'string' ? parseInt(id.split('-')[1]) || 0 : id])

    // Find the user in either static suggestions or recent users
    const user = [...friendSuggestions, ...recentUsers].find((f) => f.id === id)

    toast({
      title: "Friend Request Sent!",
      description: `You sent a friend request to ${user?.name}!`,
      variant: "default",
    })
  }

  const handleDismiss = (id: string | number) => {
    const numericId = typeof id === 'string' ? parseInt(id.split('-')[1]) || 0 : id
    setDismissedFriends([...dismissedFriends, numericId])
  }

  // Format time for recent users
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return 'Recently'
  }

  // Combine recent users and static suggestions, prioritizing recent users
  const allSuggestions = [...recentUsers, ...friendSuggestions]
  const visibleSuggestions = allSuggestions.filter(
    (friend) => {
      const friendId = typeof friend.id === 'string' ? parseInt(friend.id.split('-')[1]) || 0 : friend.id
      return !addedFriends.includes(friendId) && !dismissedFriends.includes(friendId)
    }
  )

  return (
    <Card className="bg-[#171717] border border-[#333] rounded-none">
      <CardHeader className="pb-3 flex items-center border-b border-[#333]">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Friend Suggestions</h3>
          </div>
          {isConnected && onlineCount > 1 && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{onlineCount} online</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <AnimatePresence>
          {visibleSuggestions.length > 0 ? (
            <motion.div className="space-y-4">
              {visibleSuggestions.slice(0, 3).map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between border border-[#333] p-3 bg-[#111] rounded-none"
                >
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <div className="relative">
                        <Avatar className="border border-[#333]">
                          <AvatarImage src={friend.avatar || "/images/nooter.png"} alt={friend.name} />
                          <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-[#171717] rounded-full"></div>
                        )}
                      </div>
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{friend.name}</span>
                        <span className="text-xs bg-black border border-[#333] px-1.5 py-0.5 text-white">
                          Lvl {friend.level}
                        </span>
                        {friend.isRecent && (
                          <Badge variant="outline" className="text-xs px-1 py-0 border-green-500 text-green-400">
                            <Zap className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        {friend.isRecent ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Joined {formatTimeAgo(friend.joinedAt)}</span>
                          </div>
                        ) : (
                          <span>{friend.mutualFriends} mutual friends</span>
                        )}
                        {friend.isOnline && (
                          <span className="text-green-400">• Online</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      className="h-8 px-2 py-1 text-xs bg-white text-black hover:bg-white/90 rounded-none" 
                      onClick={() => handleAddFriend(friend.id)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none" 
                      onClick={() => handleDismiss(friend.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 text-center text-white/60"
            >
              {isConnected ? (
                <div>
                  <p>No new farmers to suggest right now.</p>
                  <p className="text-sm">Invite friends to join the Social Hub!</p>
                </div>
              ) : (
                <div>
                  <p>Connect your wallet to see recent farmers.</p>
                  <p className="text-sm">Join the live farming community!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="outline"
          className="w-full mt-4 bg-transparent border border-[#333] text-white hover:bg-[#222] rounded-none"
        >
          View All Suggestions
        </Button>
      </CardContent>
    </Card>
  )
} 
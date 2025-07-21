"use client"

import { UserPlus, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useContext } from "react"
import { useToast } from "@/hooks/use-toast"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useConnectedUsers, useMyId, useStateTogether, useFunctionTogether } from 'react-together'
import { useUnifiedNickname } from "../../../hooks/useUnifiedNickname"
import { GameContext } from "../../../context/game-context"

interface FriendSuggestion {
  id: string;
  name: string;
  avatar: string;
  level: number;
  mutualFriends: number;
  isOnline: boolean;
  userId: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromNickname: string;
  toUserId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export default function FriendSuggestions() {
  const [addedFriends, setAddedFriends] = useState<string[]>([])
  const [dismissedFriends, setDismissedFriends] = useState<string[]>([])
  const { toast } = useToast()

  // React Together hooks
  const connectedUsers = useConnectedUsers()
  const myId = useMyId()
  const { nickname: myNickname } = useUnifiedNickname()
  const { playerLevel } = useContext(GameContext)

  // Shared state for friend requests
  const [friendRequests, setFriendRequests] = useStateTogether<FriendRequest[]>('friend-requests', [])

  // Function to broadcast friend request events
  const broadcastFriendEvent = useFunctionTogether('broadcastFriendEvent', (event: any) => {
    console.log('FriendSuggestions: Broadcasting friend event:', event)

    if (event.type === 'friendRequest') {
      setFriendRequests(prev => {
        const existing = prev.find(req =>
          req.fromUserId === event.fromUserId && req.toUserId === event.toUserId
        )
        if (existing) return prev

        return [...prev, event.request]
      })
    }
  })

  // Generate friend suggestions from connected users
  const friendSuggestions: FriendSuggestion[] = connectedUsers
    .filter(user => user.userId !== myId) // Exclude self
    .filter(user => !addedFriends.includes(user.userId)) // Exclude already added
    .filter(user => !dismissedFriends.includes(user.userId)) // Exclude dismissed
    .filter(user => {
      // Exclude users we already sent requests to
      return !friendRequests.some(req =>
        req.fromUserId === myId && req.toUserId === user.userId && req.status === 'pending'
      )
    })
    .map(user => ({
      id: user.userId,
      name: user.nickname || `Farmer${user.userId.slice(-4)}`,
      avatar: "/images/nooter.png",
      level: Math.floor(Math.random() * 50) + 20, // Random level for demo
      mutualFriends: Math.floor(Math.random() * 10),
      isOnline: true,
      userId: user.userId
    }))
    .slice(0, 5) // Limit to 5 suggestions

  const handleAddFriend = (userId: string) => {
    const friend = friendSuggestions.find(f => f.userId === userId)
    if (!friend) return

    const friendRequest: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      fromUserId: myId || 'offline-user',
      fromNickname: myNickname || 'Anonymous Farmer',
      toUserId: userId,
      timestamp: Date.now(),
      status: 'pending'
    }

    try {
      broadcastFriendEvent({
        type: 'friendRequest',
        request: friendRequest,
        fromUserId: myId,
        fromNickname: myNickname
      })

      setAddedFriends([...addedFriends, userId])
      toast({
        title: "Friend Request Sent!",
        description: `You sent a friend request to ${friend.name}!`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to send friend request:', error)
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleDismiss = (userId: string) => {
    setDismissedFriends([...dismissedFriends, userId])
  }

  const visibleSuggestions = friendSuggestions.filter(
    (friend) => !addedFriends.includes(friend.userId) && !dismissedFriends.includes(friend.userId),
  )

  return (
    <div className="noot-card">
      <div className="border-b border-[#333] p-4">
        <h2 className="noot-header flex items-center text-white noot-title">
          <Users className="h-5 w-5 mr-2 text-green-400" />
          Friend Suggestions
        </h2>
        <p className="text-white/60 text-sm noot-text">
          {visibleSuggestions.length} farmers online
        </p>
      </div>
      <div className="p-4">
        <AnimatePresence>
          {visibleSuggestions.length > 0 ? (
            <motion.div className="space-y-3">
              {visibleSuggestions.slice(0, 3).map((friend, index) => (
                <motion.div
                  key={friend.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-[#333] mb-2 bg-[#111] noot-text"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 border border-[#333] flex items-center justify-center mr-3 relative">
                      <div className="w-6 h-6 bg-[#222] border border-[#333] flex items-center justify-center text-xs">
                        👤
                      </div>
                      {friend.isOnline && (
                        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500 border border-[#111]"></span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white noot-text font-medium">{friend.name}</span>
                        <span className="text-xs bg-[#333] text-green-400 px-1.5 py-0.5 border border-[#333]">
                          Lvl {friend.level}
                        </span>
                        {friend.isOnline && (
                          <span className="text-xs text-green-400">Online</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 noot-text">{friend.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAddFriend(friend.userId)}
                      className="px-2 py-1 bg-white text-black hover:bg-white/90 border-0 rounded-none text-xs font-medium noot-text flex items-center"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                    <button
                      onClick={() => handleDismiss(friend.userId)}
                      className="px-2 py-1 bg-[#333] text-white hover:bg-[#444] border border-[#333] rounded-none text-xs font-medium noot-text flex items-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
              <div className="w-12 h-12 border border-[#333] flex items-center justify-center mx-auto mb-2 bg-[#111]">
                <Users className="h-6 w-6 text-white/40" />
              </div>
              <p className="noot-text">No friend suggestions available</p>
              <p className="text-xs noot-text">Connect with other farmers online!</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="w-full mt-4 bg-[#333] text-white hover:bg-[#444] border border-[#333] rounded-none py-2 px-4 noot-text">
          View All Suggestions
        </button>
      </div>
    </div>
  )
}

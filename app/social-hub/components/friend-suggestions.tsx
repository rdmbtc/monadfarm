"use client"

import { UserPlus, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useContext } from "react"
import { useToast } from "@/hooks/use-toast"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useConnectedUsers, useMyId, useStateTogether, useFunctionTogether, useStateTogetherWithPerUserValues, useIsTogether } from 'react-together'
import { useUnifiedNickname } from "../../../hooks/useUnifiedNickname"
import { GameContext } from "../../../context/game-context"
import { QuestSystem } from "../../../components/QuestSystem"

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

  // Share player level with other users via ReactTogether
  const [myPlayerLevel, setMyPlayerLevel, allPlayerLevels] = useStateTogetherWithPerUserValues<number>('player-levels', playerLevel)

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
        console.log('👥 Hidden multisynq loading spinner in friend suggestions', { sessionStatus })
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
  }, [sessionStatus])

  // Update my player level when it changes in GameContext
  useEffect(() => {
    if (playerLevel !== myPlayerLevel) {
      setMyPlayerLevel(playerLevel)
    }
  }, [playerLevel, myPlayerLevel, setMyPlayerLevel])

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
      level: allPlayerLevels[user.userId] || 1, // Use real player level from ReactTogether
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
    <>
      {/* Friend Suggestions Card with Quest System Design */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Friend Suggestions</h2>
              <p className="text-white/60 text-sm">Connect with fellow farmers</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AnimatePresence>
            {visibleSuggestions.length > 0 ? (
            <motion.div className="space-y-4">
              {visibleSuggestions.slice(0, 3).map((friend, index) => (
                <motion.div
                  key={friend.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.avatar || "/images/logo mark/Monad Logo - Default - Logo Mark.png"} alt={friend.name} />
                          <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                        )}
                      </div>
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{friend.name}</span>
                        <span className="text-xs bg-gradient-to-r from-green-500 to-green-400 text-white px-1.5 py-0.5 rounded">
                          Lvl {friend.level}
                        </span>
                        {friend.isOnline && (
                          <span className="text-xs text-green-400">Online</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60">{friend.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <ShimmerButton className="h-8 px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => handleAddFriend(friend.userId)}>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </ShimmerButton>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => handleDismiss(friend.userId)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
          

              <div className="text-center py-2">
                <p className="text-xs text-white/40">Check back later for more friend suggestions!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          <Button
            variant="ghost"
            className="w-full mt-4 text-white/70 hover:text-white hover:bg-white/10 border border-[#333]/50"
          >
            View All Suggestions
          </Button>
        </div>
      </div>

      {/* Quest System Section */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Active Quests</h2>
              <p className="text-white/60 text-sm">Complete quests to earn rewards</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <QuestSystem compact={true} showTitle={false} />
        </div>
      </div>
    </>
  )
}

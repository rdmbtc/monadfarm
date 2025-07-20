"use client"

import { useState, useEffect } from "react"
import { Bell, ArrowRightLeft, UserPlus, Check, X } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { useStateTogether, useMyId, useFunctionTogether } from 'react-together'
import { useUnifiedNickname } from '../hooks/useUnifiedNickname'
import toast from 'react-hot-toast'

interface Notification {
  id: string;
  type: 'trade' | 'friend_request' | 'friend_accepted' | 'general';
  title: string;
  message: string;
  timestamp: number;
  unread: boolean;
  data?: any; // Additional data for specific notification types
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromNickname: string;
  toUserId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export function NotificationDropdown() {
  const myId = useMyId()
  const { nickname: myNickname } = useUnifiedNickname()

  // Shared state for notifications
  const [notifications, setNotifications] = useStateTogether<Notification[]>('notifications', [])
  const [friendRequests, setFriendRequests] = useStateTogether<FriendRequest[]>('friend-requests', [])
  const [tradeOffers] = useStateTogether('trade-offers', [])

  // Local state for UI
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])

  // Function to broadcast notification events
  const broadcastNotificationEvent = useFunctionTogether('broadcastNotificationEvent', (event: any) => {
    console.log('NotificationDropdown: Broadcasting notification event:', event)

    if (event.type === 'notification') {
      setNotifications(prev => {
        const existing = prev.find(n => n.id === event.notification.id)
        if (existing) return prev
        return [event.notification, ...prev].slice(0, 50) // Keep only latest 50
      })
    }
  })

  // Listen for trade and friend events to create notifications
  useEffect(() => {
    // Listen for trade events
    const handleTradeEvents = () => {
      // Check for new trade offers targeting this user
      const myTrades = Array.isArray(tradeOffers) ? tradeOffers.filter((trade: any) =>
        trade.creatorId !== myId && trade.status === 'active'
      ) : []

      // Check for accepted/declined trades created by this user
      const myCreatedTrades = Array.isArray(tradeOffers) ? tradeOffers.filter((trade: any) =>
        trade.creatorId === myId && (trade.status === 'accepted' || trade.status === 'declined')
      ) : []

      // Create notifications for trade status changes
      myCreatedTrades.forEach((trade: any) => {
        const notificationId = `trade-${trade.id}-${trade.status}`
        const existingNotification = notifications.find(n => n.id === notificationId)

        if (!existingNotification) {
          const notification: Notification = {
            id: notificationId,
            type: 'trade',
            title: trade.status === 'accepted' ? 'Trade Accepted!' : 'Trade Declined',
            message: trade.status === 'accepted'
              ? `${trade.acceptedByNickname} accepted your trade offer`
              : `Your trade offer was declined`,
            timestamp: Date.now(),
            unread: true,
            data: { tradeId: trade.id, status: trade.status }
          }

          broadcastNotificationEvent({
            type: 'notification',
            notification,
            targetUserId: myId
          })
        }
      })
    }

    // Listen for friend request events
    const handleFriendEvents = () => {
      // Check for friend requests targeting this user
      const myFriendRequests = Array.isArray(friendRequests) ? friendRequests.filter((req: FriendRequest) =>
        req.toUserId === myId && req.status === 'pending'
      ) : []

      myFriendRequests.forEach((request: FriendRequest) => {
        const notificationId = `friend-request-${request.id}`
        const existingNotification = notifications.find(n => n.id === notificationId)

        if (!existingNotification) {
          const notification: Notification = {
            id: notificationId,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${request.fromNickname} wants to be your friend`,
            timestamp: request.timestamp,
            unread: true,
            data: { requestId: request.id, fromUserId: request.fromUserId }
          }

          broadcastNotificationEvent({
            type: 'notification',
            notification,
            targetUserId: myId
          })
        }
      })
    }

    handleTradeEvents()
    handleFriendEvents()
  }, [tradeOffers, friendRequests, notifications, myId, broadcastNotificationEvent])

  // Filter notifications for current user and combine with local notifications
  const userNotifications = [
    ...notifications.filter(n => !n.data?.targetUserId || n.data.targetUserId === myId),
    ...localNotifications
  ].sort((a, b) => b.timestamp - a.timestamp)

  const unreadCount = userNotifications.filter(n => n.unread).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    )
    setLocalNotifications(prev =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map((notification) => ({ ...notification, unread: false }))
    )
    setLocalNotifications(prev =>
      prev.map((notification) => ({ ...notification, unread: false }))
    )
  }

  // Helper function to format time
  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Handle friend request actions
  const handleFriendRequest = (requestId: string, action: 'accept' | 'decline') => {
    const request = friendRequests.find(req => req.id === requestId)
    if (!request) return

    setFriendRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: action === 'accept' ? 'accepted' : 'declined' } : req
      )
    )

    // Create notification for the requester
    if (action === 'accept') {
      const notification: Notification = {
        id: `friend-accepted-${requestId}`,
        type: 'friend_accepted',
        title: 'Friend Request Accepted!',
        message: `${myNickname} accepted your friend request`,
        timestamp: Date.now(),
        unread: true,
        data: { targetUserId: request.fromUserId }
      }

      broadcastNotificationEvent({
        type: 'notification',
        notification,
        targetUserId: request.fromUserId
      })
    }

    toast.success(action === 'accept' ? 'Friend request accepted!' : 'Friend request declined')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline" 
          size="icon"
          className="relative bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white rounded-none w-9 h-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-80 bg-[#171717] border border-[#333] text-white p-0 rounded-none"
      >
        <div className="flex items-center justify-between p-3 border-b border-[#333]">
          <DropdownMenuLabel className="font-bold">Notifications</DropdownMenuLabel>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs text-white/70 hover:text-white hover:bg-[#222] h-7 rounded-none"
          >
            Mark all as read
          </Button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto py-1">
          {userNotifications.length === 0 ? (
            <div className="p-4 text-center text-white/70">
              No notifications
            </div>
          ) : (
            userNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 focus:bg-[#222] hover:bg-[#222] cursor-pointer rounded-none border-l-2",
                  notification.unread ? "border-l-white" : "border-l-transparent"
                )}
                onClick={() => notification.type !== 'friend_request' && markAsRead(notification.id)}
              >
                <div className="w-full flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {notification.type === 'trade' && <ArrowRightLeft className="h-4 w-4 text-green-400" />}
                    {notification.type === 'friend_request' && <UserPlus className="h-4 w-4 text-blue-400" />}
                    {notification.type === 'friend_accepted' && <Check className="h-4 w-4 text-green-400" />}
                    <span className={cn(
                      "font-medium",
                      notification.unread ? "text-white" : "text-white/80"
                    )}>
                      {notification.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-white/70 w-full">
                  {notification.message}
                </p>

                {/* Friend request action buttons */}
                {notification.type === 'friend_request' && (
                  <div className="flex gap-2 w-full mt-1">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFriendRequest(notification.data.requestId, 'accept')
                        markAsRead(notification.id)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs flex-1"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFriendRequest(notification.data.requestId, 'decline')
                        markAsRead(notification.id)
                      }}
                      className="border-red-600 text-red-400 hover:bg-red-600/10 h-7 text-xs flex-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-[#333]" />
        <DropdownMenuItem className="p-2 text-center font-medium text-white/80 hover:bg-[#222] focus:bg-[#222] rounded-none cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
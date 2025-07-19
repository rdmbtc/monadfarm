"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Users, Settings, Smile, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useReactTogether } from '../hooks/useReactTogether'
import toast from 'react-hot-toast'

interface ReactTogetherChatProps {
  className?: string
  sessionName?: string
}

export function ReactTogetherChat({
  className = "",
  sessionName = "monfarm-chat"
}: ReactTogetherChatProps) {
  const [messageInput, setMessageInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Multisynq integration
  const {
    isConnected,
    isLoading,
    error,
    currentUser,
    users,
    onlineCount,
    messages,
    sendMessage,
    setNickname
  } = useMultisynq({
    autoConnect: true,
    sessionName: sessionName
  })

  // Farm-themed quick messages
  const quickMessages = [
    "🌱 Just planted some crops!",
    "🚜 Time to harvest!",
    "🐄 My animals are happy today",
    "⭐ Great farming day!",
    "🌾 Crops are growing well",
    "🏡 Farm life is the best!"
  ]

  // Farm emojis for chat
  const farmEmojis = ['🌱', '🌾', '🚜', '🐄', '🐷', '🐔', '🌽', '🥕', '🍅', '🌻', '🏡', '⭐', '💰', '🎯']

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Enhanced message sending
  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected) {
      sendMessage(messageInput.trim())
      setMessageInput('')
      setShowEmojiPicker(false)
      setShowQuickMessages(false)
      toast.success('Message sent! 💬', { duration: 1000 })
    }
  }

  // Send quick message
  const sendQuickMessage = (quickMsg: string) => {
    if (isConnected) {
      sendMessage(quickMsg)
      setShowQuickMessages(false)
      toast.success('Quick message sent! 🚀', { duration: 1000 })
    }
  }

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Get user nickname
  const getUserNickname = (userId: string) => {
    const user = users.find(u => u.userId === userId)
    return user?.nickname || `User ${userId.slice(0, 6)}`
  }

  // Show loading state during SSR
  if (!isClient) {
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-white/60">Loading chat...</div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-white/60">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Chat Unavailable</h3>
            <p>Connect your wallet to join the farming community chat!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
      <CardHeader className="pb-3 border-b border-[#333]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Farmers Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-400">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              {onlineCount} online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages area */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {messages.map((message) => {
              const isMyMessage = message.senderId === currentUser?.userId
              const senderNickname = getUserNickname(message.senderId)
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 border border-[#333]">
                    <AvatarImage src="/images/nooter.png" alt={senderNickname} />
                    <AvatarFallback className="text-xs">
                      {senderNickname.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-xs ${isMyMessage ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/60">
                        {isMyMessage ? 'You' : senderNickname}
                      </span>
                      <span className="text-xs text-white/40">
                        {formatTime(message.sentAt)}
                      </span>
                    </div>
                    
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isMyMessage
                          ? 'bg-white text-black ml-auto'
                          : 'bg-[#222] text-white border border-[#333]'
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          {messages.length === 0 && (
            <div className="text-center text-white/60 py-8">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Chat input */}
        <div className="p-4 border-t border-[#333] space-y-3">
          {/* Quick messages */}
          {showQuickMessages && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {quickMessages.map((msg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendQuickMessage(msg)}
                  className="bg-[#222] border-[#333] text-white hover:bg-[#333] text-xs justify-start"
                >
                  {msg}
                </Button>
              ))}
            </motion.div>
          )}

          {/* Emoji picker */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#222] border border-[#333] p-3 rounded-none"
            >
              <div className="grid grid-cols-7 gap-2">
                {farmEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="p-2 hover:bg-[#333] rounded-none text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input area */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickMessages(!showQuickMessages)}
                className="bg-[#222] border-[#333] text-white hover:bg-[#333]"
              >
                <Zap className="h-4 w-4 mr-1" />
                Quick
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="bg-[#222] border-[#333] text-white hover:bg-[#333]"
              >
                <Smile className="h-4 w-4 mr-1" />
                Emoji
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Chat with fellow farmers... 🌱"
                className="bg-[#222] border-[#333] text-white rounded-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
                maxLength={500}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !isConnected}
                className="bg-white text-black hover:bg-white/90 rounded-none"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center text-xs text-white/60">
              <span>
                {isConnected ? `${onlineCount} farmers online` : 'Disconnected'}
              </span>
              <span>{messageInput.length}/500</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

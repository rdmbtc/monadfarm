"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Activity, Smile, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useMultisynq } from '../hooks/useMultisynq'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface MultisynqSocialFeedProps {
  className?: string
  sessionName?: string
  showUserPresence?: boolean
}

export function MultisynqSocialFeed({
  className = "",
  sessionName = "monfarm-social-feed",
  showUserPresence = false
}: MultisynqSocialFeedProps) {
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Multisynq integration
  const {
    isConnected,
    currentUser,
    users,
    onlineCount,
    posts,
    createPost,
    likePost,
    setNickname,
    allNicknames
  } = useMultisynq({
    autoConnect: true,
    sessionName: `${sessionName}-chat`
  })

  // Farm emojis
  const farmEmojis = ['🌱', '🌾', '🚜', '🐄', '🐷', '🐔', '🌽', '🥕', '🍅', '🌻', '🏡', '⭐']

  // Enhanced post creation
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() || !isConnected || isPosting) return
    
    setIsPosting(true)
    
    try {
      // Add farm-related tags automatically
      const farmTags = ['farm', 'social']
      if (newPostContent.toLowerCase().includes('crop')) farmTags.push('crops')
      if (newPostContent.toLowerCase().includes('animal')) farmTags.push('animals')
      if (newPostContent.toLowerCase().includes('harvest')) farmTags.push('harvest')
      
      createPost(newPostContent.trim(), undefined, farmTags)
      setNewPostContent('')
      
      toast.success('🌱 Post shared with the farming community!')
    } catch (error) {
      toast.error('Failed to share post. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  // Add emoji to post
  const addEmoji = (emoji: string) => {
    setNewPostContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Enhanced like functionality
  const handleLikePost = (postId: string) => {
    likePost(postId)
    toast.success('❤️ Liked!', { duration: 1000 })
  }

  // Format time
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

  // Get user nickname
  const getUserNickname = (userId: string) => {
    return allNicknames[userId] || `Farmer ${userId.slice(0, 6)}`
  }

  // Show loading state during SSR
  if (!isClient) {
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-white/60">Loading social feed...</div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className={`bg-[#171717] border border-[#333] rounded-none ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-white/60">
            <Activity className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Social Feed Unavailable</h3>
            <p>Connect your wallet to see posts from the farming community!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User presence indicator */}
      {showUserPresence && (
        <Card className="bg-[#171717] border border-[#333] rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white">Connected to Social Hub</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>{onlineCount} farmers online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Post creation area */}
      <Card className="bg-[#171717] border border-[#333] rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Share with the farming community
          </CardTitle>
          <p className="text-white/60 text-sm">What's happening on your farm today?</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 border border-[#333]">
                <AvatarImage src="/images/nooter.png" alt="Your Avatar" />
                <AvatarFallback>{currentUser?.nickname?.substring(0, 2) || 'YN'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your farming adventures, ask questions, or celebrate your harvest! 🌱"
                  className="w-full bg-[#111] border border-[#333] text-white placeholder:text-white/50 rounded-none p-3 min-h-[100px] resize-none focus:outline-none focus:border-white/30"
                  maxLength={500}
                  disabled={!isConnected || isPosting}
                />
                
                {/* Emoji picker */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none"
                    >
                      <Smile className="h-4 w-4 mr-1" />
                      Emoji
                    </Button>
                    
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute z-10 bg-[#111] border border-[#333] p-2 rounded-none shadow-lg"
                      >
                        <div className="grid grid-cols-6 gap-1">
                          {farmEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="p-2 hover:bg-[#222] rounded-none text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>{newPostContent.length}/500</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none"
                >
                  📷 Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none"
                >
                  🎮 Game Update
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!newPostContent.trim() || !isConnected || isPosting}
                className="bg-white text-black hover:bg-white/90 rounded-none"
              >
                {isPosting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"
                  />
                ) : null}
                {isPosting ? 'Sharing...' : 'Share Post'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {posts.map((post) => {
            const isMyPost = post.userId === currentUser?.userId
            const authorNickname = getUserNickname(post.userId)
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="bg-[#171717] border border-[#333] rounded-none">
                  {/* Post header */}
                  <div className="p-4 flex justify-between items-center border-b border-[#333]">
                    <div className="flex items-center gap-3">
                      <Avatar className="border border-[#333]">
                        <AvatarImage src="/images/nooter.png" alt={authorNickname} />
                        <AvatarFallback>{authorNickname.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{authorNickname}</span>
                          {isMyPost && (
                            <Badge variant="outline" className="text-xs px-1 py-0 border-[#333] text-white/70">You</Badge>
                          )}
                          {post.tags?.includes('harvest') && <span className="text-xs">🌾</span>}
                          {post.tags?.includes('animals') && <span className="text-xs">🐄</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span>{formatTime(post.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post content */}
                  <div className="p-4">
                    <p className="text-white whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Post actions */}
                  <div className="px-4 py-2 border-t border-[#333] flex justify-between">
                    <div className="flex items-center gap-4">
                      <motion.button 
                        onClick={() => handleLikePost(post.id)} 
                        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                        disabled={!isConnected}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Heart 
                          className={cn(
                            "h-5 w-5 transition-all duration-200", 
                            post.likedBy?.has(currentUser?.userId || '') ? "fill-red-500 text-red-500 scale-110" : ""
                          )} 
                        />
                        <span>{post.likes || 0}</span>
                      </motion.button>
                      
                      <motion.button 
                        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>Comment</span>
                      </motion.button>
                      
                      <motion.button 
                        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Share2 className="h-5 w-5" />
                        <span>Share</span>
                      </motion.button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {posts.length === 0 && (
          <Card className="bg-[#171717] border border-[#333] rounded-none">
            <CardContent className="p-8 text-center">
              <div className="text-white/60">
                <Activity className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Posts Yet</h3>
                <p>Be the first to share something with the farming community!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

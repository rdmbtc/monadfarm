"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Heart, 
  Send,
  Users,
  Plus,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Script from 'next/script';

// Declare Multisynq global
declare global {
  interface Window {
    Multisynq: any;
    farmSocialSession: any;
  }
}

interface SocialPost {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  tags: string[];
}

export function SimpleSocialFeed({ className }: { className?: string }) {
  // Local state
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [postContent, setPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState<{userId: string, nickname: string} | null>(null)
  const [multisynqLoaded, setMultisynqLoaded] = useState(false)

  // Initialize when Multisynq loads
  const initializeMultisynq = useCallback(() => {
    if (typeof window === 'undefined' || !window.Multisynq) return

    console.log('Initializing Multisynq...')
    
    // Generate user info
    const userId = localStorage.getItem('farm-user-id') || `user_${Date.now()}`
    const nickname = localStorage.getItem('farm-nickname') || `Farmer${userId.slice(-4)}`
    
    localStorage.setItem('farm-user-id', userId)
    localStorage.setItem('farm-nickname', nickname)
    
    setCurrentUser({ userId, nickname })

    // Define the model class (following your vanilla example)
    class SocialFeedModel extends window.Multisynq.Model {
      init() {
        this.posts = []
        this.postIdCounter = 0
        this.subscribe(this.sessionId, "createPost", this.handleCreatePost)
        this.subscribe(this.sessionId, "likePost", this.handleLikePost)
      }
      
      handleCreatePost(data) {
        this.postIdCounter += 1
        const post = {
          id: `post_${this.postIdCounter}_${Date.now()}`,
          userId: data.userId,
          nickname: data.nickname,
          content: data.content,
          timestamp: Date.now(),
          likes: 0,
          likedBy: [],
          tags: data.tags
        }
        
        this.posts.unshift(post)
        if (this.posts.length > 50) {
          this.posts = this.posts.slice(0, 50)
        }
        
        this.publish(this.sessionId, "postsChanged", this.posts)
      }
      
      handleLikePost(data) {
        const post = this.posts.find(p => p.id === data.postId)
        if (!post) return

        const hasLiked = post.likedBy.includes(data.userId)
        
        if (hasLiked) {
          post.likedBy = post.likedBy.filter(id => id !== data.userId)
          post.likes = Math.max(0, post.likes - 1)
        } else {
          post.likedBy.push(data.userId)
          post.likes += 1
        }
        
        this.publish(this.sessionId, "postsChanged", this.posts)
      }
    }

    // Define the view class (following your vanilla example)
    class SocialFeedView extends window.Multisynq.View {
      constructor(model) {
        super(model)
        this.subscribe(this.sessionId, "postsChanged", this.updatePosts)
        this.updatePosts(model.posts)
      }
      
      updatePosts(posts) {
        setPosts([...posts])
      }
    }

    // Join session (following your vanilla example)
    window.Multisynq.Session.join({
      apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "demo-key",
      appId: "monfarm.social.feed",
      model: SocialFeedModel,
      view: SocialFeedView,
      name: "monfarm-social-feed-session",
      password: "public"
    }).then(session => {
      console.log("Joined session:", session.id)
      setIsConnected(true)
      toast.success('Connected to social feed! 🌾')
      
      // Store session globally for publishing events
      window.farmSocialSession = session
    }).catch(error => {
      console.error('Failed to join session:', error)
      toast.error('Failed to connect to social feed')
    })
  }, [])

  // Handle creating a new post
  const handleCreatePost = useCallback(async () => {
    if (!postContent.trim() || !currentUser || isPosting || !window.farmSocialSession) return

    setIsPosting(true)
    try {
      window.farmSocialSession.publish(window.farmSocialSession.id, "createPost", {
        userId: currentUser.userId,
        nickname: currentUser.nickname,
        content: postContent.trim(),
        tags: ['farming', 'monfarm']
      })

      setPostContent('')
      setShowCreatePost(false)
      toast.success('Post created! 🌾')
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }, [postContent, currentUser, isPosting])

  // Handle liking a post
  const handleLikePost = useCallback((postId: string) => {
    if (!currentUser || !window.farmSocialSession) return

    window.farmSocialSession.publish(window.farmSocialSession.id, "likePost", {
      userId: currentUser.userId,
      postId: postId
    })
  }, [currentUser])

  // Handle enter key in textarea
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleCreatePost()
    }
  }, [handleCreatePost])

  return (
    <>
      {/* Load Multisynq script */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js"
        onLoad={() => {
          setMultisynqLoaded(true)
          setTimeout(initializeMultisynq, 100) // Small delay to ensure everything is loaded
        }}
        onError={(e) => {
          console.error('Failed to load Multisynq:', e)
          toast.error('Failed to load Multisynq')
        }}
      />

      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Sparkles className="h-5 w-5" />
              Farm Social Feed
              <div className="flex items-center gap-1 ml-auto">
                <Users className="h-4 w-4" />
                <span className="text-sm">1</span>
                <div className={cn(
                  "w-2 h-2 rounded-full ml-2",
                  isConnected ? "bg-green-500" : multisynqLoaded ? "bg-yellow-500" : "bg-red-500"
                )} />
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Create Post Section */}
            <div className="space-y-3">
              {!showCreatePost ? (
                <Button
                  onClick={() => setShowCreatePost(true)}
                  disabled={!isConnected}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Share your farming experience
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-600 text-white text-xs">
                        {currentUser?.nickname?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300">{currentUser?.nickname || 'Anonymous Farmer'}</span>
                  </div>
                  
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What's happening on your farm? Share your harvest, discoveries, or farming tips..."
                    className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                    maxLength={1000}
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {postContent.length}/1000 • Ctrl+Enter to post
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreatePost(false)
                          setPostContent('')
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreatePost}
                        disabled={!postContent.trim() || isPosting}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isPosting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Post
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Posts Feed */}
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                <AnimatePresence>
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {post.nickname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{post.nickname}</span>
                            <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400">
                              Online
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(post.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Post Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikePost(post.id)}
                          disabled={!isConnected}
                          className={cn(
                            "text-gray-400 hover:text-red-400 hover:bg-red-400/10",
                            post.likedBy.includes(currentUser?.userId || '') && "text-red-400 bg-red-400/10"
                          )}
                        >
                          <Heart 
                            className={cn(
                              "h-4 w-4 mr-1",
                              post.likedBy.includes(currentUser?.userId || '') && "fill-current"
                            )} 
                          />
                          {post.likes}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No posts yet!</p>
                    <p className="text-sm text-gray-600">
                      Be the first to share your farming experience
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Connection Status */}
            {!isConnected && (
              <div className="text-center py-4 text-yellow-500 text-sm">
                {multisynqLoaded ? 'Connecting to farm social network...' : 'Loading Multisynq...'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

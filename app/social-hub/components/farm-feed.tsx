"use client"

import { useState, useEffect } from "react"
import { Heart, MessageCircle, Share2, MoreHorizontal, Award, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { CardContent } from "@/components/ui/card"
import { CardFooter } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedBadge } from "@/components/ui/animated-badge"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Confetti } from "@/components/ui/confetti"
import { useStateTogether, useFunctionTogether, useConnectedUsers, useMyId } from 'react-together'

// Sample feed data
const feedItems = [
  {
    id: 1,
    user: {
      name: "CropMaster99",
      avatar: "/images/nooter.png",
      level: 78,
      isPremium: true,
    },
    time: "2 hours ago",
    content: "Just completed the Ancient Ruins quest! Found some rare artifacts and earned 500 XP. Who wants to join me for the Forest Expedition next?",
    image: "/images/guide/Ancient Ruins quest.jpg",
    likes: 42,
    comments: 8,
    shares: 3,
    isNew: true,
  },
  {
    id: 2,
    user: {
      name: "FarmQueen",
      avatar: "/images/nooter.png",
      level: 65,
      isPremium: false,
    },
    time: "5 hours ago",
    content: "Trading rare items at the marketplace tomorrow. Looking for enchanted boots and magical scrolls. I have plenty of healing potions to offer!",
    image: "",
    likes: 87,
    comments: 23,
    shares: 12,
    isNew: true,
  },
  {
    id: 3,
    user: {
      name: "NooterLover",
      avatar: "/images/nooter.png",
      level: 31,
      isPremium: false,
    },
    time: "Yesterday",
    content: "Reached level 50 today! The journey has been incredible. Thanks to everyone who helped along the way. Special shoutout to the Noot Guild!",
    image: "/images/guide/level 50 today.jpg",
    likes: 156,
    comments: 42,
    shares: 18,
    isNew: false,
  },
]

export default function FarmFeed() {
  const [postText, setPostText] = useState("")
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [posts, setPosts] = useState(feedItems)
  const { toast } = useToast()

  // React Together integration
  const myId = useMyId()
  const connectedUsers = useConnectedUsers()
  const [multisynqPosts, setMultisynqPosts] = useStateTogether<Array<{
    id: string;
    userId: string;
    nickname: string;
    content: string;
    timestamp: number;
    likes: number;
    likedBy: string[];
  }>>('social-posts', [])
  // Use useFunctionTogether for social events
  const broadcastSocialEvent = useFunctionTogether('broadcastSocialEvent', (event: any) => {
    if (event.type === 'newPost') {
      setMultisynqPosts(prev => {
        const exists = prev.some(p => p.id === event.post.id)
        if (exists) return prev
        return [event.post, ...prev].slice(0, 50) // Keep last 50 posts
      })
    } else if (event.type === 'likePost') {
      setMultisynqPosts(prev => prev.map(post =>
        post.id === event.postId
          ? { ...post, likes: post.likes + 1, likedBy: [...post.likedBy, event.userId] }
          : post
      ))
    }
  })

  // Derived state
  const isConnected = !!myId
  const isLoading = false
  const error = null
  const currentUser = myId ? {
    userId: myId,
    nickname: `User${myId.slice(-4)}`,
    isOnline: true
  } : null
  const users = connectedUsers.map(userId => ({
    userId,
    nickname: `User${userId.slice(-4)}`,
    isOnline: true
  }))
  const onlineCount = connectedUsers.length

  // Social events are now handled by broadcastSocialEvent function above

  // Create post function
  const createPost = (content: string) => {
    if (!content.trim() || !currentUser) return

    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.userId,
      nickname: currentUser.nickname,
      content: content.trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: []
    }

    sendSocialEvent({
      type: 'postCreated',
      post
    })
  }

  // Like post function
  const likePost = (postId: string) => {
    if (!myId) return

    const post = multisynqPosts.find(p => p.id === postId)
    if (!post) return

    const newLikedBy = [...post.likedBy]
    const likedIndex = newLikedBy.indexOf(myId)

    if (likedIndex > -1) {
      newLikedBy.splice(likedIndex, 1)
    } else {
      newLikedBy.push(myId)
    }

    sendSocialEvent({
      type: 'postLiked',
      postId,
      likes: newLikedBy.length,
      likedBy: newLikedBy
    })
  }

  const connect = () => {}

  const handleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter((id) => id !== postId))
    } else {
      setLikedPosts([...likedPosts, postId])

      // Try to like via Multisynq if connected
      if (isConnected && likePost) {
        likePost(postId.toString())
      }

      // Show confetti for the first like
      if (likedPosts.length === 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }

      toast({
        title: "Post liked!",
        description: "Keep spreading positivity in the farm community!",
        variant: "default",
      })
    }
  }

  const handlePost = async () => {
    if (postText.trim()) {
      try {
        // Use Multisynq createPost if connected, otherwise fallback to local
        if (isConnected && createPost) {
          createPost(postText.trim(), "", ["farm", "social"])
        } else {
          // Fallback to local posting
          const newPost = {
            id: Date.now(),
            user: {
              name: currentUser?.nickname || "FarmerJoe123",
              avatar: "/images/nooter.png",
              level: 42,
              isPremium: false,
            },
            time: "Just now",
            content: postText,
            image: "",
            likes: 0,
            comments: 0,
            shares: 0,
            isNew: true,
          }
          setPosts([newPost, ...posts])
        }

        setPostText("")
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)

        toast({
          title: "Post shared!",
          description: "Your farm update has been shared with the community!",
          variant: "default",
        })
      } catch (error) {
        console.error('Error creating post:', error)
        toast({
          title: "Error",
          description: "Failed to share your post. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Merge Multisynq posts with local posts
  useEffect(() => {
    if (multisynqPosts && multisynqPosts.length > 0) {
      // Convert Multisynq posts to local format
      const convertedPosts = multisynqPosts.map(post => ({
        id: parseInt(post.id) || Date.now(), // Convert string ID to number
        user: {
          name: post.nickname || post.userId,
          avatar: "/images/nooter.png",
          level: 42,
          isPremium: false,
        },
        time: new Date(post.timestamp).toLocaleString(),
        content: post.content,
        image: post.media || "",
        likes: post.likes || 0,
        comments: 0,
        shares: 0,
        isNew: true,
      }))

      // Merge with existing local posts, avoiding duplicates
      setPosts(prevPosts => {
        const existingIds = new Set(prevPosts.map(p => p.id))
        const newPosts = convertedPosts.filter(p => !existingIds.has(p.id))
        return [...newPosts, ...prevPosts]
      })
    }
  }, [multisynqPosts])

  // Mark posts as not new after they've been viewed
  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(
        posts.map((post) => ({
          ...post,
          isNew: false,
        })),
      )
    }, 5000)

    return () => clearTimeout(timer)
  }, [posts])

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}

      {/* Online Users Indicator */}
      <AnimatedCard>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-green-500" />
            <span>
              {isConnected ? (
                <>
                  <span className="text-green-500 font-medium">{onlineCount}</span> farmers online
                  {error && <span className="text-red-500 ml-2">• Connection issues</span>}
                </>
              ) : (
                <span className="text-yellow-500">Connecting to farm community...</span>
              )}
            </span>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Create Post */}
      <AnimatedCard>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Share with other farmers</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src="/images/nooter.png" alt="Your avatar" />
              <AvatarFallback>YA</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's happening on your farm?"
              className="resize-none"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              📷 Photo
            </Button>
            <Button variant="outline" size="sm">
              🎮 Game Update
            </Button>
          </div>
          <ShimmerButton disabled={!postText.trim()} onClick={handlePost}>
            Post
          </ShimmerButton>
        </CardFooter>
      </AnimatedCard>

      {/* Feed Items */}
      {posts.map((item, index) => (
        <AnimatedCard key={item.id} delay={index}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Avatar className="border-2 border-primary/20">
                    <AvatarImage src={item.user.avatar || "/images/logo mark/Monad Logo - Default - Logo Mark.png"} alt={item.user.name} />
                    <AvatarFallback>{item.user.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.user.name}</span>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="flex items-center gap-1"
                    >
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                        Lvl {item.user.level}
                      </span>
                      {item.user.isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-600 px-2 py-0.5 text-xs font-medium text-black">
                          <Award className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                      {item.isNew && <AnimatedBadge variant="new">New!</AnimatedBadge>}
                    </motion.div>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Save Post</DropdownMenuItem>
                  <DropdownMenuItem>Report</DropdownMenuItem>
                  <DropdownMenuItem>Hide Posts from {item.user.name}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="mb-3">{item.content}</p>
            {item.image && (
              <motion.div whileHover={{ scale: 1.01 }} className="rounded-lg overflow-hidden bg-muted">
                <img src={item.image} alt="Post content" className="w-full h-auto object-cover" />
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-3">
            <div className="w-full flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${likedPosts.includes(item.id) ? "text-red-500" : ""}`}
                onClick={() => handleLike(item.id)}
              >
                <AnimatePresence mode="wait">
                  {likedPosts.includes(item.id) ? (
                    <motion.div
                      key="filled"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="outline"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Heart className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {likedPosts.includes(item.id) ? (
                    <motion.span
                      key="increased"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="font-medium"
                    >
                      {item.likes + 1}
                    </motion.span>
                  ) : (
                    <motion.span key="normal">{item.likes}</motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageCircle className="h-5 w-5" />
                <span>{item.comments}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share2 className="h-5 w-5" />
                <span>{item.shares}</span>
              </Button>
            </div>
          </CardFooter>
        </AnimatedCard>
      ))}
    </div>
  )
}

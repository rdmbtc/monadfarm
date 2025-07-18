"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  useChat, 
  useConnectedUsers, 
  useNicknames, 
  useIsTogether,
  useStateTogether,
  useMyId
} from 'react-together'

export interface SocialPost {
  id: string
  userId: string
  nickname: string
  content: string
  timestamp: number
  likes: number
  likedBy: Set<string>
  tags?: string[]
  media?: string
}

export interface UseReactTogetherOptions {
  autoConnect?: boolean
  sessionName?: string
  chatKey?: string
}

export interface UseReactTogetherReturn {
  // Connection state
  isConnected: boolean
  currentUser: { userId: string; nickname: string } | null
  users: Array<{ userId: string; nickname: string; isOnline: boolean }>
  onlineCount: number
  
  // Chat functionality
  messages: Array<{
    id: number
    senderId: string
    message: string
    sentAt: number
  }>
  sendMessage: (message: string) => void
  
  // Social functionality
  posts: SocialPost[]
  createPost: (content: string, media?: string, tags?: string[]) => void
  likePost: (postId: string) => void
  
  // User management
  setNickname: (nickname: string) => void
  allNicknames: Record<string, string>
}

export function useReactTogether(options: UseReactTogetherOptions = {}): UseReactTogetherReturn {
  const { chatKey = 'monfarm-chat' } = options
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Default values for SSR
  const defaultReturn: UseReactTogetherReturn = {
    isConnected: false,
    currentUser: null,
    users: [],
    onlineCount: 0,
    messages: [],
    sendMessage: () => {},
    posts: [],
    createPost: () => {},
    likePost: () => {},
    setNickname: () => {},
    allNicknames: {}
  }

  // Only use React Together hooks on client side
  if (!isClient) {
    return defaultReturn
  }

  // Core React Together hooks (only on client side)
  const isConnected = useIsTogether()
  const myId = useMyId()
  const connectedUsers = useConnectedUsers()
  const [myNickname, setMyNickname, allNicknames] = useNicknames()
  const { messages, sendMessage } = useChat(chatKey)

  // Social posts state using useStateTogether for real-time sync
  const [posts, setPosts] = useStateTogether<SocialPost[]>('social-posts', [])
  
  // Derived state
  const currentUser = myId ? { userId: myId, nickname: myNickname } : null
  const users = connectedUsers.map(user => ({
    userId: user.userId,
    nickname: user.nickname,
    isOnline: true // All connected users are online
  }))
  const onlineCount = connectedUsers.length
  
  // Create post function
  const createPost = useCallback((content: string, media?: string, tags: string[] = []) => {
    if (!myId || !isConnected) return
    
    const newPost: SocialPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: myId,
      nickname: myNickname,
      content,
      timestamp: Date.now(),
      likes: 0,
      likedBy: new Set(),
      tags,
      media
    }
    
    setPosts(prevPosts => [newPost, ...prevPosts])
  }, [myId, isConnected, myNickname, setPosts])
  
  // Like post function
  const likePost = useCallback((postId: string) => {
    if (!myId || !isConnected) return
    
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const newLikedBy = new Set(post.likedBy)
          if (newLikedBy.has(myId)) {
            newLikedBy.delete(myId)
            return {
              ...post,
              likes: Math.max(0, post.likes - 1),
              likedBy: newLikedBy
            }
          } else {
            newLikedBy.add(myId)
            return {
              ...post,
              likes: post.likes + 1,
              likedBy: newLikedBy
            }
          }
        }
        return post
      })
    )
  }, [myId, isConnected, setPosts])
  
  // Set nickname function
  const setNickname = useCallback((nickname: string) => {
    setMyNickname(nickname)
  }, [setMyNickname])
  
  return {
    // Connection state
    isConnected,
    currentUser,
    users,
    onlineCount,
    
    // Chat functionality
    messages,
    sendMessage,
    
    // Social functionality
    posts,
    createPost,
    likePost,
    
    // User management
    setNickname,
    allNicknames
  }
}

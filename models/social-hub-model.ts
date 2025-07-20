import { ReactTogetherModel } from 'react-together'

// Enhanced interfaces for social hub features
export interface ChatMessage {
  id: string
  userId: string
  nickname: string
  text: string
  timestamp: number
  type?: 'text' | 'system' | 'emoji'
}

export interface SocialPost {
  id: string
  userId: string
  nickname: string
  content: string
  timestamp: number
  likes: number
  likedBy: string[]
  media?: string
  tags: string[]
  reactions?: Record<string, string[]> // emoji -> userIds
}

export interface UserPresence {
  userId: string
  nickname: string
  isOnline: boolean
  lastSeen: number
  currentActivity?: string
  isTyping?: boolean
  joinedAt: number
}

export interface LiveActivity {
  id: string
  userId: string
  nickname: string
  type: 'post_created' | 'post_liked' | 'user_joined' | 'user_left' | 'achievement_earned' | 'message_sent'
  description: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface TypingIndicator {
  userId: string
  nickname: string
  timestamp: number
}

/**
 * Enhanced Social Hub Model for real-time social features
 * Extends ReactTogetherModel to provide:
 * - Real-time chat with typing indicators
 * - Live social feed with instant updates
 * - User presence and activity tracking
 * - Live reactions and interactions
 */
export class SocialHubModel extends ReactTogetherModel {
  // Social hub state
  posts: SocialPost[] = []
  chatMessages: ChatMessage[] = []
  userPresence: Map<string, UserPresence> = new Map()
  liveActivities: LiveActivity[] = []
  typingIndicators: Map<string, TypingIndicator> = new Map()
  
  // Counters for generating unique IDs
  postIdCounter: number = 0
  messageIdCounter: number = 0
  activityIdCounter: number = 0

  init() {
    // Initialize the model state
    super.init({
      posts: [],
      chatMessages: [],
      userPresence: {},
      liveActivities: [],
      typingIndicators: {},
      postIdCounter: 0,
      messageIdCounter: 0,
      activityIdCounter: 0
    })

    // Subscribe to social hub events
    this.subscribe(this.id, 'user-join', this.handleUserJoin.bind(this))
    this.subscribe(this.id, 'user-leave', this.handleUserLeave.bind(this))
    this.subscribe(this.id, 'user-typing', this.handleUserTyping.bind(this))
    this.subscribe(this.id, 'user-stop-typing', this.handleUserStopTyping.bind(this))
    
    // Chat events
    this.subscribe(this.id, 'send-message', this.handleSendMessage.bind(this))
    
    // Social feed events
    this.subscribe(this.id, 'create-post', this.handleCreatePost.bind(this))
    this.subscribe(this.id, 'like-post', this.handleLikePost.bind(this))
    this.subscribe(this.id, 'add-reaction', this.handleAddReaction.bind(this))
    
    // Activity tracking
    this.subscribe(this.id, 'update-activity', this.handleUpdateActivity.bind(this))

    console.log('[SocialHubModel] Initialized with real-time social features')
  }

  // User presence management
  handleUserJoin(data: { userId: string; nickname: string }) {
    const { userId, nickname } = data
    
    const presence: UserPresence = {
      userId,
      nickname,
      isOnline: true,
      lastSeen: Date.now(),
      joinedAt: Date.now()
    }
    
    this.userPresence.set(userId, presence)
    
    // Create join activity
    const activity: LiveActivity = {
      id: `activity_${this.activityIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      type: 'user_joined',
      description: `${nickname} joined the social hub`,
      timestamp: Date.now()
    }
    
    this.liveActivities.unshift(activity)
    // Keep only last 50 activities
    this.liveActivities = this.liveActivities.slice(0, 50)
    
    // Update state
    this.setState({
      userPresence: Object.fromEntries(this.userPresence),
      liveActivities: this.liveActivities,
      activityIdCounter: this.activityIdCounter
    })
    
    console.log(`[SocialHubModel] User joined: ${nickname}`)
  }

  handleUserLeave(data: { userId: string; nickname: string }) {
    const { userId, nickname } = data
    
    const presence = this.userPresence.get(userId)
    if (presence) {
      presence.isOnline = false
      presence.lastSeen = Date.now()
      this.userPresence.set(userId, presence)
    }
    
    // Remove typing indicator
    this.typingIndicators.delete(userId)
    
    // Create leave activity
    const activity: LiveActivity = {
      id: `activity_${this.activityIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      type: 'user_left',
      description: `${nickname} left the social hub`,
      timestamp: Date.now()
    }
    
    this.liveActivities.unshift(activity)
    this.liveActivities = this.liveActivities.slice(0, 50)
    
    // Update state
    this.setState({
      userPresence: Object.fromEntries(this.userPresence),
      typingIndicators: Object.fromEntries(this.typingIndicators),
      liveActivities: this.liveActivities,
      activityIdCounter: this.activityIdCounter
    })
    
    console.log(`[SocialHubModel] User left: ${nickname}`)
  }

  // Typing indicators
  handleUserTyping(data: { userId: string; nickname: string }) {
    const { userId, nickname } = data
    
    this.typingIndicators.set(userId, {
      userId,
      nickname,
      timestamp: Date.now()
    })
    
    this.setState({
      typingIndicators: Object.fromEntries(this.typingIndicators)
    })
  }

  handleUserStopTyping(data: { userId: string }) {
    const { userId } = data
    
    this.typingIndicators.delete(userId)
    
    this.setState({
      typingIndicators: Object.fromEntries(this.typingIndicators)
    })
  }

  // Chat message handling
  handleSendMessage(data: { userId: string; nickname: string; text: string; type?: string }) {
    const { userId, nickname, text, type = 'text' } = data
    
    const message: ChatMessage = {
      id: `msg_${this.messageIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      text,
      timestamp: Date.now(),
      type: type as any
    }
    
    this.chatMessages.push(message)
    // Keep only last 100 messages
    this.chatMessages = this.chatMessages.slice(-100)
    
    // Remove typing indicator
    this.typingIndicators.delete(userId)
    
    // Create message activity
    const activity: LiveActivity = {
      id: `activity_${this.activityIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      type: 'message_sent',
      description: `${nickname} sent a message`,
      timestamp: Date.now(),
      metadata: { messagePreview: text.slice(0, 50) }
    }
    
    this.liveActivities.unshift(activity)
    this.liveActivities = this.liveActivities.slice(0, 50)
    
    this.setState({
      chatMessages: this.chatMessages,
      typingIndicators: Object.fromEntries(this.typingIndicators),
      liveActivities: this.liveActivities,
      messageIdCounter: this.messageIdCounter,
      activityIdCounter: this.activityIdCounter
    })
    
    console.log(`[SocialHubModel] Message sent by ${nickname}: ${text}`)
  }

  // Social post handling
  handleCreatePost(data: { userId: string; nickname: string; content: string; tags?: string[] }) {
    const { userId, nickname, content, tags = ['farming', 'monfarm'] } = data
    
    const post: SocialPost = {
      id: `post_${this.postIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      content,
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags,
      reactions: {}
    }
    
    this.posts.unshift(post)
    // Keep only last 50 posts
    this.posts = this.posts.slice(0, 50)
    
    // Create post activity
    const activity: LiveActivity = {
      id: `activity_${this.activityIdCounter++}_${Date.now()}`,
      userId,
      nickname,
      type: 'post_created',
      description: `${nickname} created a new post`,
      timestamp: Date.now(),
      metadata: { postPreview: content.slice(0, 100) }
    }
    
    this.liveActivities.unshift(activity)
    this.liveActivities = this.liveActivities.slice(0, 50)
    
    this.setState({
      posts: this.posts,
      liveActivities: this.liveActivities,
      postIdCounter: this.postIdCounter,
      activityIdCounter: this.activityIdCounter
    })
    
    console.log(`[SocialHubModel] Post created by ${nickname}`)
  }

  handleLikePost(data: { userId: string; nickname: string; postId: string }) {
    const { userId, nickname, postId } = data
    
    const post = this.posts.find(p => p.id === postId)
    if (!post) return
    
    const hasLiked = post.likedBy.includes(userId)
    
    if (hasLiked) {
      // Unlike
      post.likes = Math.max(0, post.likes - 1)
      post.likedBy = post.likedBy.filter(id => id !== userId)
    } else {
      // Like
      post.likes += 1
      post.likedBy.push(userId)
      
      // Create like activity
      const activity: LiveActivity = {
        id: `activity_${this.activityIdCounter++}_${Date.now()}`,
        userId,
        nickname,
        type: 'post_liked',
        description: `${nickname} liked a post`,
        timestamp: Date.now(),
        metadata: { postId, postPreview: post.content.slice(0, 50) }
      }
      
      this.liveActivities.unshift(activity)
      this.liveActivities = this.liveActivities.slice(0, 50)
    }
    
    this.setState({
      posts: this.posts,
      liveActivities: this.liveActivities,
      activityIdCounter: this.activityIdCounter
    })
    
    console.log(`[SocialHubModel] Post ${hasLiked ? 'unliked' : 'liked'} by ${nickname}`)
  }

  handleAddReaction(data: { userId: string; nickname: string; postId: string; emoji: string }) {
    const { userId, nickname, postId, emoji } = data
    
    const post = this.posts.find(p => p.id === postId)
    if (!post) return
    
    if (!post.reactions) post.reactions = {}
    if (!post.reactions[emoji]) post.reactions[emoji] = []
    
    const hasReacted = post.reactions[emoji].includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      post.reactions[emoji] = post.reactions[emoji].filter(id => id !== userId)
      if (post.reactions[emoji].length === 0) {
        delete post.reactions[emoji]
      }
    } else {
      // Add reaction
      post.reactions[emoji].push(userId)
    }
    
    this.setState({
      posts: this.posts
    })
    
    console.log(`[SocialHubModel] Reaction ${emoji} ${hasReacted ? 'removed' : 'added'} by ${nickname}`)
  }

  handleUpdateActivity(data: { userId: string; nickname: string; activity: string }) {
    const { userId, nickname, activity } = data
    
    const presence = this.userPresence.get(userId)
    if (presence) {
      presence.currentActivity = activity
      presence.lastSeen = Date.now()
      this.userPresence.set(userId, presence)
      
      this.setState({
        userPresence: Object.fromEntries(this.userPresence)
      })
    }
  }

  // Helper methods for getting state
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(user => user.isOnline)
  }

  getTypingUsers(): TypingIndicator[] {
    const now = Date.now()
    // Remove stale typing indicators (older than 5 seconds)
    for (const [userId, indicator] of this.typingIndicators.entries()) {
      if (now - indicator.timestamp > 5000) {
        this.typingIndicators.delete(userId)
      }
    }
    return Array.from(this.typingIndicators.values())
  }

  getRecentActivities(limit: number = 20): LiveActivity[] {
    return this.liveActivities.slice(0, limit)
  }
}

// Register the model
SocialHubModel.register('SocialHubModel')

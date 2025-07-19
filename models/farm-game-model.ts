import { ReactTogetherModel } from 'react-together'

// Extend ReactTogetherModel with Multisynq functionality
declare module 'react-together' {
  interface ReactTogetherModel {
    sessionId: string
    publish(sessionId: string, event: string, data?: any): void
    subscribe(sessionId: string, event: string, handler: (data?: any) => void): void
    unsubscribe(sessionId: string, event: string, handler: (data?: any) => void): void
  }
}

export interface FarmPlot {
  status: 'empty' | 'growing' | 'ready'
  crop?: string
  plantedAt?: number
  readyAt?: number
  ownerId?: string
}

export interface PlayerState {
  userId: string
  nickname: string
  farmCoins: number
  playerLevel: number
  playerXp: number
  plots: FarmPlot[]
  cropInventory: Record<string, number>
  lastActive: number
}

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
}

export class FarmGameModel extends ReactTogetherModel {
  // Game state
  players: Map<string, PlayerState> = new Map()
  sharedFarmPlots: FarmPlot[] = []
  chatMessages: ChatMessage[] = []
  socialPosts: SocialPost[] = []
  gameSettings = {
    currentSeason: 'spring',
    currentWeather: 'sunny',
    seasonDay: 1,
    seasonLength: 28,
    sharedFarmEnabled: false
  }

  // Social feed state
  postIdCounter: number = 0

  init() {
    super.init({
      players: {},
      sharedFarmPlots: [],
      chatMessages: [],
      socialPosts: [],
      gameSettings: this.gameSettings,
      postIdCounter: 0
    })

    // Subscribe to game events
    this.subscribe(this.id, 'player-join', this.handlePlayerJoin.bind(this))
    this.subscribe(this.id, 'player-leave', this.handlePlayerLeave.bind(this))
    this.subscribe(this.id, 'plant-crop', this.handlePlantCrop.bind(this))
    this.subscribe(this.id, 'harvest-crop', this.handleHarvestCrop.bind(this))
    this.subscribe(this.id, 'update-player-state', this.handleUpdatePlayerState.bind(this))
    
    // Subscribe to social events
    this.subscribe(this.id, 'send-chat-message', this.handleSendChatMessage.bind(this))
    this.subscribe(this.id, 'create-social-post', this.handleCreateSocialPost.bind(this))
    this.subscribe(this.id, 'like-social-post', this.handleLikeSocialPost.bind(this))
    
    // Subscribe to admin events
    this.subscribe(this.id, 'change-season', this.handleChangeSeason.bind(this))
    this.subscribe(this.id, 'change-weather', this.handleChangeWeather.bind(this))
    this.subscribe(this.id, 'advance-day', this.handleAdvanceDay.bind(this))

    // Initialize shared farm plots (3x3 grid)
    if (this.sharedFarmPlots.length === 0) {
      this.sharedFarmPlots = Array(9).fill(null).map(() => ({
        status: 'empty' as const
      }))
      this.updateState({ sharedFarmPlots: this.sharedFarmPlots })
    }

    console.log('[FarmGameModel] Initialized with server-side logic')
  }

  // Player management
  handlePlayerJoin(data: { userId: string; nickname: string }) {
    const { userId, nickname } = data
    
    if (!this.players.has(userId)) {
      const newPlayer: PlayerState = {
        userId,
        nickname,
        farmCoins: 500, // Starting coins
        playerLevel: 1,
        playerXp: 0,
        plots: Array(9).fill(null).map(() => ({ status: 'empty' as const })),
        cropInventory: {},
        lastActive: Date.now()
      }
      
      this.players.set(userId, newPlayer)
      this.updateState({ 
        players: Object.fromEntries(this.players)
      })
      
      // Send welcome message
      this.handleSendChatMessage({
        userId: 'system',
        nickname: 'Farm Bot',
        text: `🌱 ${nickname} joined the farm! Welcome!`,
        type: 'system'
      })
      
      console.log(`[FarmGameModel] Player ${nickname} (${userId}) joined`)
    } else {
      // Update last active time
      const player = this.players.get(userId)!
      player.lastActive = Date.now()
      this.players.set(userId, player)
    }
  }

  handlePlayerLeave(data: { userId: string }) {
    const { userId } = data
    const player = this.players.get(userId)
    
    if (player) {
      this.handleSendChatMessage({
        userId: 'system',
        nickname: 'Farm Bot',
        text: `👋 ${player.nickname} left the farm`,
        type: 'system'
      })
      
      console.log(`[FarmGameModel] Player ${player.nickname} (${userId}) left`)
    }
  }

  // Crop management with server-side validation
  handlePlantCrop(data: { 
    userId: string
    plotIndex: number
    cropType: string
    cost: number
    growthTime: number
    isSharedFarm?: boolean
  }) {
    const { userId, plotIndex, cropType, cost, growthTime, isSharedFarm = false } = data
    const player = this.players.get(userId)
    
    if (!player) {
      console.warn(`[FarmGameModel] Player ${userId} not found for planting`)
      return
    }

    // Check if player has enough coins
    if (player.farmCoins < cost) {
      console.warn(`[FarmGameModel] Player ${userId} doesn't have enough coins`)
      return
    }

    const plots = isSharedFarm ? this.sharedFarmPlots : player.plots
    
    // Validate plot index and status
    if (plotIndex < 0 || plotIndex >= plots.length || plots[plotIndex].status !== 'empty') {
      console.warn(`[FarmGameModel] Invalid plot or plot not empty: ${plotIndex}`)
      return
    }

    // Plant the crop
    const now = Date.now()
    const readyAt = now + (growthTime * 60 * 1000) // Convert minutes to ms
    
    plots[plotIndex] = {
      status: 'growing',
      crop: cropType,
      plantedAt: now,
      readyAt: readyAt,
      ownerId: userId
    }

    // Deduct coins
    player.farmCoins -= cost
    player.lastActive = now

    // Update state
    if (isSharedFarm) {
      this.updateState({ 
        sharedFarmPlots: this.sharedFarmPlots,
        players: Object.fromEntries(this.players)
      })
    } else {
      this.updateState({ 
        players: Object.fromEntries(this.players)
      })
    }

    console.log(`[FarmGameModel] ${player.nickname} planted ${cropType} on plot ${plotIndex}`)
  }

  handleHarvestCrop(data: {
    userId: string
    plotIndex: number
    isSharedFarm?: boolean
  }) {
    const { userId, plotIndex, isSharedFarm = false } = data
    const player = this.players.get(userId)
    
    if (!player) {
      console.warn(`[FarmGameModel] Player ${userId} not found for harvesting`)
      return
    }

    const plots = isSharedFarm ? this.sharedFarmPlots : player.plots
    const plot = plots[plotIndex]
    
    // Validate plot and ownership
    if (!plot || plot.status !== 'ready' || !plot.crop) {
      console.warn(`[FarmGameModel] Invalid harvest attempt on plot ${plotIndex}`)
      return
    }

    // For shared farm, check ownership
    if (isSharedFarm && plot.ownerId !== userId) {
      console.warn(`[FarmGameModel] Player ${userId} tried to harvest plot owned by ${plot.ownerId}`)
      return
    }

    // Harvest the crop
    const cropType = plot.crop
    const harvestAmount = this.calculateHarvestAmount(cropType)
    
    // Add to inventory
    player.cropInventory[cropType] = (player.cropInventory[cropType] || 0) + harvestAmount
    player.lastActive = Date.now()

    // Clear the plot
    plots[plotIndex] = { status: 'empty' }

    // Update state
    if (isSharedFarm) {
      this.updateState({ 
        sharedFarmPlots: this.sharedFarmPlots,
        players: Object.fromEntries(this.players)
      })
    } else {
      this.updateState({ 
        players: Object.fromEntries(this.players)
      })
    }

    console.log(`[FarmGameModel] ${player.nickname} harvested ${harvestAmount} ${cropType} from plot ${plotIndex}`)
  }

  // Helper method to calculate harvest amount based on season/weather
  calculateHarvestAmount(cropType: string): number {
    let baseAmount = 1
    
    // Season bonuses
    const seasonBonus = this.gameSettings.currentSeason === 'spring' ? 1.2 : 1.0
    
    // Weather bonuses
    const weatherBonus = this.gameSettings.currentWeather === 'sunny' ? 1.1 : 
                        this.gameSettings.currentWeather === 'rainy' ? 1.3 : 1.0
    
    return Math.floor(baseAmount * seasonBonus * weatherBonus)
  }

  handleUpdatePlayerState(data: {
    userId: string
    updates: Partial<PlayerState>
  }) {
    const { userId, updates } = data
    const player = this.players.get(userId)
    
    if (!player) return

    // Apply updates with validation
    Object.assign(player, {
      ...updates,
      lastActive: Date.now()
    })

    this.updateState({ 
      players: Object.fromEntries(this.players)
    })
  }

  // Chat system
  handleSendChatMessage(data: {
    userId: string
    nickname: string
    text: string
    type?: string
  }) {
    const { userId, nickname, text, type = 'text' } = data
    
    // Validate message
    if (!text.trim() || text.length > 500) {
      console.warn(`[FarmGameModel] Invalid chat message from ${userId}`)
      return
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      nickname,
      text: text.trim(),
      timestamp: Date.now(),
      type
    }

    this.chatMessages.push(message)
    
    // Keep only last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100)
    }

    this.updateState({ chatMessages: this.chatMessages })
    console.log(`[FarmGameModel] Chat message from ${nickname}: ${text}`)
  }

  // Social posts
  handleCreateSocialPost(data: {
    userId: string
    nickname: string
    content: string
    media?: string
    tags?: string[]
  }) {
    const { userId, nickname, content, media, tags = [] } = data

    if (!content.trim() || content.length > 1000) {
      console.warn(`[FarmGameModel] Invalid social post from ${userId}`)
      return
    }

    // Generate unique post ID
    this.postIdCounter += 1
    const post: SocialPost = {
      id: `post_${this.postIdCounter}_${Date.now()}`,
      userId,
      nickname,
      content: content.trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      media,
      tags
    }

    this.socialPosts.unshift(post) // Add to beginning

    // Keep only last 50 posts
    if (this.socialPosts.length > 50) {
      this.socialPosts = this.socialPosts.slice(0, 50)
    }

    // Broadcast to all clients
    this.publish(this.sessionId, "postCreated", { post })
    this.updateState({ socialPosts: this.socialPosts })
    console.log(`[FarmGameModel] New social post from ${nickname}: ${post.id}`)
  }

  handleLikeSocialPost(data: {
    userId: string
    postId: string
  }) {
    const { userId, postId } = data
    const post = this.socialPosts.find(p => p.id === postId)

    if (!post) {
      console.warn(`[FarmGameModel] Post not found: ${postId}`)
      return
    }

    const hasLiked = post.likedBy.includes(userId)

    if (hasLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id !== userId)
      post.likes = Math.max(0, post.likes - 1)
      console.log(`[FarmGameModel] User ${userId} unliked post ${postId}`)
    } else {
      // Like
      post.likedBy.push(userId)
      post.likes += 1
      console.log(`[FarmGameModel] User ${userId} liked post ${postId}`)
    }

    // Broadcast like update to all clients
    this.publish(this.sessionId, "postLiked", {
      postId,
      likes: post.likes,
      likedBy: post.likedBy,
      userId,
      action: hasLiked ? 'unlike' : 'like'
    })

    this.updateState({ socialPosts: this.socialPosts })
  }

  // Game world management
  handleChangeSeason(data: { season: string }) {
    this.gameSettings.currentSeason = data.season
    this.gameSettings.seasonDay = 1
    this.updateState({ gameSettings: this.gameSettings })
    
    this.handleSendChatMessage({
      userId: 'system',
      nickname: 'Farm Bot',
      text: `🌸 Season changed to ${data.season}!`,
      type: 'system'
    })
  }

  handleChangeWeather(data: { weather: string }) {
    this.gameSettings.currentWeather = data.weather
    this.updateState({ gameSettings: this.gameSettings })
    
    const weatherEmoji = data.weather === 'sunny' ? '☀️' : 
                        data.weather === 'rainy' ? '🌧️' : '☁️'
    
    this.handleSendChatMessage({
      userId: 'system',
      nickname: 'Farm Bot',
      text: `${weatherEmoji} Weather changed to ${data.weather}!`,
      type: 'system'
    })
  }

  handleAdvanceDay() {
    this.gameSettings.seasonDay += 1
    
    if (this.gameSettings.seasonDay > this.gameSettings.seasonLength) {
      // Advance to next season
      const seasons = ['spring', 'summer', 'fall', 'winter']
      const currentIndex = seasons.indexOf(this.gameSettings.currentSeason)
      const nextSeason = seasons[(currentIndex + 1) % seasons.length]
      
      this.handleChangeSeason({ season: nextSeason })
    } else {
      this.updateState({ gameSettings: this.gameSettings })
    }
  }
}

// Register the model
FarmGameModel.register('FarmGameModel')

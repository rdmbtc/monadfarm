'use client'

import { ReactTogetherModel } from 'react-together'

// Type definitions for the platformer game
export interface PlatformerPlayer {
  id: string
  nickname: string
  x: number
  y: number
  velocityX: number
  velocityY: number
  isOnGround: boolean
  isJumping: boolean
  canDoubleJump: boolean
  state: 'idle' | 'run' | 'jump' | 'fall'
  score: number
  lives: number
  level: number
  powerups: string[]
  lastUpdate: number
  isActive: boolean
  color: string // Visual identifier for multiplayer
}

export interface GameEvent {
  id: string
  type: 'player-jump' | 'player-land' | 'collect-star' | 'defeat-enemy' | 'level-complete' | 'player-death' | 'powerup-collect'
  playerId: string
  timestamp: number
  data: any
}

export interface GameSession {
  id: string
  currentLevel: number
  isActive: boolean
  maxPlayers: number
  gameMode: 'cooperative' | 'competitive'
  startTime: number
  levelData?: any
}

export interface ChatMessage {
  id: string
  playerId: string
  nickname: string
  text: string
  timestamp: number
  type: 'text' | 'system' | 'achievement'
}

/**
 * Multiplayer Platformer Game Model
 * Extends ReactTogetherModel to provide real-time multiplayer functionality for the MonFarm Platformer game
 */
export class PlatformerGameModel extends ReactTogetherModel {
  // Game state
  players: Map<string, PlatformerPlayer> = new Map()
  gameSession: GameSession | null = null
  gameEvents: GameEvent[] = []
  chatMessages: ChatMessage[] = []
  
  // Counters for generating unique IDs
  eventIdCounter: number = 0
  messageIdCounter: number = 0
  
  // Game configuration
  maxPlayers: number = 4
  tickRate: number = 60 // Updates per second
  
  init() {
    super.init({
      players: {},
      gameSession: null,
      gameEvents: [],
      chatMessages: []
    })

    console.log('PlatformerGameModel: Initializing multiplayer platformer model')

    // Subscribe to game events
    this.subscribe(this.id, 'player-join', this.handlePlayerJoin.bind(this))
    this.subscribe(this.id, 'player-leave', this.handlePlayerLeave.bind(this))
    this.subscribe(this.id, 'player-update', this.handlePlayerUpdate.bind(this))
    this.subscribe(this.id, 'player-action', this.handlePlayerAction.bind(this))
    this.subscribe(this.id, 'game-event', this.handleGameEvent.bind(this))
    this.subscribe(this.id, 'chat-message', this.handleChatMessage.bind(this))
    this.subscribe(this.id, 'start-game', this.handleStartGame.bind(this))
    this.subscribe(this.id, 'level-complete', this.handleLevelComplete.bind(this))
    this.subscribe(this.id, 'reset-game', this.handleResetGame.bind(this))

    console.log('PlatformerGameModel: Event subscriptions set up')
  }

  // Player management
  handlePlayerJoin(data: { playerId: string; nickname: string }) {
    console.log('PlatformerGameModel: Player joining:', data)
    
    if (this.players.size >= this.maxPlayers) {
      console.warn('PlatformerGameModel: Maximum players reached')
      return
    }

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    const playerColor = colors[this.players.size % colors.length]

    const newPlayer: PlatformerPlayer = {
      id: data.playerId,
      nickname: data.nickname,
      x: 100 + (this.players.size * 50), // Spread players out
      y: 400,
      velocityX: 0,
      velocityY: 0,
      isOnGround: false,
      isJumping: false,
      canDoubleJump: false,
      state: 'idle',
      score: 0,
      lives: 3,
      level: 1,
      powerups: [],
      lastUpdate: Date.now(),
      isActive: true,
      color: playerColor
    }

    this.players.set(data.playerId, newPlayer)
    this.publish()

    // Send welcome message
    this.addSystemMessage(`${data.nickname} joined the game!`)
    
    // Start game if this is the first player
    if (this.players.size === 1 && !this.gameSession) {
      this.createGameSession()
    }
  }

  handlePlayerLeave(data: { playerId: string }) {
    console.log('PlatformerGameModel: Player leaving:', data)
    
    const player = this.players.get(data.playerId)
    if (player) {
      this.addSystemMessage(`${player.nickname} left the game`)
      this.players.delete(data.playerId)
      this.publish()
    }

    // End game session if no players left
    if (this.players.size === 0) {
      this.gameSession = null
      this.publish()
    }
  }

  handlePlayerUpdate(data: { 
    playerId: string
    x: number
    y: number
    velocityX: number
    velocityY: number
    isOnGround: boolean
    isJumping: boolean
    canDoubleJump: boolean
    state: string
  }) {
    const player = this.players.get(data.playerId)
    if (player) {
      // Update player position and state
      player.x = data.x
      player.y = data.y
      player.velocityX = data.velocityX
      player.velocityY = data.velocityY
      player.isOnGround = data.isOnGround
      player.isJumping = data.isJumping
      player.canDoubleJump = data.canDoubleJump
      player.state = data.state as any
      player.lastUpdate = Date.now()
      player.isActive = true

      this.publish()
    }
  }

  handlePlayerAction(data: {
    playerId: string
    action: string
    data?: any
  }) {
    const player = this.players.get(data.playerId)
    if (!player) return

    switch (data.action) {
      case 'jump':
        this.broadcastGameEvent('player-jump', data.playerId, data.data)
        break
      case 'land':
        this.broadcastGameEvent('player-land', data.playerId, data.data)
        break
      case 'collect-star':
        player.score += data.data?.points || 10
        this.broadcastGameEvent('collect-star', data.playerId, data.data)
        break
      case 'defeat-enemy':
        player.score += data.data?.points || 50
        this.broadcastGameEvent('defeat-enemy', data.playerId, data.data)
        break
      case 'collect-powerup':
        if (data.data?.powerupType) {
          player.powerups.push(data.data.powerupType)
        }
        this.broadcastGameEvent('powerup-collect', data.playerId, data.data)
        break
      case 'player-death':
        player.lives = Math.max(0, player.lives - 1)
        player.x = 100 // Reset position
        player.y = 400
        this.broadcastGameEvent('player-death', data.playerId, data.data)
        break
    }

    this.publish()
  }

  handleGameEvent(data: GameEvent) {
    this.gameEvents.push(data)
    
    // Keep only recent events (last 100)
    if (this.gameEvents.length > 100) {
      this.gameEvents = this.gameEvents.slice(-100)
    }
    
    this.publish()
  }

  handleChatMessage(data: {
    playerId: string
    nickname: string
    text: string
    type?: string
  }) {
    const message: ChatMessage = {
      id: `msg_${this.messageIdCounter++}`,
      playerId: data.playerId,
      nickname: data.nickname,
      text: data.text,
      timestamp: Date.now(),
      type: (data.type as any) || 'text'
    }

    this.chatMessages.push(message)
    
    // Keep only recent messages (last 50)
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50)
    }
    
    this.publish()
  }

  handleStartGame(data: { level?: number; gameMode?: string }) {
    console.log('PlatformerGameModel: Starting game:', data)
    
    if (!this.gameSession) {
      this.createGameSession()
    }
    
    if (this.gameSession) {
      this.gameSession.currentLevel = data.level || 1
      this.gameSession.gameMode = (data.gameMode as any) || 'cooperative'
      this.gameSession.isActive = true
      this.gameSession.startTime = Date.now()
    }
    
    this.addSystemMessage(`Game started! Level ${data.level || 1}`)
    this.publish()
  }

  handleLevelComplete(data: { playerId: string; level: number; score: number }) {
    const player = this.players.get(data.playerId)
    if (player) {
      player.level = Math.max(player.level, data.level + 1)
      player.score += data.score
    }

    this.addSystemMessage(`${player?.nickname || 'Player'} completed level ${data.level}!`)
    this.broadcastGameEvent('level-complete', data.playerId, data)
    this.publish()
  }

  handleResetGame() {
    console.log('PlatformerGameModel: Resetting game')
    
    // Reset all players
    for (const player of this.players.values()) {
      player.x = 100 + (Array.from(this.players.keys()).indexOf(player.id) * 50)
      player.y = 400
      player.velocityX = 0
      player.velocityY = 0
      player.score = 0
      player.lives = 3
      player.level = 1
      player.powerups = []
      player.state = 'idle'
    }

    // Reset game session
    if (this.gameSession) {
      this.gameSession.currentLevel = 1
      this.gameSession.isActive = false
      this.gameSession.startTime = Date.now()
    }

    this.gameEvents = []
    this.addSystemMessage('Game reset!')
    this.publish()
  }

  // Helper methods
  private createGameSession() {
    this.gameSession = {
      id: `session_${Date.now()}`,
      currentLevel: 1,
      isActive: false,
      maxPlayers: this.maxPlayers,
      gameMode: 'cooperative',
      startTime: Date.now()
    }
  }

  private broadcastGameEvent(type: string, playerId: string, data: any) {
    const event: GameEvent = {
      id: `event_${this.eventIdCounter++}`,
      type: type as any,
      playerId,
      timestamp: Date.now(),
      data
    }
    
    this.handleGameEvent(event)
  }

  private addSystemMessage(text: string) {
    const message: ChatMessage = {
      id: `sys_${this.messageIdCounter++}`,
      playerId: 'system',
      nickname: 'System',
      text,
      timestamp: Date.now(),
      type: 'system'
    }
    
    this.chatMessages.push(message)
    
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50)
    }
  }
}

// Register the model
PlatformerGameModel.register('PlatformerGameModel')

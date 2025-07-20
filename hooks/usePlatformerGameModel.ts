'use client'

import { useCallback } from 'react'
import { useStateTogether, useMyId } from 'react-together'

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

export interface UsePlatformerGameModelReturn {
  // State
  players: Record<string, PlatformerPlayer>
  gameSession: GameSession | null
  gameEvents: GameEvent[]
  chatMessages: ChatMessage[]
  myPlayer: PlatformerPlayer | null
  otherPlayers: PlatformerPlayer[]
  isGameActive: boolean
  playerCount: number
  
  // Actions
  joinGame: (playerId: string, nickname: string) => void
  leaveGame: (playerId: string) => void
  updatePlayerPosition: (playerId: string, position: {
    x: number
    y: number
    velocityX: number
    velocityY: number
    isOnGround: boolean
    isJumping: boolean
    canDoubleJump: boolean
    state: 'idle' | 'run' | 'jump' | 'fall'
  }) => void
  performPlayerAction: (playerId: string, action: string, data?: any) => void
  sendChatMessage: (playerId: string, nickname: string, text: string, type?: string) => void
  startGame: (level?: number, gameMode?: string) => void
  resetGame: () => void
  
  // Utility
  getPlayerById: (playerId: string) => PlatformerPlayer | null
  isPlayerActive: (playerId: string) => boolean
}

export function usePlatformerGameModel(userId?: string): UsePlatformerGameModelReturn {
  // ReactTogether hooks - following the same pattern as social hub
  const myId = useMyId()
  // Note: connectedUsers could be used for showing online players in UI

  // Shared state for multiplayer platformer game
  const [players, setPlayers] = useStateTogether<Record<string, PlatformerPlayer>>('platformer-players', {})
  const [gameSession, setGameSession] = useStateTogether<GameSession | null>('platformer-session', null)
  const [gameEvents, setGameEvents] = useStateTogether<GameEvent[]>('platformer-events', [])
  const [chatMessages, setChatMessages] = useStateTogether<ChatMessage[]>('platformer-chat', [])

  // Get current player
  const myPlayer = (userId || myId) ? players[userId || myId || ''] || null : null

  // Get other players
  const otherPlayers = Object.values(players).filter((player: PlatformerPlayer) => player.id !== (userId || myId))

  // Game state
  const isGameActive = gameSession?.isActive || false
  const playerCount = Object.keys(players).length

  // Action functions using state setters
  const joinGame = useCallback((playerId: string, nickname: string) => {
    console.log('usePlatformerGameModel: Joining game:', { playerId, nickname })

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    const playerColor = colors[Object.keys(players).length % colors.length]

    const newPlayer: PlatformerPlayer = {
      id: playerId,
      nickname: nickname,
      x: 100 + (Object.keys(players).length * 50), // Spread players out
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

    setPlayers(prev => ({ ...prev, [playerId]: newPlayer }))

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      playerId: 'system',
      nickname: 'System',
      text: `${nickname} joined the game!`,
      timestamp: Date.now(),
      type: 'system'
    }
    setChatMessages(prev => [...(prev || []).slice(-49), welcomeMessage])

    // Start game session if this is the first player
    if (Object.keys(players).length === 0 && !gameSession) {
      const newSession: GameSession = {
        id: `session_${Date.now()}`,
        currentLevel: 1,
        isActive: false,
        maxPlayers: 4,
        gameMode: 'cooperative',
        startTime: Date.now()
      }
      setGameSession(newSession)
    }
  }, [players, gameSession, setPlayers, setChatMessages, setGameSession])

  const leaveGame = useCallback((playerId: string) => {
    console.log('usePlatformerGameModel: Leaving game:', { playerId })

    const player = players[playerId]
    if (player) {
      // Add leave message
      const leaveMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        playerId: 'system',
        nickname: 'System',
        text: `${player.nickname} left the game`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...(prev || []).slice(-49), leaveMessage])

      // Remove player
      setPlayers(prev => {
        const newPlayers = { ...prev }
        delete newPlayers[playerId]
        return newPlayers
      })
    }

    // End game session if no players left
    if (Object.keys(players).length <= 1) {
      setGameSession(null)
    }
  }, [players, setPlayers, setChatMessages, setGameSession])

  const updatePlayerPosition = useCallback((
    playerId: string,
    position: {
      x: number
      y: number
      velocityX: number
      velocityY: number
      isOnGround: boolean
      isJumping: boolean
      canDoubleJump: boolean
      state: 'idle' | 'run' | 'jump' | 'fall'
    }
  ) => {
    setPlayers(prev => {
      const player = prev[playerId]
      if (player) {
        return {
          ...prev,
          [playerId]: {
            ...player,
            ...position,
            lastUpdate: Date.now(),
            isActive: true
          }
        }
      }
      return prev
    })
  }, [setPlayers])

  const performPlayerAction = useCallback((
    playerId: string,
    action: string,
    data?: any
  ) => {
    console.log('usePlatformerGameModel: Player action:', { playerId, action, data })

    // Update player based on action
    setPlayers(prev => {
      const player = prev[playerId]
      if (!player) return prev

      let updatedPlayer = { ...player }

      switch (action) {
        case 'collect-star':
          updatedPlayer.score += data?.points || 10
          break
        case 'defeat-enemy':
          updatedPlayer.score += data?.points || 50
          break
        case 'collect-powerup':
          if (data?.powerupType) {
            updatedPlayer.powerups = [...updatedPlayer.powerups, data.powerupType]
          }
          break
        case 'player-death':
          updatedPlayer.lives = Math.max(0, updatedPlayer.lives - 1)
          updatedPlayer.x = 100 // Reset position
          updatedPlayer.y = 400
          break
      }

      return { ...prev, [playerId]: updatedPlayer }
    })

    // Add game event
    const event: GameEvent = {
      id: `event_${Date.now()}`,
      type: action as any,
      playerId,
      timestamp: Date.now(),
      data
    }
    setGameEvents(prev => [...(prev || []).slice(-99), event])
  }, [setPlayers, setGameEvents])

  const sendChatMessage = useCallback((
    playerId: string,
    nickname: string,
    text: string,
    type = 'text'
  ) => {
    if (!text.trim()) return
    console.log('usePlatformerGameModel: Sending chat message:', { playerId, nickname, text, type })

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      playerId,
      nickname,
      text,
      timestamp: Date.now(),
      type: type as any
    }

    setChatMessages(prev => [...(prev || []).slice(-49), message])
  }, [setChatMessages])

  const startGame = useCallback((level = 1, gameMode = 'cooperative') => {
    console.log('usePlatformerGameModel: Starting game:', { level, gameMode })

    setGameSession(prev => {
      if (!prev) {
        return {
          id: `session_${Date.now()}`,
          currentLevel: level,
          isActive: true,
          maxPlayers: 4,
          gameMode: gameMode as any,
          startTime: Date.now()
        }
      }
      return {
        ...prev,
        currentLevel: level,
        gameMode: gameMode as any,
        isActive: true,
        startTime: Date.now()
      }
    })

    // Add system message
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      playerId: 'system',
      nickname: 'System',
      text: `Game started! Level ${level}`,
      timestamp: Date.now(),
      type: 'system'
    }
    setChatMessages(prev => [...(prev || []).slice(-49), message])
  }, [setGameSession, setChatMessages])

  const resetGame = useCallback(() => {
    console.log('usePlatformerGameModel: Resetting game')

    // Reset all players
    setPlayers(prev => {
      const resetPlayers: Record<string, PlatformerPlayer> = {}
      Object.entries(prev).forEach(([id, player], index) => {
        resetPlayers[id] = {
          ...player,
          x: 100 + (index * 50),
          y: 400,
          velocityX: 0,
          velocityY: 0,
          score: 0,
          lives: 3,
          level: 1,
          powerups: [],
          state: 'idle'
        }
      })
      return resetPlayers
    })

    // Reset game session
    setGameSession(prev => prev ? {
      ...prev,
      currentLevel: 1,
      isActive: false,
      startTime: Date.now()
    } : null)

    // Clear events and add reset message
    setGameEvents([])
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      playerId: 'system',
      nickname: 'System',
      text: 'Game reset!',
      timestamp: Date.now(),
      type: 'system'
    }
    setChatMessages(prev => [...(prev || []).slice(-49), message])
  }, [setPlayers, setGameSession, setGameEvents, setChatMessages])

  // Utility functions
  const getPlayerById = useCallback((playerId: string): PlatformerPlayer | null => {
    return players[playerId] || null
  }, [players])

  const isPlayerActive = useCallback((playerId: string): boolean => {
    const player = players[playerId]
    if (!player) return false

    // Consider player active if they've updated within the last 30 seconds (increased from 5)
    const now = Date.now()
    const timeSinceUpdate = now - (player.lastUpdate || 0)
    return timeSinceUpdate < 30000
  }, [players])

  return {
    // State
    players,
    gameSession,
    gameEvents,
    chatMessages,
    myPlayer,
    otherPlayers,
    isGameActive,
    playerCount,
    
    // Actions
    joinGame,
    leaveGame,
    updatePlayerPosition,
    performPlayerAction,
    sendChatMessage,
    startGame,
    resetGame,
    
    // Utility
    getPlayerById,
    isPlayerActive
  }
}

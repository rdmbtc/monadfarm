'use client'

import { useCallback } from 'react'
import { MultisynqReact } from 'react-together'
import { useModel } from 'react-together'
import type { 
  PlatformerGameModel, 
  PlatformerPlayer, 
  GameEvent, 
  GameSession, 
  ChatMessage 
} from '../models/platformer-game-model'

const { usePublish, useModelSelector } = MultisynqReact

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
    state: string
  }) => void
  performPlayerAction: (playerId: string, action: string, data?: any) => void
  sendChatMessage: (playerId: string, nickname: string, text: string, type?: string) => void
  startGame: (level?: number, gameMode?: string) => void
  resetGame: () => void
  
  // Utility
  getPlayerById: (playerId: string) => PlatformerPlayer | null
  isPlayerActive: (playerId: string) => boolean
}

export function usePlatformerGameModel(userId?: string, nickname?: string): UsePlatformerGameModelReturn {
  // Get the model instance
  const model = useModel() as PlatformerGameModel | null

  // State selectors using useModelSelector
  const players = useModelSelector((state: any) => state.players || {})
  const gameSession = useModelSelector((state: any) => state.gameSession || null)
  const gameEvents = useModelSelector((state: any) => state.gameEvents || [])
  const chatMessages = useModelSelector((state: any) => state.chatMessages || [])

  // Get current player
  const myPlayer = userId ? players[userId] || null : null
  
  // Get other players
  const otherPlayers = Object.values(players).filter((player: any) => player.id !== userId)
  
  // Game state
  const isGameActive = gameSession?.isActive || false
  const playerCount = Object.keys(players).length

  // Event publishers
  const publishPlayerJoin = usePublish((data: { playerId: string; nickname: string }) => 
    [model?.id, 'player-join', data]
  )
  
  const publishPlayerLeave = usePublish((data: { playerId: string }) => 
    [model?.id, 'player-leave', data]
  )
  
  const publishPlayerUpdate = usePublish((data: { 
    playerId: string
    x: number
    y: number
    velocityX: number
    velocityY: number
    isOnGround: boolean
    isJumping: boolean
    canDoubleJump: boolean
    state: string
  }) => [model?.id, 'player-update', data])
  
  const publishPlayerAction = usePublish((data: {
    playerId: string
    action: string
    data?: any
  }) => [model?.id, 'player-action', data])
  
  const publishChatMessage = usePublish((data: {
    playerId: string
    nickname: string
    text: string
    type?: string
  }) => [model?.id, 'chat-message', data])
  
  const publishStartGame = usePublish((data: { level?: number; gameMode?: string }) => 
    [model?.id, 'start-game', data]
  )
  
  const publishResetGame = usePublish(() => 
    [model?.id, 'reset-game', {}]
  )

  // Action functions
  const joinGame = useCallback((playerId: string, nickname: string) => {
    if (!model) return
    console.log('usePlatformerGameModel: Joining game:', { playerId, nickname })
    publishPlayerJoin({ playerId, nickname })
  }, [model, publishPlayerJoin])

  const leaveGame = useCallback((playerId: string) => {
    if (!model) return
    console.log('usePlatformerGameModel: Leaving game:', { playerId })
    publishPlayerLeave({ playerId })
  }, [model, publishPlayerLeave])

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
      state: string
    }
  ) => {
    if (!model) return
    publishPlayerUpdate({ playerId, ...position })
  }, [model, publishPlayerUpdate])

  const performPlayerAction = useCallback((
    playerId: string, 
    action: string, 
    data?: any
  ) => {
    if (!model) return
    console.log('usePlatformerGameModel: Player action:', { playerId, action, data })
    publishPlayerAction({ playerId, action, data })
  }, [model, publishPlayerAction])

  const sendChatMessage = useCallback((
    playerId: string, 
    nickname: string, 
    text: string, 
    type = 'text'
  ) => {
    if (!model || !text.trim()) return
    console.log('usePlatformerGameModel: Sending chat message:', { playerId, nickname, text, type })
    publishChatMessage({ playerId, nickname, text, type })
  }, [model, publishChatMessage])

  const startGame = useCallback((level = 1, gameMode = 'cooperative') => {
    if (!model) return
    console.log('usePlatformerGameModel: Starting game:', { level, gameMode })
    publishStartGame({ level, gameMode })
  }, [model, publishStartGame])

  const resetGame = useCallback(() => {
    if (!model) return
    console.log('usePlatformerGameModel: Resetting game')
    publishResetGame()
  }, [model, publishResetGame])

  // Utility functions
  const getPlayerById = useCallback((playerId: string): PlatformerPlayer | null => {
    return players[playerId] || null
  }, [players])

  const isPlayerActive = useCallback((playerId: string): boolean => {
    const player = players[playerId]
    if (!player) return false
    
    // Consider player active if they've updated within the last 5 seconds
    const now = Date.now()
    const timeSinceUpdate = now - (player.lastUpdate || 0)
    return timeSinceUpdate < 5000
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

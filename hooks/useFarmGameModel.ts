'use client'

import { useCallback } from 'react'
import { MultisynqReact } from 'react-together'
import { useModel } from 'react-together'
import type { FarmGameModel, PlayerState, ChatMessage, SocialPost } from '../models/farm-game-model'

const { usePublish, useModelSelector } = MultisynqReact

export interface UseFarmGameModelReturn {
  // Model instance
  model: FarmGameModel | null
  
  // State selectors
  players: Record<string, PlayerState>
  myPlayer: PlayerState | null
  sharedFarmPlots: any[]
  chatMessages: ChatMessage[]
  socialPosts: SocialPost[]
  gameSettings: any
  
  // Player actions
  joinGame: (nickname: string) => void
  leaveGame: () => void
  updatePlayerState: (updates: Partial<PlayerState>) => void
  
  // Farming actions
  plantCrop: (plotIndex: number, cropType: string, cost: number, growthTime: number, isSharedFarm?: boolean) => void
  harvestCrop: (plotIndex: number, isSharedFarm?: boolean) => void
  
  // Social actions
  sendChatMessage: (text: string, type?: string) => void
  createSocialPost: (content: string, media?: string, tags?: string[]) => void
  likeSocialPost: (postId: string) => void
  
  // Admin actions (for game masters)
  changeSeason: (season: string) => void
  changeWeather: (weather: string) => void
  advanceDay: () => void
}

export function useFarmGameModel(userId?: string, nickname?: string): UseFarmGameModelReturn {
  // Get the model instance
  const model = useModel() as FarmGameModel | null

  // State selectors using useModelSelector
  const players = useModelSelector((state: any) => state.players || {})
  const sharedFarmPlots = useModelSelector((state: any) => state.sharedFarmPlots || [])
  const chatMessages = useModelSelector((state: any) => state.chatMessages || [])
  const socialPosts = useModelSelector((state: any) => state.socialPosts || [])
  const gameSettings = useModelSelector((state: any) => state.gameSettings || {})

  // Get current player
  const myPlayer = userId ? players[userId] || null : null

  // Event publishers
  const publishPlayerJoin = usePublish((data: { userId: string; nickname: string }) => 
    [model?.id, 'player-join', data]
  )
  
  const publishPlayerLeave = usePublish((data: { userId: string }) => 
    [model?.id, 'player-leave', data]
  )
  
  const publishPlantCrop = usePublish((data: {
    userId: string
    plotIndex: number
    cropType: string
    cost: number
    growthTime: number
    isSharedFarm?: boolean
  }) => [model?.id, 'plant-crop', data])
  
  const publishHarvestCrop = usePublish((data: {
    userId: string
    plotIndex: number
    isSharedFarm?: boolean
  }) => [model?.id, 'harvest-crop', data])
  
  const publishUpdatePlayerState = usePublish((data: {
    userId: string
    updates: Partial<PlayerState>
  }) => [model?.id, 'update-player-state', data])
  
  const publishSendChatMessage = usePublish((data: {
    userId: string
    nickname: string
    text: string
    type?: string
  }) => [model?.id, 'send-chat-message', data])
  
  const publishCreateSocialPost = usePublish((data: {
    userId: string
    nickname: string
    content: string
    media?: string
    tags?: string[]
  }) => [model?.id, 'create-social-post', data])
  
  const publishLikeSocialPost = usePublish((data: {
    userId: string
    postId: string
  }) => [model?.id, 'like-social-post', data])
  
  const publishChangeSeason = usePublish((data: { season: string }) => 
    [model?.id, 'change-season', data]
  )
  
  const publishChangeWeather = usePublish((data: { weather: string }) => 
    [model?.id, 'change-weather', data]
  )
  
  const publishAdvanceDay = usePublish(() => 
    [model?.id, 'advance-day', {}]
  )

  // Action handlers
  const joinGame = useCallback((playerNickname: string) => {
    if (!userId || !model) return
    publishPlayerJoin({ userId, nickname: playerNickname })
  }, [userId, model, publishPlayerJoin])

  const leaveGame = useCallback(() => {
    if (!userId || !model) return
    publishPlayerLeave({ userId })
  }, [userId, model, publishPlayerLeave])

  const updatePlayerState = useCallback((updates: Partial<PlayerState>) => {
    if (!userId || !model) return
    publishUpdatePlayerState({ userId, updates })
  }, [userId, model, publishUpdatePlayerState])

  const plantCrop = useCallback((
    plotIndex: number, 
    cropType: string, 
    cost: number, 
    growthTime: number, 
    isSharedFarm = false
  ) => {
    if (!userId || !model) return
    publishPlantCrop({ 
      userId, 
      plotIndex, 
      cropType, 
      cost, 
      growthTime, 
      isSharedFarm 
    })
  }, [userId, model, publishPlantCrop])

  const harvestCrop = useCallback((plotIndex: number, isSharedFarm = false) => {
    if (!userId || !model) return
    publishHarvestCrop({ userId, plotIndex, isSharedFarm })
  }, [userId, model, publishHarvestCrop])

  const sendChatMessage = useCallback((text: string, type = 'text') => {
    if (!userId || !nickname || !model) return
    publishSendChatMessage({ userId, nickname, text, type })
  }, [userId, nickname, model, publishSendChatMessage])

  const createSocialPost = useCallback((
    content: string, 
    media?: string, 
    tags: string[] = []
  ) => {
    if (!userId || !nickname || !model) return
    publishCreateSocialPost({ userId, nickname, content, media, tags })
  }, [userId, nickname, model, publishCreateSocialPost])

  const likeSocialPost = useCallback((postId: string) => {
    if (!userId || !model) return
    publishLikeSocialPost({ userId, postId })
  }, [userId, model, publishLikeSocialPost])

  const changeSeason = useCallback((season: string) => {
    if (!model) return
    publishChangeSeason({ season })
  }, [model, publishChangeSeason])

  const changeWeather = useCallback((weather: string) => {
    if (!model) return
    publishChangeWeather({ weather })
  }, [model, publishChangeWeather])

  const advanceDay = useCallback(() => {
    if (!model) return
    publishAdvanceDay()
  }, [model, publishAdvanceDay])

  return {
    model,
    players,
    myPlayer,
    sharedFarmPlots,
    chatMessages,
    socialPosts,
    gameSettings,
    joinGame,
    leaveGame,
    updatePlayerState,
    plantCrop,
    harvestCrop,
    sendChatMessage,
    createSocialPost,
    likeSocialPost,
    changeSeason,
    changeWeather,
    advanceDay
  }
}

// Helper hook for getting current user info
export function useCurrentUser() {
  // This would typically come from your auth system (Privy)
  // For now, we'll use a simple implementation
  const userId = typeof window !== 'undefined' ? 
    localStorage.getItem('farm-user-id') || `user_${Date.now()}` : null
  
  const nickname = typeof window !== 'undefined' ? 
    localStorage.getItem('farm-nickname') || 'Anonymous Farmer' : null

  // Save user ID if it was generated
  if (typeof window !== 'undefined' && userId && !localStorage.getItem('farm-user-id')) {
    localStorage.setItem('farm-user-id', userId)
  }

  return { userId, nickname }
}

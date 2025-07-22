import { useState, useEffect, useContext } from 'react'
import { GameContext } from '../context/game-context'
import toast from 'react-hot-toast'

// Safe imports that won't break if Multisynq is not available
let useMyId: any = null
let useConnectedUsers: any = null
let useIsTogether: any = null

// Dynamically import React Together hooks only when available
const loadMultisynqHooks = async () => {
  try {
    const reactTogether = await import('react-together')
    useMyId = reactTogether.useMyId
    useConnectedUsers = reactTogether.useConnectedUsers
    useIsTogether = reactTogether.useIsTogether
    return true
  } catch (error) {
    console.log('React Together not available, using local mode')
    return false
  }
}

export interface Quest {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'social' | 'multiplayer' | 'community'
  reward: {
    coins?: number
    xp?: number
    items?: string[]
  }
  progress: number
  maxProgress: number
  completed: boolean
  externalLink?: string
  icon: string
  category: string
  expiresAt?: number
  requiresMultiplayer?: boolean
}

export interface CommunityQuest extends Quest {
  communityProgress: number
  communityMaxProgress: number
  participantCount: number
  participants: string[]
}

type CroquetConnectionType = 'connecting' | 'online' | 'fatal' | 'offline'

// Safe hook that detects Multisynq context availability
const useSafeMultisynq = () => {
  const [isMultisynqAvailable, setIsMultisynqAvailable] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<any[]>([])
  const [sessionStatus, setSessionStatus] = useState<CroquetConnectionType>('offline')
  const [sharedQuests, setSharedQuests] = useState<CommunityQuest[]>([])
  const [allQuestProgress, setAllQuestProgress] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const initializeMultisynq = async () => {
      try {
        // Check if we're in a React component that has access to React Together context
        const hasMultisynqContext = typeof window !== 'undefined' &&
          (window as any).__REACT_TOGETHER_CONTEXT__ !== undefined

        if (hasMultisynqContext) {
          const hooksLoaded = await loadMultisynqHooks()
          if (hooksLoaded && useMyId && useConnectedUsers && useIsTogether) {
            try {
              // Try to use the hooks - this will throw if not in context
              const id = useMyId()
              const users = useConnectedUsers()
              const isTogether = useIsTogether()

              setIsMultisynqAvailable(true)
              setMyId(id)
              setConnectedUsers(users)
              setSessionStatus(isTogether ? 'online' : 'offline')
              console.log('✅ Multisynq context available, using real-time features')
              return
            } catch (contextError) {
              console.log('⚠️ Multisynq hooks failed, falling back to local mode')
            }
          }
        }

        // Fallback to local mode
        setIsMultisynqAvailable(false)
        setMyId('local-user-' + Math.random().toString(36).substring(2, 9))
        setConnectedUsers([])
        setSessionStatus('offline')
        console.log('📱 Using local mode for quest system')

      } catch (error) {
        console.log('📱 Multisynq not available, using local mode')
        setIsMultisynqAvailable(false)
        setMyId('local-user-' + Math.random().toString(36).substring(2, 9))
        setConnectedUsers([])
        setSessionStatus('offline')
      }
    }

    initializeMultisynq()
  }, [])

  return {
    isMultisynqAvailable,
    myId,
    connectedUsers,
    sessionStatus,
    sharedQuests,
    setSharedQuests,
    allQuestProgress,
    setAllQuestProgress
  }
}

export const useQuestSystem = () => {
  const { farmCoins, addFarmCoins, addXp, cropsHarvested, seedsPlanted, playerLevel } = useContext(GameContext)

  // Use safe Multisynq wrapper
  const {
    isMultisynqAvailable,
    myId,
    connectedUsers,
    sessionStatus,
    sharedQuests,
    setSharedQuests,
    allQuestProgress,
    setAllQuestProgress
  } = useSafeMultisynq()

  // Local quest state
  const [localQuests, setLocalQuests] = useState<Quest[]>([])
  const [myQuestProgress, setMyQuestProgress] = useState<Record<string, number>>({})

  // Hide multisynq loading spinner
  useEffect(() => {
    // Inject CSS to hide spinner
    const style = document.createElement('style')
    style.textContent = `
      #croquet_spinnerOverlay {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .croquet_spinner {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `
    document.head.appendChild(style)

    const hideSpinner = () => {
      const spinnerOverlay = document.getElementById('croquet_spinnerOverlay')
      if (spinnerOverlay) {
        spinnerOverlay.style.display = 'none'
        spinnerOverlay.style.visibility = 'hidden'
        spinnerOverlay.style.opacity = '0'
        console.log('🎯 Hidden multisynq loading spinner in quest system', { sessionStatus })
      }

      // Also hide any spinner elements with class
      const spinnerElements = document.querySelectorAll('.croquet_spinner')
      spinnerElements.forEach(element => {
        (element as HTMLElement).style.display = 'none'
        ;(element as HTMLElement).style.visibility = 'hidden'
        ;(element as HTMLElement).style.opacity = '0'
      })
    }

    // Hide immediately if present
    hideSpinner()

    // Set up observer to hide spinner when it appears
    const observer = new MutationObserver(() => {
      hideSpinner()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [sessionStatus])

  // Initialize default quests
  useEffect(() => {
    const initializeQuests = () => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      const oneWeekMs = 7 * oneDayMs

      const defaultQuests: Quest[] = [
        // Daily Quests
        {
          id: 'daily-plant-seeds',
          title: 'Plant 5 Seeds',
          description: 'Plant any 5 seeds in your farm',
          type: 'daily',
          reward: { coins: 50, xp: 25 },
          progress: Math.min(seedsPlanted, 5),
          maxProgress: 5,
          completed: seedsPlanted >= 5,
          icon: '🌱',
          category: 'farming',
          expiresAt: now + oneDayMs
        },
        {
          id: 'daily-harvest-crops',
          title: 'Harvest 3 Crops',
          description: 'Harvest any 3 crops from your farm',
          type: 'daily',
          reward: { coins: 30, xp: 15 },
          progress: Math.min(cropsHarvested, 3),
          maxProgress: 3,
          completed: cropsHarvested >= 3,
          icon: '🌾',
          category: 'farming',
          expiresAt: now + oneDayMs
        },
        // Social Quest
        {
          id: 'social-follow-monad',
          title: 'Follow @monad on X',
          description: 'Follow @monad on X (Twitter) to stay updated',
          type: 'social',
          reward: { coins: 100, xp: 50 },
          progress: 0,
          maxProgress: 1,
          completed: false,
          externalLink: 'https://x.com/monad',
          icon: '🐦',
          category: 'social'
        },
        // Weekly Quests
        {
          id: 'weekly-master-farmer',
          title: 'Master Farmer',
          description: 'Harvest 50 crops this week',
          type: 'weekly',
          reward: { coins: 200, xp: 100 },
          progress: Math.min(cropsHarvested, 50),
          maxProgress: 50,
          completed: cropsHarvested >= 50,
          icon: '🏆',
          category: 'farming',
          expiresAt: now + oneWeekMs
        }
      ]

      // Load saved quest progress from localStorage
      const savedQuests = localStorage.getItem('quest-progress')
      if (savedQuests) {
        try {
          const questProgress = JSON.parse(savedQuests)
          defaultQuests.forEach(quest => {
            if (questProgress[quest.id]) {
              quest.progress = questProgress[quest.id].progress || quest.progress
              quest.completed = questProgress[quest.id].completed || quest.completed
            }
          })
        } catch (error) {
          console.error('Error loading quest progress:', error)
        }
      }

      setLocalQuests(defaultQuests)
    }

    initializeQuests()
  }, [seedsPlanted, cropsHarvested])

  // Initialize community quests
  useEffect(() => {
    if (sharedQuests.length === 0) {
      const communityQuests: CommunityQuest[] = [
        {
          id: 'community-plant-seeds',
          title: 'Community Planting',
          description: 'Plant 100 seeds together as a community',
          type: 'community',
          reward: { coins: 500, xp: 250 },
          progress: 0,
          maxProgress: 1,
          completed: false,
          communityProgress: 0,
          communityMaxProgress: 100,
          participantCount: 0,
          participants: [],
          icon: '🌍',
          category: 'community'
        },
        {
          id: 'community-harvest-crops',
          title: 'Harvest Festival',
          description: 'Harvest 200 crops together as a community',
          type: 'community',
          reward: { coins: 750, xp: 375 },
          progress: 0,
          maxProgress: 1,
          completed: false,
          communityProgress: 0,
          communityMaxProgress: 200,
          participantCount: 0,
          participants: [],
          icon: '🎉',
          category: 'community'
        }
      ]

      setSharedQuests(communityQuests)
    }
  }, [sharedQuests.length, setSharedQuests])

  // Update community quest progress (works in both local and multiplayer modes)
  useEffect(() => {
    if (!myId) return

    // Update my progress
    setMyQuestProgress({
      'seeds-planted': seedsPlanted,
      'crops-harvested': cropsHarvested,
      'farm-coins': farmCoins,
      'player-level': playerLevel
    })

    // Update all progress tracking
    setAllQuestProgress(prev => ({
      ...prev,
      [myId]: {
        'seeds-planted': seedsPlanted,
        'crops-harvested': cropsHarvested,
        'farm-coins': farmCoins,
        'player-level': playerLevel
      }
    }))

    // Calculate totals (in local mode, just use my progress; in multiplayer, aggregate all)
    const totalSeeds = Object.values(allQuestProgress || {}).reduce((sum, progress: any) =>
      sum + ((progress && progress['seeds-planted']) || 0), 0) + seedsPlanted
    const totalHarvests = Object.values(allQuestProgress || {}).reduce((sum, progress: any) =>
      sum + ((progress && progress['crops-harvested']) || 0), 0) + cropsHarvested

    // Update community quests
    setSharedQuests(prev => (prev || []).map(quest => {
      if (quest.id === 'community-plant-seeds') {
        return {
          ...quest,
          communityProgress: Math.min(totalSeeds, quest.communityMaxProgress),
          completed: totalSeeds >= quest.communityMaxProgress,
          participantCount: Math.max(Object.keys(allQuestProgress || {}).length, 1),
          participants: Object.keys(allQuestProgress || {}).length > 0 ? Object.keys(allQuestProgress || {}) : [myId || 'local-user']
        }
      }
      if (quest.id === 'community-harvest-crops') {
        return {
          ...quest,
          communityProgress: Math.min(totalHarvests, quest.communityMaxProgress),
          completed: totalHarvests >= quest.communityMaxProgress,
          participantCount: Math.max(Object.keys(allQuestProgress || {}).length, 1),
          participants: Object.keys(allQuestProgress || {}).length > 0 ? Object.keys(allQuestProgress || {}) : [myId || 'local-user']
        }
      }
      return quest
    }))
  }, [seedsPlanted, cropsHarvested, farmCoins, playerLevel, myId, allQuestProgress, setSharedQuests, setAllQuestProgress, setMyQuestProgress])

  const completeQuest = (questId: string) => {
    // Handle social quests with external links
    const quest = localQuests.find(q => q.id === questId)
    if (quest?.externalLink) {
      window.open(quest.externalLink, '_blank')
      
      // Mark as completed after opening link
      setTimeout(() => {
        setLocalQuests(prev => prev.map(q => 
          q.id === questId ? { ...q, completed: true, progress: q.maxProgress } : q
        ))
        
        // Give rewards
        if (quest.reward.coins) addFarmCoins(quest.reward.coins)
        if (quest.reward.xp) addXp(quest.reward.xp)
        
        toast.success(`Quest completed! +${quest.reward.coins} coins, +${quest.reward.xp} XP`)
        
        // Save progress
        const questProgress = JSON.parse(localStorage.getItem('quest-progress') || '{}')
        questProgress[questId] = { completed: true, progress: quest.maxProgress }
        localStorage.setItem('quest-progress', JSON.stringify(questProgress))
      }, 1000)
      
      return
    }

    // Handle regular quest completion
    setLocalQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed && q.progress >= q.maxProgress) {
        // Give rewards
        if (q.reward.coins) addFarmCoins(q.reward.coins)
        if (q.reward.xp) addXp(q.reward.xp)
        
        toast.success(`Quest completed! +${q.reward.coins} coins, +${q.reward.xp} XP`)
        
        // Save progress
        const questProgress = JSON.parse(localStorage.getItem('quest-progress') || '{}')
        questProgress[questId] = { completed: true, progress: q.maxProgress }
        localStorage.setItem('quest-progress', JSON.stringify(questProgress))
        
        return { ...q, completed: true }
      }
      return q
    }))
  }

  const getDailyQuests = () => (localQuests || []).filter(q => q && q.type === 'daily')
  const getWeeklyQuests = () => (localQuests || []).filter(q => q && q.type === 'weekly')
  const getSocialQuests = () => (localQuests || []).filter(q => q && q.type === 'social')
  const getCommunityQuests = () => sharedQuests || []

  return {
    localQuests: localQuests || [],
    sharedQuests: sharedQuests || [],
    completeQuest,
    getDailyQuests,
    getWeeklyQuests,
    getSocialQuests,
    getCommunityQuests,
    connectedUsers: connectedUsers || [],
    sessionStatus: sessionStatus || 'offline'
  }
}

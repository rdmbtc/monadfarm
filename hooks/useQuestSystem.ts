import { useState, useEffect, useContext } from 'react'
import { useStateTogether, useStateTogetherWithPerUserValues, useMyId, useConnectedUsers, useIsTogether } from 'react-together'
import { GameContext } from '../context/game-context'
import toast from 'react-hot-toast'

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

const useSessionStatus = (): CroquetConnectionType => {
  const [connectionStatus, set_connectionStatus] = useState<CroquetConnectionType>('offline')
  const isTogether = useIsTogether()

  useEffect(() => {
    const checkConnectionStatus = () => {
      const spinnerOverlay = document.getElementById('croquet_spinnerOverlay')
      const fatalElement = document.querySelector('.croquet_fatal')

      if      (fatalElement)   set_connectionStatus('fatal') //prettier-ignore
      else if (spinnerOverlay) set_connectionStatus('connecting') //prettier-ignore
      else if (isTogether)     set_connectionStatus('online') //prettier-ignore
      else                     set_connectionStatus('offline') //prettier-ignore
    }

    //initial check
    checkConnectionStatus()

    //set up observer to watch for changes in the body
    const observer = new MutationObserver(checkConnectionStatus)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    return () => observer.disconnect()
  }, [isTogether])

  return connectionStatus
}

export const useQuestSystem = () => {
  const { farmCoins, addFarmCoins, addXp, cropsHarvested, seedsPlanted, playerLevel } = useContext(GameContext)
  const myId = useMyId()
  const connectedUsers = useConnectedUsers()
  const sessionStatus = useSessionStatus()

  // Local quest state
  const [localQuests, setLocalQuests] = useState<Quest[]>([])

  // Shared quest state for multiplayer
  const [sharedQuests, setSharedQuests] = useStateTogether<CommunityQuest[]>('community-quests', [])
  const [myQuestProgress, setMyQuestProgress, allQuestProgress] = useStateTogetherWithPerUserValues<Record<string, number>>('quest-progress', {})

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
          category: 'community',
          requiresMultiplayer: true
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
          category: 'community',
          requiresMultiplayer: true
        }
      ]

      setSharedQuests(communityQuests)
    }
  }, [sharedQuests.length, setSharedQuests])

  // Update community quest progress with real-time multiplayer
  useEffect(() => {
    if (!myId) return

    const totalSeeds = Object.values(allQuestProgress).reduce((sum, progress) => sum + (progress['seeds-planted'] || 0), 0)
    const totalHarvests = Object.values(allQuestProgress).reduce((sum, progress) => sum + (progress['crops-harvested'] || 0), 0)

    setSharedQuests(prev => prev.map(quest => {
      if (quest.id === 'community-plant-seeds') {
        return {
          ...quest,
          communityProgress: totalSeeds,
          completed: totalSeeds >= quest.communityMaxProgress,
          participantCount: Object.keys(allQuestProgress).length,
          participants: Object.keys(allQuestProgress)
        }
      }
      if (quest.id === 'community-harvest-crops') {
        return {
          ...quest,
          communityProgress: totalHarvests,
          completed: totalHarvests >= quest.communityMaxProgress,
          participantCount: Object.keys(allQuestProgress).length,
          participants: Object.keys(allQuestProgress)
        }
      }
      return quest
    }))
  }, [allQuestProgress, myId, setSharedQuests])

  // Update my quest progress
  useEffect(() => {
    if (myId) {
      setMyQuestProgress({
        'seeds-planted': seedsPlanted,
        'crops-harvested': cropsHarvested,
        'farm-coins': farmCoins,
        'player-level': playerLevel
      })
    }
  }, [seedsPlanted, cropsHarvested, farmCoins, playerLevel, myId, setMyQuestProgress])

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

  const getDailyQuests = () => localQuests.filter(q => q.type === 'daily')
  const getWeeklyQuests = () => localQuests.filter(q => q.type === 'weekly')
  const getSocialQuests = () => localQuests.filter(q => q.type === 'social')
  const getCommunityQuests = () => sharedQuests

  return {
    localQuests,
    sharedQuests,
    completeQuest,
    getDailyQuests,
    getWeeklyQuests,
    getSocialQuests,
    getCommunityQuests,
    connectedUsers,
    sessionStatus
  }
}

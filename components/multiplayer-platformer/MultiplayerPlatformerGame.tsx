'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMyId, useConnectedUsers, useIsTogether } from 'react-together'
import { usePlatformerGameModel } from '../../hooks/usePlatformerGameModel'
import { useUnifiedNickname } from '../../hooks/useUnifiedNickname'
import { ReactP5Wrapper } from 'react-p5-wrapper'
import multiplayerPlatformerSketch from '../games/multiplayer-game'
import GameLobby from './GameLobby'
import { Users, MessageCircle, Play, RotateCcw, Gamepad2, Wifi } from 'lucide-react'

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

interface MultiplayerPlatformerGameProps {
  farmCoins?: number
  addFarmCoins?: (amount: number) => void
  nickname?: string
  playerLevel?: number
}

type GameMode = 'single' | 'online'

export default function MultiplayerPlatformerGame({
  farmCoins = 1000,
  addFarmCoins = (amount: number) => { console.log(`Added ${amount} coins`) },
  nickname = "Player",
  playerLevel = 1
}: MultiplayerPlatformerGameProps) {
  // ReactTogether hooks
  const myId = useMyId()
  const connectedUsers = useConnectedUsers()
  const { nickname: currentNickname } = useUnifiedNickname()
  const sessionStatus = useSessionStatus()

  // Game mode and state
  const [localGameMode, setLocalGameMode] = useState<GameMode>('single')
  const [isClient, setIsClient] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [masterVolume, setMasterVolume] = useState(1.0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [retryCount, setRetryCount] = useState(0)

  // Refs
  const gameInstanceRef = useRef<any>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Always use multiplayer model (hooks must be called unconditionally)
  const multiplayerData = usePlatformerGameModel(myId || undefined)

  // Extract multiplayer data with fallbacks - only use in online mode
  const {
    chatMessages = [],
    myPlayer = null,
    otherPlayers = [],
    playerCount = localGameMode === 'online' ? (multiplayerData?.playerCount || 0) : 1,
    gameSession = null,
    joinGame = () => {},
    leaveGame = () => {},
    sendChatMessage = () => {},
    startGame = () => {},
    resetGame = () => {},
    updatePlayerPosition = () => {},
    performPlayerAction = () => {},
    isGameActive = false,
    // New lobby and game state functions
    setGameMode = () => {},
    canStartGame = () => false,
    recordStarCollection = () => {},
    checkLevelComplete = () => false,
    advanceToNextLevel = () => {}
  } = localGameMode === 'online' ? (multiplayerData || {}) : {}

  console.log('🎮 Game State:', {
    localGameMode,
    playerCount,
    myId: myId?.slice(0, 8),
    isClient,
    hasMultiplayerData: !!multiplayerData,
    myPlayer: myPlayer ? `${myPlayer.nickname} (${myPlayer.id.slice(0, 8)})` : 'none',
    otherPlayersCount: otherPlayers.length,
    allPlayersInModel: multiplayerData?.players ? Object.keys(multiplayerData.players).length : 'N/A',
    gameSessionState: gameSession?.state || 'none'
  })

  // Client-side initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

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
        console.log('🎮 Hidden multisynq loading spinner')
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
      document.head.removeChild(style)
    }
  }, [])

  // Connection monitoring
  useEffect(() => {
    if (localGameMode === 'online') {
      if (myId && currentNickname) {
        setConnectionStatus('connected')
        setRetryCount(0)
      } else {
        setConnectionStatus('connecting')
      }
    } else {
      setConnectionStatus('disconnected')
    }
  }, [localGameMode, myId, currentNickname])

  // Enhanced join game with session synchronization - STABLE VERSION WITH RETRY
  useEffect(() => {
    if (localGameMode === 'online' && myId && currentNickname && !myPlayer) {
      console.log('🌐 Joining online game as:', currentNickname, 'ID:', myId?.slice(0, 8))

      const attemptJoin = (attempt: number = 1) => {
        const maxAttempts = 3
        const delay = Math.min(1000 * attempt, 5000) // Exponential backoff, max 5s

        console.log(`🌐 Join attempt ${attempt}/${maxAttempts}`)
        setRetryCount(attempt)

        const joinTimeout = setTimeout(() => {
          try {
            if (multiplayerData?.joinGame) {
              // Enhanced join with session data to ensure players are in same world
              const joinData = {
                playerId: myId,
                nickname: currentNickname,
                sessionId: gameSession?.id || 'default-session',
                gameMode: localGameMode,
                timestamp: Date.now(),
                clientVersion: '1.0.0' // Add version for compatibility
              }

              multiplayerData.joinGame(myId, currentNickname)
              console.log('🌐 Join attempt successful with session data:', {
                sessionId: joinData.sessionId,
                playerId: myId.slice(0, 8),
                nickname: currentNickname
              })
            } else {
              throw new Error('joinGame function not available')
            }
          } catch (error) {
            console.error(`🌐 Join attempt ${attempt} failed:`, error)
            if (attempt < maxAttempts) {
              console.log(`🌐 Retrying in ${delay}ms...`)
              setTimeout(() => attemptJoin(attempt + 1), delay)
            } else {
              console.error('🌐 All join attempts failed')
              setConnectionStatus('error')
            }
          }
        }, delay)

        return joinTimeout
      }

      const timeout = attemptJoin(1)
      return () => clearTimeout(timeout)
    }
  }, [localGameMode, myId, currentNickname, gameSession?.id]) // Added gameSession dependency

  // Leave game when switching to single player mode
  useEffect(() => {
    return () => {
      if (localGameMode === 'online' && myId && leaveGame) {
        console.log('Leaving online game')
        leaveGame(myId)
      }
    }
  }, [localGameMode, myId, leaveGame])

  // Update multiplayer callbacks when dependencies change - STABLE VERSION
  useEffect(() => {
    if (localGameMode === 'online' && gameInstanceRef.current && gameInstanceRef.current.setMultiplayerCallbacks) {
      console.log('🔄 Setting up multiplayer callbacks')
      gameInstanceRef.current.setMultiplayerCallbacks({
        onPlayerUpdate: (playerData: any) => {
          if (myId && multiplayerData?.updatePlayerPosition) {
            multiplayerData.updatePlayerPosition(myId, playerData)
          }
        },
        onPlayerAction: (action: string, data: any) => {
          if (myId && multiplayerData?.performPlayerAction) {
            multiplayerData.performPlayerAction(myId, action, data)
          }
        }
      })
    }
  }, [localGameMode, myId]) // Removed unstable dependencies

  // Enhanced sync for remote players with better error handling and validation
  useEffect(() => {
    if (localGameMode === 'online' && gameInstanceRef.current && gameInstanceRef.current.updateRemotePlayer) {
      // Throttle remote player updates to prevent spam
      const throttleTimeout = setTimeout(() => {
        console.log('🌐 Syncing remote players:', otherPlayers.length, 'My ID:', myId?.slice(0, 8))

        // Ensure we're in the same game session by validating player data
        const validPlayers = otherPlayers.filter((player: any) => {
          return player &&
                 player.id &&
                 player.id !== myId &&
                 typeof player.x === 'number' &&
                 typeof player.y === 'number' &&
                 player.isActive !== false
        })

        console.log('🌐 Valid remote players to sync:', validPlayers.length)

        // Update all valid remote players in the game
        validPlayers.forEach((player: any) => {
          if (gameInstanceRef.current && gameInstanceRef.current.updateRemotePlayer) {
            const playerData = {
              x: Number(player.x) || 0,
              y: Number(player.y) || 0,
              velocityX: Number(player.velocityX) || 0,
              velocityY: Number(player.velocityY) || 0,
              isOnGround: Boolean(player.isOnGround),
              isJumping: Boolean(player.isJumping),
              canDoubleJump: player.canDoubleJump !== false,
              state: player.state || 'idle',
              nickname: player.nickname || `Player${player.id.slice(-4)}`,
              color: player.color,
              score: Number(player.score) || 0,
              lives: Number(player.lives) || 3,
              level: Number(player.level) || 1,
              isActive: player.isActive !== false
            }

            gameInstanceRef.current.updateRemotePlayer(player.id, playerData)
          }
        })

        // Clean up disconnected players
        if (gameInstanceRef.current.getRemotePlayers) {
          const currentRemotePlayers = gameInstanceRef.current.getRemotePlayers()
          const activePlayerIds = new Set(validPlayers.map((p: any) => p.id))

          currentRemotePlayers.forEach((remotePlayer: any) => {
            if (!activePlayerIds.has(remotePlayer.id)) {
              console.log('🌐 Removing disconnected player:', remotePlayer.id)
              if (gameInstanceRef.current.removeRemotePlayer) {
                gameInstanceRef.current.removeRemotePlayer(remotePlayer.id)
              }
            }
          })
        }
      }, 100) // 100ms throttle

      return () => clearTimeout(throttleTimeout)
    }
  }, [localGameMode, otherPlayers, myId])

  // Connection health check
  useEffect(() => {
    if (localGameMode !== 'online') return

    const healthCheckInterval = setInterval(() => {
      // Check if we have a valid connection
      if (myId && multiplayerData) {
        // Connection seems healthy
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected')
        }
      } else {
        // Connection might be unhealthy
        if (connectionStatus === 'connected') {
          console.warn('🌐 Connection health check failed')
          setConnectionStatus('connecting')
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(healthCheckInterval)
  }, [localGameMode, myId, multiplayerData, connectionStatus])

  // Enhanced position sync with better frequency and error handling
  useEffect(() => {
    if (localGameMode !== 'online' || !gameInstanceRef.current || !myId || connectionStatus !== 'connected') return

    console.log('🌐 Starting enhanced position sync for player:', myId?.slice(0, 8))
    let syncAttempts = 0
    const maxSyncAttempts = 5
    let lastSyncTime = 0
    let lastPlayerData: any = null

    const syncInterval = setInterval(() => {
      const now = Date.now()
      // Throttle sync to prevent spam but allow more frequent updates
      if (now - lastSyncTime < 100) return // Min 100ms between syncs (10 FPS)

      try {
        const localPlayerData = gameInstanceRef.current.getLocalPlayerData?.()
        if (localPlayerData && multiplayerData?.updatePlayerPosition) {
          // Only sync if player data has changed significantly
          const hasSignificantChange = !lastPlayerData ||
            Math.abs(localPlayerData.x - lastPlayerData.x) > 1 ||
            Math.abs(localPlayerData.y - lastPlayerData.y) > 1 ||
            localPlayerData.state !== lastPlayerData.state ||
            localPlayerData.isJumping !== lastPlayerData.isJumping ||
            localPlayerData.isOnGround !== lastPlayerData.isOnGround

          if (hasSignificantChange || now - lastSyncTime > 1000) { // Force sync every second
            // Add session validation to ensure we're in the same game
            const enhancedPlayerData = {
              ...localPlayerData,
              sessionId: gameSession?.id || 'default',
              gameMode: localGameMode,
              timestamp: now,
              nickname: currentNickname || `Player${myId.slice(-4)}`
            }

            multiplayerData.updatePlayerPosition(myId, enhancedPlayerData)
            lastPlayerData = { ...localPlayerData }
            syncAttempts = 0 // Reset on success
            lastSyncTime = now

            console.log('🌐 Player position synced:', {
              id: myId.slice(0, 8),
              x: Math.round(localPlayerData.x),
              y: Math.round(localPlayerData.y),
              state: localPlayerData.state
            })
          }
        }
      } catch (error) {
        syncAttempts++
        console.warn(`🌐 Sync attempt ${syncAttempts}/${maxSyncAttempts} failed:`, error)
        if (syncAttempts >= maxSyncAttempts) {
          console.error('🌐 Max sync attempts reached, marking connection as error')
          setConnectionStatus('error')
          clearInterval(syncInterval)
        }
      }
    }, 1000 / 10) // 10 FPS for better responsiveness

    return () => clearInterval(syncInterval)
  }, [localGameMode, myId, connectionStatus, currentNickname, gameSession?.id, multiplayerData])

  // Handle chat message submission
  const handleSendChatMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (chatMessage.trim() && myId && currentNickname) {
      sendChatMessage(myId, currentNickname, chatMessage.trim())
      setChatMessage('')
    }
  }, [chatMessage, myId, currentNickname, sendChatMessage])

  // Handle game start
  const handleStartGame = useCallback(() => {
    console.log('MultiplayerPlatformerGame: Starting game')
    if (localGameMode === 'online') {
      startGame(1, 'cooperative', gameSession?.playMode || 'online')
    }
  }, [localGameMode, startGame, gameSession?.playMode])

  // Handle game reset
  const handleResetGame = useCallback(() => {
    console.log('MultiplayerPlatformerGame: Resetting game')
    if (localGameMode === 'online') {
      resetGame()
    }
  }, [localGameMode, resetGame])

  // Handle game mode change
  const handleGameModeChange = useCallback((mode: 'single' | 'online') => {
    console.log('MultiplayerPlatformerGame: Changing game mode to:', mode)
    setLocalGameMode(mode)
    if (localGameMode === 'online' && setGameMode) {
      setGameMode(mode)
    }
  }, [localGameMode, setGameMode])

  // Create the game sketch - STABLE VERSION TO PREVENT MULTIPLE INSTANCES
  const createGameSketch = useCallback((p: any) => {
    console.log('🎮 Creating game sketch, mode:', localGameMode, 'Instance ID:', Math.random().toString(36).substring(2, 11))

    try {
      // Try to create the real multiplayer game
      console.log('🎮 Attempting to create real game...')
      const game = multiplayerPlatformerSketch(p)

      if (game) {
        console.log('✅ Real game created successfully!')
        gameInstanceRef.current = game

        // Set up game mode and callbacks
        if (game.setGameMode) {
          game.setGameMode(localGameMode)
        }

        if (game.setGameModelCallbacks) {
          game.setGameModelCallbacks({
            recordStarCollection,
            checkLevelComplete,
            advanceToNextLevel
          })
        }

        // Set up multiplayer callbacks only in online mode
        if (localGameMode === 'online' && game.setMultiplayerCallbacks) {
          console.log('🔄 Setting up multiplayer callbacks')
          game.setMultiplayerCallbacks({
            onPlayerUpdate: (playerData: any) => {
              if (myId && updatePlayerPosition) {
                updatePlayerPosition(myId, playerData)
              }
            },
            onPlayerAction: (action: string, data: any) => {
              if (myId && performPlayerAction) {
                performPlayerAction(myId, action, data)
              }
            },
            getCurrentPlayerId: () => myId
          })
        }

        return game
      }
    } catch (error) {
      console.error('❌ Error creating real game:', error)
    }

    // Fallback: Enhanced game with asset loading and lobby system
    console.log('🎮 Using enhanced fallback game with asset loading')

    let assetsLoaded = false
    let gameStarted = false
    let loadingProgress = 0
    const assets: {
      images: Record<string, any>,
      totalAssets: number,
      loadedAssets: number
    } = { images: {}, totalAssets: 0, loadedAssets: 0 }

    // Preload essential assets
    p.preload = () => {
      console.log('🎮 Starting asset preload...')

      const imageAssets = [
        { key: 'player', path: '/defense/noot idle.png' }
      ]

      assets.totalAssets = imageAssets.length

      imageAssets.forEach((asset) => {
        try {
          assets.images[asset.key] = p.loadImage(asset.path,
            () => {
              assets.loadedAssets++
              loadingProgress = (assets.loadedAssets / assets.totalAssets) * 100
              console.log(`✅ Loaded ${asset.key}: ${loadingProgress.toFixed(1)}%`)

              if (assets.loadedAssets >= assets.totalAssets) {
                assetsLoaded = true
                console.log('🎮 All assets loaded!')

                // Auto-start single player mode
                if (localGameMode === 'single') {
                  gameStarted = true
                }
              }
            },
            () => {
              console.warn(`⚠️ Failed to load ${asset.key}`)
              assets.loadedAssets++
              loadingProgress = (assets.loadedAssets / assets.totalAssets) * 100

              if (assets.loadedAssets >= assets.totalAssets) {
                assetsLoaded = true
                if (localGameMode === 'single') {
                  gameStarted = true
                }
              }
            }
          )
        } catch (error) {
          console.error(`❌ Error loading ${asset.key}:`, error)
          assets.loadedAssets++
        }
      })
    }

    p.setup = () => {
      console.log('🎮 Enhanced game setup called')
      p.createCanvas(800, 600)
    }

    p.draw = () => {
      p.background(50, 100, 150)

      if (!assetsLoaded) {
        drawLoadingScreen()
      } else if (localGameMode === 'online' && !gameStarted) {
        drawLobbyScreen()
      } else {
        drawGame()
      }
    }

    const drawLoadingScreen = () => {
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(24)
      p.text('Loading MonFarm Platformer...', p.width/2, p.height/2 - 50)

      // Loading bar
      const barWidth = 300
      const barHeight = 20
      const barX = p.width/2 - barWidth/2
      const barY = p.height/2

      p.stroke(255)
      p.noFill()
      p.rect(barX, barY, barWidth, barHeight)

      p.noStroke()
      p.fill(100, 200, 100)
      p.rect(barX, barY, (loadingProgress / 100) * barWidth, barHeight)

      p.fill(255)
      p.textSize(16)
      p.text(`${loadingProgress.toFixed(1)}%`, p.width/2, p.height/2 + 40)
    }

    const drawLobbyScreen = () => {
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(28)
      p.text('Multiplayer Lobby', p.width/2, p.height/2 - 100)

      p.textSize(18)
      p.text(`Players: ${playerCount}/2`, p.width/2, p.height/2 - 50)

      if (currentNickname) {
        p.textSize(16)
        p.text(`You: ${currentNickname}`, p.width/2, p.height/2 - 20)
      }

      if (playerCount < 2) {
        p.fill(255, 255, 0)
        p.textSize(16)
        p.text('Waiting for more players to join...', p.width/2, p.height/2 + 20)

        // Animated dots
        const dots = '.'.repeat((Math.floor(p.frameCount / 30) % 3) + 1)
        p.text(dots, p.width/2, p.height/2 + 50)
      } else {
        p.fill(100, 255, 100)
        p.textSize(18)
        p.text('Ready to start!', p.width/2, p.height/2 + 20)

        if (!gameStarted) {
          gameStarted = true
          console.log('🎮 Multiplayer: Starting game with', playerCount, 'players')
        }
      }
    }

    const drawGame = () => {
      // Draw game world
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(24)
      p.text('MonFarm Platformer', p.width/2, 50)

      p.textSize(16)
      p.fill(localGameMode === 'online' ? '#00ff00' : '#0088ff')
      p.text(`${localGameMode.toUpperCase()} MODE`, p.width/2, 80)

      // Draw player with loaded asset if available
      const playerX = p.width/2 + Math.sin(p.frameCount * 0.05) * 100
      const playerY = p.height/2 + 50

      if (assets.images.player && assets.images.player.width > 0) {
        p.imageMode(p.CENTER)
        p.image(assets.images.player, playerX, playerY, 50, 50)
      } else {
        p.fill(255, 100, 100)
        p.rect(playerX - 25, playerY - 25, 50, 50)
      }

      // Draw ground
      p.fill(100, 200, 100)
      p.rect(0, p.height/2 + 100, p.width, 100)

      // Draw instructions
      p.fill(255, 255, 255, 200)
      p.textSize(14)
      p.text('Use WASD or Arrow Keys to move • Space to jump', p.width/2, p.height - 40)

      // Connection status
      if (localGameMode === 'online') {
        p.fill(myId ? '#00ff00' : '#ff0000')
        p.textSize(12)
        p.textAlign(p.LEFT, p.TOP)
        p.text(`Status: ${myId ? 'Connected' : 'Connecting...'}`, 10, 10)
        p.text(`Players: ${playerCount}`, 10, 30)
      }
    }

    // Handle keyboard input
    p.keyPressed = () => {
      if (gameStarted && assetsLoaded) {
        console.log('Game input:', p.key)
        if (p.key === ' ') {
          console.log('Jump!')
        }
      }
    }

    console.log('✅ Fallback game setup complete')
  }, [localGameMode]) // REDUCED DEPENDENCIES TO PREVENT RE-CREATION

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-white">Loading multiplayer platformer...</div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden relative">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-red-900 p-2 text-xs text-white">
          Debug: Mode={localGameMode}, MyId={myId?.slice(0,8)}, PlayerCount={playerCount}, IsClient={isClient},
          MyPlayer={myPlayer ? '✓' : '✗'}, OtherPlayers={otherPlayers.length},
          AllPlayers={multiplayerData?.players ? Object.keys(multiplayerData.players).length : 'N/A'},
          GameState={gameSession?.state || 'none'}
          {multiplayerData?.players && (
            <div className="mt-1">
              Players: {Object.values(multiplayerData.players).map((p: any) => `${p.nickname}(${p.id.slice(0,4)})`).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Show Lobby or Game */}
      {localGameMode === 'online' && gameSession?.state === 'lobby' ? (
        <GameLobby
          gameData={multiplayerData || {}}
          myId={myId}
          currentNickname={currentNickname}
          onStartGame={handleStartGame}
          onChangeGameMode={handleGameModeChange}
        />
      ) : (
        <>
          {/* Connection Status */}
          {localGameMode === 'online' && (
        <div className={`p-2 text-xs text-white ${
          connectionStatus === 'connected' ? 'bg-green-900' :
          connectionStatus === 'connecting' ? 'bg-yellow-900' :
          connectionStatus === 'error' ? 'bg-red-900' : 'bg-blue-900'
        }`}>
          🌐 {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? `Connecting... ${retryCount > 0 ? `(Attempt ${retryCount})` : ''}` :
               connectionStatus === 'error' ? 'Connection Failed' : 'Disconnected'} |
          Players: {playerCount} |
          Status: {myPlayer ? 'In Game' : 'Joining...'}
          {connectionStatus === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="ml-2 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Game Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">MonFarm Platformer</h3>

            {/* Game Mode Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGameModeChange('single')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  localGameMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Gamepad2 className="h-4 w-4" />
                Single Player
              </button>
              <button
                onClick={() => handleGameModeChange('online')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  localGameMode === 'online'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Wifi className="h-4 w-4" />
                Online Mode
              </button>
            </div>

            {/* Player Count */}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users className="h-4 w-4" />
              <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chat Toggle (only in online mode) */}
            {localGameMode === 'online' && (
              <button
                onClick={() => setShowChat(!showChat)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
            )}

            {localGameMode === 'online' && !isGameActive && (
              <button
                onClick={handleStartGame}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
              >
                <Play className="h-4 w-4" />
                Start Game
              </button>
            )}

            {localGameMode === 'online' && (
              <button
                onClick={handleResetGame}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Game Canvas - Full Width */}
      <div className="w-full bg-gray-800 flex justify-center items-center min-h-[600px]">
        {isClient ? (
          <ReactP5Wrapper
            key="multiplayer-platformer-game"
            sketch={createGameSketch}
          />
        ) : (
          <div className="text-white text-xl">Loading game...</div>
        )}
      </div>

      {/* Chat Panel (only in online mode) - Overlay */}
      {localGameMode === 'online' && showChat && (
        <div className="absolute top-16 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-700">
            <h4 className="text-white font-semibold">Game Chat</h4>
          </div>

          {/* Chat Messages */}
          <div className="p-3 overflow-y-auto max-h-64">
            {chatMessages.map((message) => (
              <div key={message.id} className="mb-2">
                <div className="text-xs text-gray-400">
                  {message.type === 'system' ? (
                    <span className="text-yellow-400">System</span>
                  ) : (
                    <span className="text-blue-400">{message.nickname}</span>
                  )}
                </div>
                <div className="text-sm text-white">{message.text}</div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm"
                maxLength={100}
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
        </>
      )}
    </div>
  )
}

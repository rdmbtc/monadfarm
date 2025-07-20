'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMyId, useConnectedUsers } from 'react-together'
import { usePlatformerGameModel } from '../../hooks/usePlatformerGameModel'
import { useUnifiedNickname } from '../../hooks/useUnifiedNickname'
import { ReactP5Wrapper } from 'react-p5-wrapper'
import multiplayerPlatformerSketch from '../games/multiplayer-game'
import { Users, MessageCircle, Play, RotateCcw, Gamepad2, Wifi } from 'lucide-react'

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

  // Game mode and state
  const [gameMode, setGameMode] = useState<GameMode>('single')
  const [isClient, setIsClient] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [masterVolume, setMasterVolume] = useState(1.0)

  // Refs
  const gameInstanceRef = useRef<any>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Conditionally use multiplayer model only in online mode
  const multiplayerData = gameMode === 'online' ? usePlatformerGameModel(myId || undefined) : null

  // Extract multiplayer data with fallbacks
  const {
    chatMessages = [],
    myPlayer = null,
    otherPlayers = [],
    playerCount = gameMode === 'online' ? (multiplayerData?.playerCount || 0) : 1,
    joinGame = () => {},
    leaveGame = () => {},
    sendChatMessage = () => {},
    startGame = () => {},
    resetGame = () => {},
    updatePlayerPosition = () => {},
    performPlayerAction = () => {},
    isGameActive = false
  } = multiplayerData || {}

  console.log('🎮 Game State:', { gameMode, playerCount, myId, isClient, hasMultiplayerData: !!multiplayerData })

  // Client-side initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Join game when switching to online mode
  useEffect(() => {
    if (gameMode === 'online' && myId && currentNickname && !myPlayer && joinGame) {
      console.log('Joining online game as:', currentNickname)
      joinGame(myId, currentNickname)
    }
  }, [gameMode, myId, currentNickname, myPlayer, joinGame])

  // Leave game when switching to single player mode
  useEffect(() => {
    return () => {
      if (gameMode === 'online' && myId && leaveGame) {
        console.log('Leaving online game')
        leaveGame(myId)
      }
    }
  }, [gameMode, myId, leaveGame])

  // Sync remote players with the multiplayer game
  useEffect(() => {
    if (gameInstanceRef.current && gameInstanceRef.current.updateRemotePlayer) {
      // Update all remote players in the game
      otherPlayers.forEach((player: any) => {
        gameInstanceRef.current.updateRemotePlayer(player.id, {
          x: player.x,
          y: player.y,
          velocityX: player.velocityX,
          velocityY: player.velocityY,
          isOnGround: player.isOnGround,
          isJumping: player.isJumping,
          canDoubleJump: player.canDoubleJump,
          state: player.state,
          nickname: player.nickname,
          color: player.color,
          isActive: player.isActive
        })
      })
    }
  }, [otherPlayers])

  // Sync local player position periodically
  useEffect(() => {
    if (!gameInstanceRef.current || !myId) return

    const syncInterval = setInterval(() => {
      const localPlayerData = gameInstanceRef.current.getLocalPlayerData?.()
      if (localPlayerData) {
        updatePlayerPosition(myId, localPlayerData)
      }
    }, 1000 / 30) // 30 FPS sync rate

    return () => clearInterval(syncInterval)
  }, [myId, updatePlayerPosition])

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
    if (gameMode === 'online') {
      startGame(1, 'cooperative')
    }
  }, [gameMode, startGame])

  // Handle game reset
  const handleResetGame = useCallback(() => {
    console.log('MultiplayerPlatformerGame: Resetting game')
    if (gameMode === 'online') {
      resetGame()
    }
  }, [gameMode, resetGame])

  // Create the game sketch - SIMPLE TEST VERSION
  const createGameSketch = useCallback((p: any) => {
    console.log('🎮 Creating game sketch, mode:', gameMode)

    // Simple test sketch first
    p.setup = () => {
      console.log('🎮 P5 Setup called')
      p.createCanvas(800, 600)
      console.log('🎮 Canvas created: 800x600')
    }

    p.draw = () => {
      // Simple test draw
      p.background(50, 100, 150)
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(24)
      p.text(`MonFarm Platformer - ${gameMode.toUpperCase()} MODE`, p.width/2, p.height/2 - 50)
      p.textSize(16)
      p.text(`Players: ${playerCount}`, p.width/2, p.height/2)
      p.text('Game is loading...', p.width/2, p.height/2 + 30)

      // Draw a simple moving rectangle
      p.fill(255, 100, 100)
      p.rect(p.width/2 - 25 + Math.sin(p.frameCount * 0.05) * 100, p.height/2 + 100, 50, 50)
    }

    console.log('✅ Simple game sketch created')
    return p
  }, [gameMode, playerCount])

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
          Debug: Mode={gameMode}, MyId={myId}, PlayerCount={playerCount}, IsClient={isClient}
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
                onClick={() => setGameMode('single')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  gameMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Gamepad2 className="h-4 w-4" />
                Single Player
              </button>
              <button
                onClick={() => setGameMode('online')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  gameMode === 'online'
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
            {gameMode === 'online' && (
              <button
                onClick={() => setShowChat(!showChat)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
            )}

            {gameMode === 'online' && !isGameActive && (
              <button
                onClick={handleStartGame}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
              >
                <Play className="h-4 w-4" />
                Start Game
              </button>
            )}

            {gameMode === 'online' && (
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
      <div className="w-full">
        <ReactP5Wrapper
          key={`game-${gameMode}`}
          sketch={createGameSketch}
          volume={masterVolume}
          isActive={true}
        />
      </div>

      {/* Chat Panel (only in online mode) - Overlay */}
      {gameMode === 'online' && showChat && (
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
    </div>
  )
}

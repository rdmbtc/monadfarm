'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMyId, useConnectedUsers } from 'react-together'
import { usePlatformerGameModel } from '../../hooks/usePlatformerGameModel'
import { useUnifiedNickname } from '../../hooks/useUnifiedNickname'
import { ReactP5Wrapper } from 'react-p5-wrapper'
import multiplayerPlatformerSketch from '../games/multiplayer-game'
import { Users, MessageCircle, Play, RotateCcw, Trophy } from 'lucide-react'

interface MultiplayerPlatformerGameProps {
  farmCoins?: number
  addFarmCoins?: (amount: number) => void
  nickname?: string
  playerLevel?: number
}

export default function MultiplayerPlatformerGame({
  farmCoins = 1000,
  addFarmCoins = (amount: number) => { console.log(`Added ${amount} coins`) },
  nickname = "Player",
  playerLevel = 1
}: MultiplayerPlatformerGameProps) {
  // ReactTogether hooks with error handling
  let myId: string | null = null
  let connectedUsers: any[] = []

  try {
    myId = useMyId()
    connectedUsers = useConnectedUsers()
  } catch (error) {
    console.warn('MultiplayerPlatformerGame: ReactTogether hooks not available:', error)
    // Fallback values are already set above
  }

  const { nickname: currentNickname } = useUnifiedNickname()
  
  // Game state
  const [isClient, setIsClient] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [masterVolume, setMasterVolume] = useState(1.0)
  
  // Refs
  const gameInstanceRef = useRef<any>(null)
  const p5InstanceRef = useRef<any>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  
  // Use the platformer game model
  const {
    players,
    gameSession,
    gameEvents,
    chatMessages,
    myPlayer,
    otherPlayers,
    isGameActive,
    playerCount,
    joinGame,
    leaveGame,
    updatePlayerPosition,
    performPlayerAction,
    sendChatMessage,
    startGame,
    resetGame
  } = usePlatformerGameModel(myId, currentNickname || nickname)

  // Client-side initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Join game when component mounts
  useEffect(() => {
    if (myId && currentNickname && !myPlayer) {
      console.log('MultiplayerPlatformerGame: Joining game as:', currentNickname)
      joinGame(myId, currentNickname)
    }
  }, [myId, currentNickname, myPlayer, joinGame])

  // Leave game when component unmounts
  useEffect(() => {
    return () => {
      if (myId) {
        console.log('MultiplayerPlatformerGame: Leaving game')
        leaveGame(myId)
      }
    }
  }, [myId, leaveGame])

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
    startGame(1, 'cooperative')
    setGameStarted(true)
  }, [startGame])

  // Handle game reset
  const handleResetGame = useCallback(() => {
    console.log('MultiplayerPlatformerGame: Resetting game')
    resetGame()
    setGameStarted(false)
  }, [resetGame])

  // Create the multiplayer sketch wrapper
  const createMultiplayerSketch = useCallback((p: any) => {
    console.log('MultiplayerPlatformerGame: Creating multiplayer sketch')

    // Store p5 instance
    p5InstanceRef.current = p

    // Create the multiplayer game sketch
    const multiplayerGame = multiplayerPlatformerSketch(p)

    // Store game instance
    gameInstanceRef.current = multiplayerGame
    
    // Set up multiplayer callbacks
    if (multiplayerGame && multiplayerGame.setMultiplayerCallbacks) {
      multiplayerGame.setMultiplayerCallbacks({
        onPlayerUpdate: (playerData: any) => {
          if (myId) {
            updatePlayerPosition(myId, playerData)
          }
        },
        onPlayerAction: (action: string, data: any) => {
          if (myId) {
            performPlayerAction(myId, action, data)
          }
        }
      })
    }

    return multiplayerGame
  }, [myId, myPlayer, otherPlayers, playerCount, gameSession, updatePlayerPosition, performPlayerAction])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-white">Loading multiplayer platformer...</div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      {/* Game Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">MonFarm Platformer - Multiplayer</h3>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users className="h-4 w-4" />
              <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
            
            {!isGameActive && (
              <button
                onClick={handleStartGame}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
              >
                <Play className="h-4 w-4" />
                Start Game
              </button>
            )}
            
            <button
              onClick={handleResetGame}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Game Canvas */}
        <div className="flex-1">
          <ReactP5Wrapper 
            sketch={createMultiplayerSketch}
            volume={masterVolume}
            isActive={true}
          />
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h4 className="text-white font-semibold">Game Chat</h4>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto max-h-64">
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

      {/* Volume Control */}
      <div className="bg-gray-900 p-2 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="flex-1 max-w-32"
          />
          <span className="text-sm text-gray-300">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMyId } from 'react-together'
import { usePlatformerGameModel } from '../../hooks/usePlatformerGameModel'
import { useUnifiedNickname } from '../../hooks/useUnifiedNickname'
import { ReactP5Wrapper } from 'react-p5-wrapper'
import platformerSketch from '../games/game'
import { Users, MessageCircle, Gamepad2, Wifi, WifiOff } from 'lucide-react'

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
  const { nickname: currentNickname } = useUnifiedNickname()
  
  // Game mode and state
  const [gameMode, setGameMode] = useState<GameMode>('single')
  const [isClient, setIsClient] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [masterVolume, setMasterVolume] = useState(1.0)
  
  // Refs
  const gameInstanceRef = useRef<any>(null)
  const p5InstanceRef = useRef<any>(null)
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
    sendChatMessage = () => {}
  } = multiplayerData || {}

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

  // Handle chat message submission
  const handleSendChatMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (chatMessage.trim() && myId && currentNickname && sendChatMessage) {
      sendChatMessage(myId, currentNickname, chatMessage.trim())
      setChatMessage('')
    }
  }, [chatMessage, myId, currentNickname, sendChatMessage])

  // Create the game sketch (same for both modes, but online mode will sync state)
  const createGameSketch = useCallback((p: any) => {
    console.log('Creating platformer game sketch, mode:', gameMode)
    
    // Store p5 instance
    p5InstanceRef.current = p
    
    // Create the base game
    const game = platformerSketch(p)
    
    // Store game instance
    gameInstanceRef.current = game
    
    return game
  }, [gameMode])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-white">Loading platformer game...</div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
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
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Game Canvas */}
        <div className="flex-1">
          <ReactP5Wrapper 
            sketch={createGameSketch}
            volume={masterVolume}
            isActive={true}
          />
        </div>

        {/* Chat Panel (only in online mode) */}
        {gameMode === 'online' && showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h4 className="text-white font-semibold">Game Chat</h4>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto max-h-64">
              {(chatMessages || []).map((message) => (
                <div key={message.id || Math.random()} className="mb-2">
                  <div className="text-xs text-gray-400">
                    {message.type === 'system' ? (
                      <span className="text-yellow-400">System</span>
                    ) : (
                      <span className="text-blue-400">{message.nickname || 'Unknown'}</span>
                    )}
                  </div>
                  <div className="text-sm text-white">{message.text || ''}</div>
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

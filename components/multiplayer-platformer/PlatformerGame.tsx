'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ReactP5Wrapper } from 'react-p5-wrapper'
import platformerSketch from '../games/game'
import { Play, RotateCcw, Gamepad2 } from 'lucide-react'

// Simplified single-player platformer game component

interface PlatformerGameProps {
  farmCoins?: number
  addFarmCoins?: (amount: number) => void
  nickname?: string
  playerLevel?: number
}

export default function PlatformerGame({
  farmCoins = 1000,
  addFarmCoins = (amount: number) => { console.log(`Added ${amount} coins`) },
  nickname = "Player",
  playerLevel = 1
}: PlatformerGameProps) {
  // Simple game state
  const [isClient, setIsClient] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)

  // Refs
  const gameInstanceRef = useRef<any>(null)

  // Simple game functions
  const startGame = useCallback(() => {
    setGameStarted(true)
    console.log('🎮 Starting single-player game')
  }, [])

  const resetGame = useCallback(() => {
    setGameStarted(false)
    setScore(0)
    console.log('🎮 Resetting game')
  }, [])

  console.log('🎮 Single-player Game State:', {
    isClient,
    gameStarted,
    score
  })

  // Client-side initialization
  useEffect(() => {
    setIsClient(true)
    console.log('🎮 Single-player platformer initialized')
  }, [])

  // Create full platformer game sketch using the complete game implementation
  const createGameSketch = useCallback((p: any) => {
    console.log('🎮 Creating full MonFarm platformer game')

    // Import and initialize the complete platformer game
    const gameInstance = platformerSketch(p)

    // Store reference for external control
    gameInstanceRef.current = gameInstance

    // Set up game callbacks for score updates
    if (gameInstance && gameInstance.setGameCallbacks) {
      gameInstance.setGameCallbacks({
        onScoreUpdate: (newScore: number) => {
          setScore(newScore)
        },
        onGameStart: () => {
          setGameStarted(true)
          console.log('🎮 Full platformer game started')
        },
        onGameReset: () => {
          setGameStarted(false)
          setScore(0)
          console.log('🎮 Full platformer game reset')
        }
      })
    }

    console.log('✅ Full platformer game setup complete')
    return gameInstance

  }, [gameStarted, score])

  // Enhanced start game function that works with the full game
  const enhancedStartGame = useCallback(() => {
    if (gameInstanceRef.current && gameInstanceRef.current.startGame) {
      gameInstanceRef.current.startGame()
    } else {
      setGameStarted(true)
    }
    console.log('🎮 Starting full platformer game')
  }, [])

  // Enhanced reset game function that works with the full game
  const enhancedResetGame = useCallback(() => {
    if (gameInstanceRef.current && gameInstanceRef.current.resetGame) {
      gameInstanceRef.current.resetGame()
    } else {
      setGameStarted(false)
      setScore(0)
    }
    console.log('🎮 Resetting full platformer game')
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white">Loading platformer game...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden relative">
      {/* Game Status Bar */}
      <div className="bg-gray-900 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-white text-sm font-medium">Single Player</span>
            </div>
            <div className="text-gray-400 text-sm">
              Score: {score}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={enhancedResetGame}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              onClick={enhancedStartGame}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              {gameStarted ? 'Restart' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center items-center bg-black">
        <ReactP5Wrapper 
          sketch={createGameSketch}
          key="single-player-platformer"
        />
      </div>

      {/* Game Instructions */}
      <div className="bg-gray-900 p-3 border-t border-gray-700">
        <div className="text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span>🎮 WASD/Arrow Keys: Move</span>
            <span>⏰ Space: Jump</span>
            <span>⭐ Collect ALL stars to advance</span>
            <span>👹 Stomp enemies for combos</span>
            <span>🏆 Complete levels by collecting every star</span>
          </div>
        </div>
      </div>
    </div>
  )
}

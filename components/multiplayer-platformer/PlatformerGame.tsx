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

  // Create simple single-player game sketch
  const createGameSketch = useCallback((p: any) => {
    console.log('🎮 Creating single-player platformer game')

    let assetsLoaded = false
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
                setGameStarted(true)
                console.log('🎮 All assets loaded! Game ready to start.')
              }
            },
            () => {
              console.warn(`⚠️ Failed to load ${asset.key}`)
              assets.loadedAssets++
              loadingProgress = (assets.loadedAssets / assets.totalAssets) * 100
              
              if (assets.loadedAssets >= assets.totalAssets) {
                assetsLoaded = true
                setGameStarted(true)
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
      console.log('🎮 Game setup called')
      p.createCanvas(800, 600)
    }

    p.draw = () => {
      p.background(50, 100, 150)
      
      if (!assetsLoaded) {
        drawLoadingScreen()
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

    const drawGame = () => {
      // Draw game world
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(24)
      p.text('MonFarm Platformer', p.width/2, 50)
      
      p.textSize(16)
      p.fill('#0088ff')
      p.text('SINGLE PLAYER MODE', p.width/2, 80)
      
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
      
      // Score display
      p.fill(255)
      p.textSize(16)
      p.textAlign(p.LEFT, p.TOP)
      p.text(`Score: ${score}`, 20, 20)
    }

    // Handle keyboard input
    p.keyPressed = () => {
      if (gameStarted && assetsLoaded) {
        console.log('Game input:', p.key)
        if (p.key === ' ') {
          console.log('Jump!')
          setScore(prev => prev + 10) // Simple scoring for demo
        }
      }
    }

    console.log('✅ Single-player game sketch setup complete')
    return { 
      startGame: () => setGameStarted(true),
      resetGame: () => { setGameStarted(false); setScore(0) },
      isReady: () => assetsLoaded
    }
  }, [gameStarted, score])

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
              onClick={resetGame}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              onClick={startGame}
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
          <div className="flex items-center justify-center gap-4">
            <span>🎮 Use WASD or Arrow Keys to move</span>
            <span>⏰ Space to jump</span>
            <span>🎯 Collect items to increase score</span>
          </div>
        </div>
      </div>
    </div>
  )
}

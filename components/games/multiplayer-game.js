// Multiplayer-enhanced version of the platformer game
// Extends the base game with multiplayer functionality

import platformerSketch from './game'

export default function multiplayerPlatformerSketch(p) {
  // Prevent multiple instances
  const instanceId = Math.random().toString(36).substring(2, 11)
  console.log('🎮 MultiplayerGame: Creating instance', instanceId)

  // Store the base game instance
  let baseGame = null

  // Multiplayer-specific state
  let localPlayer = null
  let remotePlayers = new Map() // Map of playerId -> player object
  let multiplayerCallbacks = {
    onPlayerUpdate: null,
    onPlayerAction: null,
    onGameEvent: null
  }

  // Game mode and multiplayer model callbacks
  let gameModelCallbacks = {
    recordStarCollection: null,
    checkLevelComplete: null,
    advanceToNextLevel: null
  }

  // CRITICAL: Initialize base game immediately to set up preload function
  console.log('🎮 MultiplayerGame: Initializing base game for asset loading, instance:', instanceId)
  baseGame = platformerSketch(p)

  // Store reference to the local player
  if (baseGame && baseGame.getPlayer) {
    localPlayer = baseGame.getPlayer()
  }

  // The base game has now set up p.preload, p.setup, and p.draw
  // We need to wrap the setup and draw functions to add multiplayer functionality

  // Store the original setup function that was set by the base game
  const originalSetup = p.setup

  // Override setup to add multiplayer functionality
  p.setup = () => {
    console.log('MultiplayerGame: Enhanced setup with multiplayer features')

    // Call the original base game setup first
    if (originalSetup) {
      originalSetup()
    } else {
      console.error('MultiplayerGame: No original setup function found!')
      // Fallback setup
      p.createCanvas(800, 600)
      p.background(100, 150, 200)
    }

    // Set up game mode callbacks for multiplayer after base setup
    if (baseGame && baseGame.setMultiplayerCallbacks) {
      console.log('MultiplayerGame: Setting up multiplayer callbacks')
      baseGame.setMultiplayerCallbacks({
        onStarCollected: (starId, data) => {
          console.log('MultiplayerGame: Star collected:', starId, data)
          if (gameModelCallbacks.recordStarCollection) {
            // Get current player ID from multiplayer callbacks
            const playerId = multiplayerCallbacks.getCurrentPlayerId?.() || 'local'
            gameModelCallbacks.recordStarCollection(playerId, starId)
          }
        },
        onLevelComplete: (level) => {
          console.log('MultiplayerGame: Level complete:', level)
          if (gameModelCallbacks.advanceToNextLevel) {
            gameModelCallbacks.advanceToNextLevel()
          }
        },
        checkCanAdvanceLevel: () => {
          if (gameModelCallbacks.checkLevelComplete) {
            return gameModelCallbacks.checkLevelComplete()
          }
          return false
        }
      })
    }
  }
  
  // Override the base game's draw function
  p.draw = () => {
    // Call base draw if it exists
    if (baseGame && baseGame.draw) {
      baseGame.draw()
    } else {
      // Fallback draw
      p.background(100, 150, 200)
      p.fill(255)
      p.textAlign(p.CENTER)
      p.textSize(24)
      p.text('Multiplayer Platformer Loading...', p.width/2, p.height/2)
    }
    
    // Draw remote players
    drawRemotePlayers()
    
    // Draw multiplayer UI
    drawMultiplayerUI()
  }
  
  // Function to draw remote players
  const drawRemotePlayers = () => {
    if (remotePlayers.size === 0) return
    
    p.push()
    
    for (const [, remotePlayer] of remotePlayers) {
      if (!remotePlayer.isActive) continue
      
      // Apply camera offset (same as local player)
      const cameraX = localPlayer ? localPlayer.x - p.width / 2 : 0
      const drawX = remotePlayer.x - cameraX
      const drawY = remotePlayer.y
      
      // Only draw if player is on screen
      if (drawX > -50 && drawX < p.width + 50) {
        // Try to get the noot character image from the base game
        const nootImg = baseGame && baseGame.nootIdleImg ? baseGame.nootIdleImg : null

        if (nootImg) {
          // Draw the same PNG character as the local player
          p.push()
          p.translate(drawX, drawY)
          p.imageMode(p.CENTER)

          // Apply color tint to differentiate players
          const playerColor = remotePlayer.color || '#4ECDC4'
          // Convert hex color to RGB for tinting
          const r = parseInt(playerColor.slice(1, 3), 16)
          const g = parseInt(playerColor.slice(3, 5), 16)
          const b = parseInt(playerColor.slice(5, 7), 16)
          p.tint(r, g, b, 200) // Apply color tint with some transparency

          // Flip image based on direction (if available)
          if (remotePlayer.velocityX < 0) {
            p.scale(-1, 1)
          }

          // Draw the character image (same size as local player: width: 45, height: 55)
          p.image(nootImg, 0, 0, 45, 55)
          p.noTint()
          p.pop()
        } else {
          // Fallback to rectangle if image not available
          const playerColor = remotePlayer.color || '#4ECDC4' // Default to teal instead of red
          p.fill(playerColor)
          p.stroke(255)
          p.strokeWeight(2)
          p.rectMode(p.CENTER)
          p.rect(drawX, drawY, 45, 55)
        }

        // Draw player nickname above
        p.fill(255)
        p.noStroke()
        p.textAlign(p.CENTER)
        p.textSize(12)
        p.text(remotePlayer.nickname || 'Player', drawX, drawY - 35)

        // Draw state indicator
        if (remotePlayer.state === 'jump') {
          p.fill(255, 255, 0, 150)
          p.ellipse(drawX, drawY, 60, 60)
        }
      }
    }
    
    p.pop()
  }
  
  // Function to draw multiplayer UI
  const drawMultiplayerUI = () => {
    p.push()
    
    // Draw player count
    p.fill(0, 0, 0, 150)
    p.noStroke()
    p.rect(10, 10, 200, 30)
    p.fill(255)
    p.textAlign(p.LEFT)
    p.textSize(14)
    p.text(`Players: ${remotePlayers.size + 1}`, 20, 30)
    
    // Draw connection status
    p.fill(0, 0, 0, 150)
    p.rect(10, 50, 200, 30)
    p.fill(remotePlayers.size > 0 ? p.color(0, 255, 0) : p.color(255, 255, 0))
    p.text(remotePlayers.size > 0 ? 'Connected' : 'Waiting for players...', 20, 70)
    
    p.pop()
  }
  
  // Function to update remote player data
  const updateRemotePlayer = (playerId, playerData) => {
    if (!playerId || !playerData) return
    
    const existingPlayer = remotePlayers.get(playerId)
    
    if (existingPlayer) {
      // Update existing player
      Object.assign(existingPlayer, playerData, {
        lastUpdate: Date.now(),
        isActive: true
      })
    } else {
      // Add new remote player
      remotePlayers.set(playerId, {
        id: playerId,
        ...playerData,
        lastUpdate: Date.now(),
        isActive: true
      })
      console.log('MultiplayerGame: Added remote player:', playerId)
    }
  }
  
  // Function to remove remote player
  const removeRemotePlayer = (playerId) => {
    if (remotePlayers.has(playerId)) {
      remotePlayers.delete(playerId)
      console.log('MultiplayerGame: Removed remote player:', playerId)
    }
  }
  
  // Function to get local player data for synchronization
  const getLocalPlayerData = () => {
    if (!localPlayer) return null
    
    return {
      x: localPlayer.x,
      y: localPlayer.y,
      velocityX: localPlayer.velocityX,
      velocityY: localPlayer.velocityY,
      isOnGround: localPlayer.isOnGround,
      isJumping: localPlayer.isJumping,
      canDoubleJump: localPlayer.canDoubleJump,
      state: localPlayer.state,
      score: localPlayer.score || 0,
      lives: localPlayer.lives || 3,
      level: localPlayer.level || 1
    }
  }
  
  // Function to handle player actions for multiplayer
  const handlePlayerAction = (action, data) => {
    console.log('MultiplayerGame: Player action:', action, data)
    
    // Trigger callback if set
    if (multiplayerCallbacks.onPlayerAction) {
      multiplayerCallbacks.onPlayerAction(action, data)
    }
  }
  
  // Override key handling to broadcast actions
  const originalKeyPressed = p.keyPressed
  p.keyPressed = () => {
    // Call original key handler
    if (originalKeyPressed) {
      originalKeyPressed()
    }
    
    // Broadcast jump action
    if (p.key === ' ' || p.keyCode === 32) {
      handlePlayerAction('jump', { timestamp: Date.now() })
    }
  }
  
  // Function to set multiplayer callbacks
  const setMultiplayerCallbacks = (callbacks) => {
    multiplayerCallbacks = { ...multiplayerCallbacks, ...callbacks }
  }
  
  // Function to cleanup inactive players
  const cleanupInactivePlayers = () => {
    const now = Date.now()
    const timeout = 10000 // 10 seconds
    
    for (const [playerId, player] of remotePlayers) {
      if (now - player.lastUpdate > timeout) {
        remotePlayers.delete(playerId)
        console.log('MultiplayerGame: Cleaned up inactive player:', playerId)
      }
    }
  }
  
  // Cleanup interval
  setInterval(cleanupInactivePlayers, 5000)
  
  // Function to set game mode (delegate to base game)
  const setGameMode = (mode) => {
    console.log('MultiplayerGame: Setting game mode to:', mode)
    if (baseGame && baseGame.setGameMode) {
      baseGame.setGameMode(mode)
    }
  }

  // Function to set game model callbacks (delegate to base game)
  const setGameModelCallbacks = (callbacks) => {
    console.log('MultiplayerGame: Setting game model callbacks:', Object.keys(callbacks))
    gameModelCallbacks = { ...gameModelCallbacks, ...callbacks }
    if (baseGame && baseGame.setMultiplayerCallbacks) {
      baseGame.setMultiplayerCallbacks(callbacks)
    }
  }

  // Public API for multiplayer functionality
  return {
    // Base game access
    getBaseGame: () => baseGame,
    getLocalPlayer: () => localPlayer,

    // Multiplayer functions
    updateRemotePlayer,
    removeRemotePlayer,
    getLocalPlayerData,
    setMultiplayerCallbacks,
    handlePlayerAction,

    // Game mode functions
    setGameMode,
    setGameModelCallbacks,

    // State access
    getRemotePlayers: () => Array.from(remotePlayers.values()),
    getPlayerCount: () => remotePlayers.size + 1,

    // Utility
    isMultiplayerActive: () => remotePlayers.size > 0
  }
}

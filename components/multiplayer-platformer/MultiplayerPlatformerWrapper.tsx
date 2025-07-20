'use client'

import React from 'react'
import { ReactTogether } from 'react-together'
import { ReactTogetherErrorBoundary } from './ReactTogetherErrorBoundary'
import MultiplayerPlatformerGame from './MultiplayerPlatformerGame'

interface MultiplayerPlatformerWrapperProps {
  farmCoins?: number
  addFarmCoins?: (amount: number) => void
  nickname?: string
  playerLevel?: number
}



// Main wrapper component with API key check and ReactTogether setup
export default function MultiplayerPlatformerWrapper(props: MultiplayerPlatformerWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY

  console.log('MultiplayerPlatformerWrapper: Initializing with API key:', apiKey ? 'Present' : 'Missing')

  if (!apiKey) {
    return (
      <div className="min-h-[400px] bg-black flex items-center justify-center rounded-lg border border-gray-700">
        <div className="text-center p-6">
          <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ Multiplayer Unavailable</h3>
          <p className="text-gray-300 mb-2">
            React Together API key not found.
          </p>
          <p className="text-sm text-gray-500">
            Playing in single-player mode instead.
          </p>
          {/* Fallback to single-player mode */}
          <div className="mt-4">
            <div className="text-white">Single-player platformer would go here</div>
          </div>
        </div>
      </div>
    )
  }

  console.log('MultiplayerPlatformerWrapper: Initializing ReactTogether session for multiplayer platformer')

  return (
    <ReactTogetherErrorBoundary>
      <ReactTogether
        sessionParams={{
          apiKey: apiKey,
          appId: "monfarm.platformer.multiplayer.stable",
          name: "monfarm-platformer-main-lobby",
          password: "public"
        }}
        rememberUsers={true}
        deriveNickname={(_userId: string) => {
          // Custom logic to derive initial nickname from localStorage
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem('player-nickname')
            if (stored && stored.trim() !== '') {
              console.log('🎮 Using stored nickname:', stored)
              return stored
            }
          }
          // Fallback to a platformer-themed name if no stored nickname
          const adjectives = ["Swift", "Brave", "Nimble", "Bold", "Quick", "Clever", "Mighty", "Agile", "Daring", "Heroic"]
          const heroes = ["Jumper", "Runner", "Explorer", "Adventurer", "Hero", "Champion", "Warrior", "Scout", "Ranger", "Guardian"]
          const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
          const hero = heroes[Math.floor(Math.random() * heroes.length)]
          const fallbackName = `${adj} ${hero}`
          console.log('🎮 Using fallback nickname:', fallbackName)
          return fallbackName
        }}
      >
        <MultiplayerPlatformerGame {...props} />
      </ReactTogether>
    </ReactTogetherErrorBoundary>
  )
}

"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { ReactTogether } from 'react-together'
import { ReactTogetherErrorBoundary } from '../../components/multiplayer-platformer/ReactTogetherErrorBoundary'

// Dynamically import components that use browser-only features
const MonFarmSocialHub = dynamic(() => import("../../components/monfarm-social-hub").then(mod => ({ default: mod.MonFarmSocialHub })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading MonFarm Social Hub...</div>
    </div>
  )
})

const ConnectionManager = dynamic(() => import("../../components/connection-manager").then(mod => ({ default: mod.ConnectionManager })), {
  ssr: false,
  loading: () => null
})

export default function SocialHub() {
  const apiKey = process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ Social Hub Unavailable</h3>
          <p className="text-gray-300 mb-2">
            React Together API key not found.
          </p>
          <p className="text-sm text-gray-500">
            Please configure the API key to use social features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactTogetherErrorBoundary>
      <ReactTogether
        sessionParams={{
          apiKey: apiKey,
          appId: "monfarm.social.hub.main",
          name: "monfarm-social-hub-main-session",
          password: "public"
        }}
        rememberUsers={true}
        deriveNickname={(userId) => {
          // Custom logic to derive initial nickname from localStorage
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem('player-nickname')
            if (stored && stored.trim() !== '') {
              console.log('SocialHub ReactTogether deriveNickname: Using stored nickname:', stored)
              return stored
            }
          }
          // Fallback to a farmer-themed name if no stored nickname
          const adjectives = ["Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden"]
          const farmTerms = ["Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher"]
          const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
          const term = farmTerms[Math.floor(Math.random() * farmTerms.length)]
          const fallbackName = `${adj} ${term}`
          console.log('SocialHub ReactTogether deriveNickname: Using fallback nickname:', fallbackName)
          return fallbackName
        }}
      >
        <Suspense fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading MonFarm Social Hub...</div>
          </div>
        }>
          <MonFarmSocialHub defaultTab="combined" />
        </Suspense>
      </ReactTogether>
    </ReactTogetherErrorBoundary>
  )
}
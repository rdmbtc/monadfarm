"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading MonFarm Social Hub...</div>
      </div>
    }>
      <MonFarmSocialHub defaultTab="combined" />
    </Suspense>
  )
}
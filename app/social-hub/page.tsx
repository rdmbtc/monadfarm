"use client"

import { MonFarmSocialHub } from "../../components/monfarm-social-hub"
import { ConnectionManager } from "../../components/connection-manager"
import { Suspense } from "react"

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
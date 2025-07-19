import { MultisynqFarmDemo } from '@/components/multisynq-farm-demo'
import { MultisynqSocialFeedProper } from '@/components/multisynq-social-feed-proper'

export default function MultisynqDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">🌾 MonFarm Social Hub</h1>
          <p className="text-gray-400">Real-time social feed powered by Multisynq</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Proper Multisynq Social Feed */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Social Feed</h2>
            <MultisynqSocialFeedProper />
          </div>

          {/* Original Farm Demo */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Farm Game</h2>
            <div className="bg-white rounded-lg">
              <MultisynqFarmDemo />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

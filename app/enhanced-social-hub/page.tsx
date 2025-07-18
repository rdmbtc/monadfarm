"use client"

import dynamic from 'next/dynamic';

// Dynamically import the component to avoid SSR issues
const EnhancedSocialHub = dynamic(() => import('../../components/enhanced-social-hub').then(mod => ({ default: mod.EnhancedSocialHub })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-4">Loading Enhanced Social Hub...</h2>
        <p className="text-purple-200">Connecting to Multisynq...</p>
      </div>
    </div>
  )
});

export default function EnhancedSocialHubPage() {
  return <EnhancedSocialHub />;
}

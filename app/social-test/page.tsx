"use client"

import { ReactTogether } from 'react-together';
import { ReactTogetherSocialFeedNew } from '@/components/react-together-social-feed-new';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, MessageCircle, Zap } from 'lucide-react';

export default function SocialTestPage() {
  // Debug API key loading
  const apiKey = process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY;
  console.log('API Key loaded:', apiKey ? 'Yes' : 'No', apiKey?.slice(0, 10) + '...');

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">⚠️ API Key Missing</h1>
          <p className="text-gray-300 mb-4">
            React Together API key not found in environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Make sure NEXT_PUBLIC_REACT_TOGETHER_API_KEY is set in your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReactTogether
      sessionParams={{
        apiKey: apiKey,
        appId: "monfarm.social.test",
        name: "monfarm-social-test",
        password: "public"
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-400 mb-2">
              🌾 MonFarm Social Feed Test
            </h1>
            <p className="text-gray-400 mb-4">
              Real-time social feed powered by React Together
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <Sparkles className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Users className="h-3 w-3 mr-1" />
                Multiplayer
              </Badge>
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                <MessageCircle className="h-3 w-3 mr-1" />
                Social
              </Badge>
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                <Zap className="h-3 w-3 mr-1" />
                No Backend
              </Badge>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">How to Test</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-2">
              <p>1. <strong>Open multiple tabs</strong> or windows with this page</p>
              <p>2. <strong>Create posts</strong> in one tab and see them appear in others instantly</p>
              <p>3. <strong>Like posts</strong> and watch the like count update in real-time</p>
              <p>4. <strong>Test with friends</strong> by sharing this URL</p>
            </CardContent>
          </Card>

          {/* Social Feed */}
          <div className="flex justify-center">
            <ReactTogetherSocialFeedNew className="w-full max-w-2xl" />
          </div>

          {/* Technical Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-2 text-sm">
              <p><strong>Framework:</strong> React Together (built on Multisynq)</p>
              <p><strong>State Management:</strong> useStateTogether hook</p>
              <p><strong>Real-time Sync:</strong> Automatic across all users</p>
              <p><strong>Backend:</strong> None required!</p>
              <p><strong>Features:</strong> Create posts, like posts, real-time updates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ReactTogether>
  )
}

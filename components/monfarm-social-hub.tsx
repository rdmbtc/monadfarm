"use client"

import React, { useState } from 'react';
import { MultisynqChat } from './multisynq-chat';
import { RealTimeSocialFeed } from './real-time-social-feed';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MessageCircle, 
  Users, 
  Activity, 
  Settings,
  Zap,
  Globe,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useMultisynq } from '../hooks/useMultisynq';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface MonFarmSocialHubProps {
  className?: string;
  defaultTab?: 'chat' | 'social' | 'combined';
  sessionName?: string;
  password?: string;
}

export function MonFarmSocialHub({ 
  className,
  defaultTab = 'combined',
  sessionName,
  password
}: MonFarmSocialHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  
  const {
    isConnected,
    isLoading,
    error,
    session,
    currentUser,
    users,
    onlineCount,
    messages,
    posts,
    activities,
    getSessionUrl,
    generateQRCode,
    disconnect
  } = useMultisynq({ autoConnect: true, sessionName, password });

  // Copy session URL to clipboard
  const copySessionUrl = () => {
    const url = getSessionUrl();
    navigator.clipboard.writeText(url);
    toast.success('Session URL copied! Share it with friends to join.');
  };

  // Open QR code in new window
  const showQRCode = () => {
    const qrUrl = generateQRCode();
    window.open(qrUrl, '_blank', 'width=300,height=300');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-[#333] bg-[#171717]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                <h1 className="text-xl font-bold">MonFarm Social Hub</h1>
              </div>
              
              {isConnected && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                  <Globe className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Badge variant="outline" className="bg-[#222] text-white border-[#333]">
                    <Users className="h-3 w-3 mr-1" />
                    {onlineCount} online
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSessionInfo(!showSessionInfo)}
                    className="bg-transparent border-[#333] hover:bg-[#222] text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Session Info Panel */}
          {showSessionInfo && session && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-[#222] rounded border border-[#333]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Session Info</h3>
                  <p className="text-xs text-white/70 mb-1">Name: {session.name}</p>
                  <p className="text-xs text-white/70 mb-1">Your nickname: {currentUser?.nickname}</p>
                  <p className="text-xs text-white/70">Connected users: {onlineCount}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Activity Stats</h3>
                  <p className="text-xs text-white/70 mb-1">Messages: {messages.length}</p>
                  <p className="text-xs text-white/70 mb-1">Posts: {posts.length}</p>
                  <p className="text-xs text-white/70">Activities: {activities.length}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Share Session</h3>
                  <div className="flex gap-2">
                    <Button onClick={copySessionUrl} variant="outline" size="sm">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                    <Button onClick={showQRCode} variant="outline" size="sm">
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <Card className="bg-[#171717] border-[#333]">
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting to real-time social network...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <Activity className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#222] border border-[#333] mb-6">
              <TabsTrigger 
                value="combined" 
                className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Live Hub
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat ({messages.length})
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
              >
                <Activity className="h-4 w-4 mr-2" />
                Social ({posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="combined" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Social Feed */}
                <div className="space-y-4">
                  <Card className="bg-[#171717] border-[#333]">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5" />
                        Social Feed
                        <Badge variant="outline" className="ml-auto">
                          {posts.length} posts
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <RealTimeSocialFeed 
                    sessionName={sessionName}
                    showUserPresence={false}
                    showActivityFeed={false}
                  />
                </div>

                {/* Live Chat */}
                <div className="space-y-4">
                  <Card className="bg-[#171717] border-[#333]">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageCircle className="h-5 w-5" />
                        Live Chat
                        <Badge variant="outline" className="ml-auto">
                          {messages.length} messages
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <MultisynqChat 
                    sessionName={sessionName}
                    password={password}
                    autoConnect={false}
                  />
                </div>
              </div>

              {/* Activity Overview */}
              {activities.length > 0 && (
                <Card className="bg-[#171717] border-[#333]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activities.slice(0, 6).map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-[#222] rounded border border-[#333]"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm text-white/70">
                            <strong className="text-white">{activity.nickname}</strong> {activity.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chat">
              <MultisynqChat 
                sessionName={sessionName}
                password={password}
                autoConnect={false}
              />
            </TabsContent>

            <TabsContent value="social">
              <RealTimeSocialFeed 
                sessionName={sessionName}
                showUserPresence={true}
                showActivityFeed={true}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#333] bg-[#171717] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-white/60">
                MonFarm • Powered by Multisynq • Real-time social collaboration
              </p>
              {isConnected && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  Live
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://docs.multisynq.io/', '_blank')}
                className="text-white/60 hover:text-white"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Multisynq Docs
              </Button>
              
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="bg-transparent border-[#333] hover:bg-[#222] text-white"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

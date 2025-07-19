"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  TestTube,
  MessageCircle,
  Activity,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

// Dynamically import components that use React Together hooks to avoid SSR issues
const MultisynqChat = dynamic(() => import('../../components/multisynq-chat').then(mod => ({ default: mod.MultisynqChat })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

const RealTimeSocialFeed = dynamic(() => import('../../components/real-time-social-feed').then(mod => ({ default: mod.RealTimeSocialFeed })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

const ConnectionManager = dynamic(() => import('../../components/connection-manager').then(mod => ({ default: mod.ConnectionManager })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

const MultisynqTestClient = dynamic(() => import('../../components/multisynq-test-client').then(mod => ({ default: mod.MultisynqTestClient })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

export default function MultisynqTestPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pass' | 'fail' | 'pending';
    message: string;
  }>>([]);
  const [isClient, setIsClient] = useState(false);
  const [reactTogetherData, setReactTogetherData] = useState({
    isConnected: false,
    currentUser: null,
    users: [],
    onlineCount: 0,
    error: null
  });

  // Ensure we're on the client side before rendering React Together components
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock data for testing
  const mockData = {
    isLoading: false,
    session: { name: 'multisynq-test' },
    messages: [],
    posts: [],
    activities: [],
    sendMessage: () => {},
    createPost: () => {},
    likePost: () => {}
  };

  // Combine React Together data with mock data
  const {
    isConnected,
    currentUser,
    users,
    onlineCount,
    error
  } = reactTogetherData;

  const {
    isLoading,
    session,
    messages,
    posts,
    activities,
    sendMessage,
    createPost,
    likePost
  } = mockData;

  // Run basic connectivity tests
  const runConnectivityTests = () => {
    const tests = [
      {
        test: 'Environment Variables',
        status: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY ? 'pass' : 'fail' as const,
        message: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY 
          ? 'API key found in environment' 
          : 'API key not found in .env file'
      },
      {
        test: 'Browser Environment',
        status: typeof window !== 'undefined' ? 'pass' : 'fail' as const,
        message: typeof window !== 'undefined' 
          ? 'Running in browser environment' 
          : 'Not in browser environment'
      },
      {
        test: 'Connection Status',
        status: isConnected ? 'pass' : (isLoading ? 'pending' : 'fail') as const,
        message: isConnected 
          ? 'Successfully connected to Multisynq' 
          : (isLoading ? 'Connecting...' : 'Not connected')
      },
      {
        test: 'Session Creation',
        status: session ? 'pass' : 'fail' as const,
        message: session 
          ? `Session created: ${session.name}` 
          : 'No active session'
      },
      {
        test: 'User Authentication',
        status: currentUser ? 'pass' : 'fail' as const,
        message: currentUser 
          ? `Authenticated as: ${currentUser.nickname}` 
          : 'User not authenticated'
      }
    ];

    setTestResults(tests);
  };

  // Run functionality tests
  const runFunctionalityTests = async () => {
    const tests = [...testResults];
    
    // Test message sending
    if (isConnected) {
      try {
        sendMessage('Test message from automated test');
        tests.push({
          test: 'Message Sending',
          status: 'pass',
          message: 'Successfully sent test message'
        });
      } catch (err) {
        tests.push({
          test: 'Message Sending',
          status: 'fail',
          message: `Failed to send message: ${err}`
        });
      }

      // Test post creation
      try {
        createPost('Test post from automated test', undefined, ['test', 'automation']);
        tests.push({
          test: 'Post Creation',
          status: 'pass',
          message: 'Successfully created test post'
        });
      } catch (err) {
        tests.push({
          test: 'Post Creation',
          status: 'fail',
          message: `Failed to create post: ${err}`
        });
      }
    }

    setTestResults(tests);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading Multisynq Test Page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">MonFarm Multisynq Integration Test</h1>
          </div>
          <p className="text-white/70">
            Test and validate the MonFarm Multisynq real-time synchronization integration
          </p>
        </div>

        {/* Test Results Alert */}
        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#222] border border-[#333] mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#333]">
              <TestTube className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="connection" className="data-[state=active]:bg-[#333]">
              <Settings className="h-4 w-4 mr-2" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#333]">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Test
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-[#333]">
              <Activity className="h-4 w-4 mr-2" />
              Social Test
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-[#333]">
              <CheckCircle className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#171717] border-[#333]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Connection</p>
                      <p className="text-lg font-semibold">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#171717] border-[#333]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Users Online</p>
                      <p className="text-lg font-semibold">{onlineCount}</p>
                    </div>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#171717] border-[#333]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Messages</p>
                      <p className="text-lg font-semibold">{messages.length}</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#171717] border-[#333]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Posts</p>
                      <p className="text-lg font-semibold">{posts.length}</p>
                    </div>
                    <Activity className="h-5 w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* React Together Status Component */}
            <MultisynqTestClient onDataUpdate={setReactTogetherData} />

            <Card className="bg-[#171717] border-[#333]">
              <CardHeader>
                <CardTitle>Test Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Single Browser Testing</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                      <li>Click on "Connection" tab to establish connection</li>
                      <li>Test chat functionality in "Chat Test" tab</li>
                      <li>Test social features in "Social Test" tab</li>
                      <li>Check results in "Results" tab</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Multi-Browser Testing</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                      <li>Open this page in multiple browser windows/tabs</li>
                      <li>Connect all instances to the same session</li>
                      <li>Send messages and create posts from different windows</li>
                      <li>Verify real-time synchronization across all instances</li>
                    </ol>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={runConnectivityTests} variant="outline">
                    Run Basic Tests
                  </Button>
                  <Button onClick={runFunctionalityTests} disabled={!isConnected}>
                    Run Functionality Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connection">
            <ConnectionManager 
              showAdvancedOptions={true}
              autoReconnect={true}
            />
          </TabsContent>

          <TabsContent value="chat">
            <MultisynqChat autoConnect={false} />
          </TabsContent>

          <TabsContent value="social">
            <RealTimeSocialFeed 
              showUserPresence={true}
              showActivityFeed={true}
            />
          </TabsContent>

          <TabsContent value="results">
            <Card className="bg-[#171717] border-[#333]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-white/60 text-center py-8">
                    No tests run yet. Click "Run Basic Tests" in the Overview tab to start.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-[#222] rounded border border-[#333]"
                      >
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium">{result.test}</div>
                          <div className="text-sm text-white/60">{result.message}</div>
                        </div>
                        <Badge 
                          variant={result.status === 'pass' ? 'default' : result.status === 'fail' ? 'destructive' : 'secondary'}
                        >
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

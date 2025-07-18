"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useReactTogether } from '../hooks/useReactTogether';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  MessageCircle, 
  Users, 
  Activity, 
  Send, 
  Settings, 
  QrCode,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface MultisynqChatProps {
  className?: string;
  sessionName?: string;
  password?: string;
  autoConnect?: boolean;
}

export function MultisynqChat({ 
  className, 
  sessionName, 
  password, 
  autoConnect = true 
}: MultisynqChatProps) {
  const {
    isConnected,
    currentUser,
    users,
    onlineCount,
    messages,
    sendMessage,
    setNickname
  } = useReactTogether({ chatKey: sessionName || 'monfarm-chat' });

  const [messageInput, setMessageInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus message input when connected
  useEffect(() => {
    if (isConnected && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isConnected]);

  // Handle message send
  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  // Handle post creation
  const handleCreatePost = () => {
    if (postInput.trim() && isConnected) {
      createPost(postInput.trim());
      setPostInput('');
      toast.success('Post created!');
    }
  };

  // Handle nickname change
  const handleNicknameChange = () => {
    if (nicknameInput.trim() && isConnected) {
      setNickname(nicknameInput.trim());
      setNicknameInput('');
      setShowSettings(false);
      toast.success('Nickname updated!');
    }
  };

  // Copy session URL
  const copySessionUrl = () => {
    const url = getSessionUrl();
    navigator.clipboard.writeText(url);
    toast.success('Session URL copied!');
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-4xl mx-auto", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Connecting to Multisynq...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full max-w-4xl mx-auto", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-4xl mx-auto bg-[#171717] border-[#333]", className)}>
      <CardHeader className="border-b border-[#333]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageCircle className="h-5 w-5" />
            MonFarm Social Hub
            {isConnected && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-[#222] text-white border-[#333]">
              <Users className="h-3 w-3 mr-1" />
              {onlineCount} online
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="bg-transparent border-[#333] hover:bg-[#222] text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-[#222] rounded border border-[#333]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-2 block">Change Nickname</label>
                <div className="flex gap-2">
                  <Input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder={currentUser?.nickname || 'Enter nickname'}
                    className="bg-[#171717] border-[#333] text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleNicknameChange()}
                  />
                  <Button onClick={handleNicknameChange} size="sm">
                    Update
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-2 block">Session</label>
                <div className="flex gap-2">
                  <Button onClick={copySessionUrl} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy URL
                  </Button>
                  <Button onClick={resetChat} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#222] border-b border-[#333]">
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#333]">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-[#333]">
              <Activity className="h-4 w-4 mr-1" />
              Social ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#333]">
              <Users className="h-4 w-4 mr-1" />
              Users ({onlineCount})
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#333]">
              <Activity className="h-4 w-4 mr-1" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0">
            <div className="flex flex-col h-96">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "flex gap-3",
                          message.userId === currentUser?.userId && "justify-end"
                        )}
                      >
                        {message.userId !== currentUser?.userId && (
                          <Avatar className="w-8 h-8 border border-[#333]">
                            <AvatarImage src="/images/mon.png" />
                            <AvatarFallback>{message.nickname.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-xs lg:max-w-md px-3 py-2 rounded-lg",
                          message.userId === currentUser?.userId
                            ? "bg-blue-600 text-white"
                            : message.type === 'system'
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                            : "bg-[#222] text-white border border-[#333]"
                        )}>
                          {message.userId !== currentUser?.userId && message.type !== 'system' && (
                            <div className="text-xs text-white/60 mb-1">
                              {message.nickname}
                            </div>
                          )}
                          <div className="text-sm">{message.text}</div>
                          <div className="text-xs text-white/50 mt-1">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        
                        {message.userId === currentUser?.userId && (
                          <Avatar className="w-8 h-8 border border-[#333]">
                            <AvatarImage src="/images/mon.png" />
                            <AvatarFallback>{message.nickname.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-[#333]">
                <div className="flex gap-2">
                  <Input
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-[#222] border-[#333] text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!isConnected}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!isConnected || !messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="m-0">
            <div className="flex flex-col h-96">
              <div className="p-4 border-b border-[#333]">
                <div className="flex gap-2">
                  <Input
                    value={postInput}
                    onChange={(e) => setPostInput(e.target.value)}
                    placeholder="Share your quest adventures..."
                    className="bg-[#222] border-[#333] text-white"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleCreatePost()}
                    disabled={!isConnected}
                  />
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!isConnected || !postInput.trim()}
                  >
                    Post
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {posts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-[#222] border border-[#333] p-4 rounded"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6 border border-[#333]">
                            <AvatarImage src="/images/mon.png" />
                            <AvatarFallback>{post.nickname.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">{post.nickname}</span>
                          <span className="text-xs text-white/50">{formatTime(post.timestamp)}</span>
                        </div>
                        
                        <p className="text-white mb-3">{post.content}</p>
                        
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likePost(post.id)}
                            className={cn(
                              "text-white/70 hover:text-white",
                              post.likedBy.has(currentUser?.userId || '') && "text-red-500"
                            )}
                          >
                            ❤️ {post.likes}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 p-2 rounded bg-[#222] border border-[#333]"
                  >
                    <Avatar className="w-8 h-8 border border-[#333]">
                      <AvatarImage src="/images/mon.png" />
                      <AvatarFallback>{user.nickname.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{user.nickname}</span>
                        {user.userId === currentUser?.userId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/50">
                        {user.isOnline ? 'Online' : `Last seen ${formatTime(user.lastActive)}`}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.isOnline ? "bg-green-500" : "bg-gray-500"
                    )} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 text-sm text-white/70"
                  >
                    {activity.action === 'joined' && <UserPlus className="h-4 w-4 text-green-500" />}
                    {activity.action === 'left' && <UserMinus className="h-4 w-4 text-red-500" />}
                    {activity.action === 'posted' && <MessageCircle className="h-4 w-4 text-blue-500" />}
                    {activity.action === 'liked' && <span className="text-red-500">❤️</span>}
                    
                    <span>
                      <strong>{activity.nickname}</strong> {activity.action}
                      {activity.target && ` ${activity.target}`}
                    </span>
                    
                    <span className="text-xs text-white/50 ml-auto">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

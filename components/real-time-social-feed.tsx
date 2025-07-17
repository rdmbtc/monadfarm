"use client"

import React, { useState, useEffect } from 'react';
import { useMultisynq } from '../hooks/useMultisynq';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  HeartIcon, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Users,
  Activity,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface RealTimeSocialFeedProps {
  className?: string;
  sessionName?: string;
  showUserPresence?: boolean;
  showActivityFeed?: boolean;
}

export function RealTimeSocialFeed({ 
  className,
  sessionName,
  showUserPresence = true,
  showActivityFeed = true
}: RealTimeSocialFeedProps) {
  const {
    isConnected,
    isLoading,
    currentUser,
    users,
    onlineCount,
    posts,
    activities,
    createPost,
    likePost,
    savePost
  } = useMultisynq({ autoConnect: true, sessionName });

  const [newPostContent, setNewPostContent] = useState('');
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Handle post creation
  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !isConnected) return;
    
    createPost(newPostContent.trim());
    setNewPostContent('');
    toast.success('Post shared with everyone!');
  };

  // Handle like toggle
  const handleLike = (postId: string) => {
    if (!isConnected) return;
    likePost(postId);
  };

  // Handle save toggle
  const handleSave = (postId: string) => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
        toast.success('Post unsaved');
      } else {
        newSaved.add(postId);
        toast.success('Post saved');
      }
      return newSaved;
    });
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
          <div className="animate-pulse">
            <div className="h-4 bg-[#333] rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-[#333] rounded mb-4"></div>
            <div className="h-4 bg-[#333] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto space-y-4", className)}>
      {/* Connection Status & User Presence */}
      {showUserPresence && (
        <Card className="bg-[#171717] border border-[#333] rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Circle className={cn(
                  "h-3 w-3",
                  isConnected ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"
                )} />
                <span className="text-white text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/60" />
                <span className="text-white/60 text-sm">{onlineCount} online</span>
              </div>
            </div>
            
            {isConnected && users.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.isOnline).slice(0, 8).map((user) => (
                  <div key={user.userId} className="flex items-center gap-1">
                    <Avatar className="w-6 h-6 border border-[#333]">
                      <AvatarImage src="/images/mon.png" alt={user.nickname} />
                      <AvatarFallback className="text-xs">{user.nickname.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-white/70">{user.nickname}</span>
                    {user.userId === currentUser?.userId && (
                      <Badge variant="outline" className="text-xs px-1 py-0">You</Badge>
                    )}
                  </div>
                ))}
                {users.filter(u => u.isOnline).length > 8 && (
                  <span className="text-xs text-white/50">
                    +{users.filter(u => u.isOnline).length - 8} more
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post creation area */}
      <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
        <form onSubmit={handleSubmitPost} className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border border-[#333]">
              <AvatarImage src="/images/mon.png" alt="Your Avatar" />
              <AvatarFallback>{currentUser?.nickname?.substring(0, 2) || 'YN'}</AvatarFallback>
            </Avatar>
            <Input
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={isConnected ? "Share your quest adventures with everyone..." : "Connect to share posts"}
              className="flex-1 bg-[#222] border-[#333] focus:border-[#444] text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={!isConnected}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="bg-transparent border-[#333] hover:bg-[#222] text-white rounded-none"
                disabled={!isConnected}
              >
                📷 Photo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="bg-transparent border-[#333] hover:bg-[#222] text-white rounded-none"
                disabled={!isConnected}
              >
                📍 Location
              </Button>
            </div>
            <Button 
              type="submit" 
              className="bg-[#333] hover:bg-[#444] text-white border border-[#444] rounded-none"
              disabled={!newPostContent.trim() || !isConnected}
            >
              {isConnected ? 'Post' : 'Disconnected'}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Activity Feed */}
      {showActivityFeed && activities.length > 0 && (
        <Card className="bg-[#171717] border border-[#333] rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/60">Recent Activity</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="text-xs text-white/50 flex items-center gap-2">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src="/images/mon.png" />
                    <AvatarFallback className="text-xs">{activity.nickname.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span>
                    <strong className="text-white/70">{activity.nickname}</strong> {activity.action}
                    {activity.target && activity.target !== 'chat' && activity.target !== 'social' && (
                      <span> a post</span>
                    )}
                  </span>
                  <span className="ml-auto">{formatTime(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Feed posts */}
      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#171717] border border-[#333] shadow-md rounded-none overflow-hidden"
          >
            {/* Post header */}
            <div className="p-4 flex justify-between items-center border-b border-[#333]">
              <div className="flex items-center gap-3">
                <Avatar className="border border-[#333]">
                  <AvatarImage src="/images/mon.png" alt={post.nickname} />
                  <AvatarFallback>{post.nickname.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{post.nickname}</span>
                    {post.userId === currentUser?.userId && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      users.find(u => u.userId === post.userId)?.isOnline ? "bg-green-500" : "bg-gray-500"
                    )} />
                  </div>
                  <span className="text-xs text-white/60">{formatTime(post.timestamp)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-[#222] rounded-none h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Post content */}
            <div className="p-4">
              <p className="text-white mb-3">{post.content}</p>
              
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="bg-[#222] text-white border-[#333] hover:bg-[#333] rounded-none"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {post.media && (
                <div className="mt-3 mb-4 rounded-none overflow-hidden border border-[#333]">
                  <img src={post.media} alt="Post media" className="w-full h-auto" />
                </div>
              )}
            </div>
            
            {/* Post actions */}
            <div className="px-4 py-2 border-t border-[#333] flex justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLike(post.id)} 
                  className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                  disabled={!isConnected}
                >
                  <HeartIcon 
                    className={cn(
                      "h-5 w-5 transition-colors", 
                      post.likedBy.has(currentUser?.userId || '') ? "fill-red-500 text-red-500" : ""
                    )} 
                  />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <button 
                onClick={() => handleSave(post.id)}
                className={cn(
                  "text-white/70 hover:text-white transition-colors",
                  savedPosts.has(post.id) ? "text-yellow-500" : ""
                )}
              >
                <Bookmark className={cn("h-5 w-5", savedPosts.has(post.id) ? "fill-yellow-500" : "")} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Empty state */}
      {posts.length === 0 && isConnected && (
        <Card className="bg-[#171717] border border-[#333] rounded-none">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No posts yet</p>
            <p className="text-white/40 text-sm">Be the first to share something with the community!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

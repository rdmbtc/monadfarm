"use client"

import React, { useState } from 'react';
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { HeartIcon, MessageCircle, Share2, Bookmark, Send, Plus, Users, WifiOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "./ui/badge"
import { cn } from "../lib/utils"
import toast from 'react-hot-toast'

interface SocialPost {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  tags: string[];
}

export function FallbackSocialFeed() {
  // Local state only - no real-time sync
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: 'demo-1',
      userId: 'demo-user',
      nickname: 'Demo Farmer',
      content: 'Welcome to MonFarm Social Hub! This is running in offline mode. Real-time features are temporarily unavailable.',
      timestamp: Date.now() - 3600000, // 1 hour ago
      likes: 5,
      likedBy: [],
      tags: ['demo', 'offline']
    }
  ]);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const currentUser = {
    id: 'offline-user',
    nickname: 'Offline Farmer'
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    
    const newPost: SocialPost = {
      id: `offline-post-${Date.now()}`,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      content: newPostContent.trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags: ['farming', 'offline']
    };

    setPosts(prev => [newPost, ...prev].slice(0, 50));
    
    setNewPostContent('');
    setShowCreatePost(false);
    setIsPosting(false);
    toast.success('Post created (offline mode) 🌾');
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(currentUser.id);
        
        if (hasLiked) {
          return {
            ...post,
            likes: Math.max(0, post.likes - 1),
            likedBy: post.likedBy.filter(id => id !== currentUser.id)
          };
        } else {
          return {
            ...post,
            likes: post.likes + 1,
            likedBy: [...post.likedBy, currentUser.id]
          };
        }
      }
      return post;
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreatePost();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Offline Status */}
      <div className="flex items-center justify-between bg-[#171717] border border-[#333] p-3 rounded-none">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-white">Offline Mode</span>
          <div className="w-2 h-2 rounded-full ml-2 bg-yellow-500" />
        </div>
        <span className="text-xs text-gray-400">Real-time features unavailable</span>
      </div>

      {/* Post creation area */}
      {!showCreatePost ? (
        <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
          <Button
            onClick={() => setShowCreatePost(true)}
            className="w-full bg-[#333] hover:bg-[#444] text-white border border-[#444] rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Share your farming experience (offline)...
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-[#333]">
                <AvatarFallback className="bg-green-600 text-white text-xs">
                  {currentUser.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">{currentUser.nickname}</span>
            </div>
            
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What's happening on your farm? (Note: This will only be visible to you in offline mode)"
              className="min-h-[100px] bg-[#222] border-[#333] focus:border-[#444] text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              maxLength={1000}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {newPostContent.length}/1000 • Ctrl+Enter to post
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreatePost(false);
                    setNewPostContent('');
                  }}
                  className="bg-transparent border-[#333] hover:bg-[#222] text-white rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isPosting}
                  className="bg-[#333] hover:bg-[#444] text-white border border-[#444] rounded-none"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
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
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {post.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{post.nickname}</span>
                    {post.id.includes('demo') && (
                      <Badge variant="secondary" className="text-xs bg-yellow-600/20 text-yellow-400 ml-2">
                        Demo
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-white/60">
                    {new Date(post.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Post content */}
            <div className="p-4">
              <p className="text-white mb-3 whitespace-pre-wrap">{post.content}</p>
              
              {/* Tags */}
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
            </div>
            
            {/* Post actions */}
            <div className="px-4 py-2 border-t border-[#333] flex justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLikePost(post.id)} 
                  className={cn(
                    "flex items-center gap-1 text-white/70 hover:text-white",
                    post.likedBy.includes(currentUser.id) && "text-red-400"
                  )}
                >
                  <HeartIcon 
                    className={cn(
                      "h-5 w-5", 
                      post.likedBy.includes(currentUser.id) && "fill-red-400 text-red-400"
                    )} 
                  />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span>0</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <button className="text-white/70 hover:text-white">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client"

import React, { useState } from 'react';
import { useStateTogether, useConnectedUsers, useMyId } from 'react-together';
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { HeartIcon, MessageCircle, Share2, Bookmark, Send, Plus, Users, MoreHorizontal } from "lucide-react"
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
  media?: string;
}

export function SocialHubFeed() {
  // React Together hooks - these automatically sync across all users!
  const [posts, setPosts] = useStateTogether<SocialPost[]>('monfarm-social-hub-posts', []);
  const [userNicknames, setUserNicknames] = useStateTogether<Record<string, string>>('monfarm-hub-user-nicknames', {});
  
  // Get current user info
  const myId = useMyId();
  const connectedUsers = useConnectedUsers();
  
  // Local state for UI
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Generate or get user nickname - with null check
  const myNickname = (myId && userNicknames[myId]) || generateFarmerName();
  
  // Set nickname if not already set
  React.useEffect(() => {
    if (myId && !userNicknames[myId]) {
      setUserNicknames(prev => ({
        ...prev,
        [myId]: generateFarmerName()
      }));
    }
  }, [myId, userNicknames, setUserNicknames]);

  function generateFarmerName() {
    const adjectives = [
      "Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden",
      "Sunny", "Fresh", "Wild", "Free", "Bold", "Pure", "Strong", "Gentle", "Noble", "Proud"
    ];
    const farmTerms = [
      "Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher", "Shepherd", "Keeper",
      "Sower", "Reaper", "Cultivator", "Tender", "Breeder", "Herder", "Caretaker", "Steward"
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const term = farmTerms[Math.floor(Math.random() * farmTerms.length)];
    return `${adj} ${term}`;
  }

  const handleCreatePost = () => {
    if (!newPostContent.trim() || !myId || isPosting) return;

    setIsPosting(true);
    
    const newPost: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: myId,
      nickname: myNickname,
      content: newPostContent.trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags: ['farming', 'monfarm']
    };

    // Add to posts - this automatically syncs to all users!
    setPosts(prev => {
      // Ensure prev is always an array
      const currentPosts = Array.isArray(prev) ? prev : [];
      return [newPost, ...currentPosts].slice(0, 50); // Keep last 50 posts
    });
    
    setNewPostContent('');
    setShowCreatePost(false);
    setIsPosting(false);
    toast.success('Post shared with the farming community! 🌾');
  };

  const handleLikePost = (postId: string) => {
    if (!myId) return;

    setPosts(prev => {
      // Ensure prev is always an array
      const currentPosts = Array.isArray(prev) ? prev : [];
      return currentPosts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likedBy.includes(myId);
          
          if (hasLiked) {
            // Unlike
            return {
              ...post,
              likes: Math.max(0, post.likes - 1),
              likedBy: post.likedBy.filter(id => id !== myId)
            };
          } else {
            // Like
            return {
              ...post,
              likes: post.likes + 1,
              likedBy: [...post.likedBy, myId]
            };
          }
        }
        return post;
      });
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreatePost();
    }
  };

  const isConnected = !!myId;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Connection Status - Social Hub Style */}
      <div className="flex items-center justify-between bg-[#171717] border border-[#333] p-3 rounded-none">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-green-400" />
          <span className="text-sm text-white">{connectedUsers.length} farmers online</span>
          <div className={cn(
            "w-2 h-2 rounded-full ml-2",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
        </div>
        <span className="text-xs text-gray-400">Welcome, {myNickname}!</span>
      </div>

      {/* Post creation area - Social Hub Style */}
      {!showCreatePost ? (
        <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
          <Button
            onClick={() => setShowCreatePost(true)}
            disabled={!isConnected}
            className="w-full bg-[#333] hover:bg-[#444] text-white border border-[#444] rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Share your farming experience...
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
                  {myNickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">{myNickname}</span>
            </div>
            
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What's happening on your farm? Share your harvest, discoveries, or farming tips..."
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

      {/* Feed posts - Social Hub Style */}
      <AnimatePresence>
        {Array.isArray(posts) && posts.map((post) => (
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
                    {isConnected && (
                      <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400 ml-2">
                        Online
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-white/60">
                    {new Date(post.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-[#222] rounded-none h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Post content */}
            <div className="p-4">
              <p className="text-white mb-3 whitespace-pre-wrap">{post.content}</p>
              
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-[#444] text-white/70 rounded-none">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Media */}
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
                  onClick={() => handleLikePost(post.id)} 
                  disabled={!isConnected}
                  className={cn(
                    "flex items-center gap-1 text-white/70 hover:text-white",
                    post.likedBy.includes(myId || '') && "text-red-400"
                  )}
                >
                  <HeartIcon 
                    className={cn(
                      "h-5 w-5", 
                      post.likedBy.includes(myId || '') && "fill-red-400 text-red-400"
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
      
      {(!Array.isArray(posts) || posts.length === 0) && (
        <div className="text-center py-12 bg-[#171717] border border-[#333] rounded-none">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No posts yet!</p>
          <p className="text-sm text-gray-600">
            Be the first to share your farming experience
          </p>
        </div>
      )}
    </div>
  );
}

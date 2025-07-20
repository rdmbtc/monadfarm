"use client"

import React, { useState, useEffect, useCallback } from 'react';
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
}

// Safe array helper functions
function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  // Handle edge cases where React Together might return unexpected types
  if (typeof value === 'object' && value !== null) {
    // If it's an object with numeric keys, try to convert to array
    const keys = Object.keys(value);
    if (keys.every(key => /^\d+$/.test(key))) {
      return Object.values(value) as T[];
    }
  }
  console.warn('safeArray: Unexpected value type, returning empty array:', typeof value, value);
  return [];
}

function safeObject(value: any): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

// Safe string helper function
function safeString(value: any): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export function BulletproofSocialFeed({ onNicknameChange }: { onNicknameChange?: (changeNickname: (newNickname: string) => boolean) => void } = {}) {
  // Local state first - safer approach
  const [localPosts, setLocalPosts] = useState<SocialPost[]>([]);
  const [localNicknames, setLocalNicknames] = useState<Record<string, string>>({});
  
  // React Together state with safe initialization
  const [syncedPosts, setSyncedPosts] = useStateTogether<SocialPost[]>('bulletproof-posts', []);
  const [syncedNicknames, setSyncedNicknames] = useStateTogether<Record<string, string>>('bulletproof-nicknames', {});
  
  // Get current user info
  const myId = useMyId();
  const connectedUsers = useConnectedUsers();
  
  // Local UI state
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Safe state management - always use local state as fallback with additional safety checks
  const posts = React.useMemo(() => {
    const result = isOnline ? safeArray<SocialPost>(syncedPosts) : localPosts;
    // Double-check that result is actually an array
    if (!Array.isArray(result)) {
      console.warn('Posts is not an array, falling back to empty array:', result);
      return [];
    }
    return result;
  }, [isOnline, syncedPosts, localPosts]);

  const nicknames = React.useMemo(() => {
    const result = isOnline ? safeObject(syncedNicknames) : localNicknames;
    // Double-check that result is actually an object
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      console.warn('Nicknames is not an object, falling back to empty object:', result);
      return {};
    }
    return result;
  }, [isOnline, syncedNicknames, localNicknames]);

  // Generate farmer name
  const generateFarmerName = useCallback(() => {
    const adjectives = ["Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden"];
    const farmTerms = ["Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const term = farmTerms[Math.floor(Math.random() * farmTerms.length)];
    return `${adj} ${term}`;
  }, []);

  // Get current user nickname with safe string handling
  const myNickname = React.useMemo(() => {
    const nickname = (myId && nicknames[myId]) || generateFarmerName();
    return safeString(nickname);
  }, [myId, nicknames, generateFarmerName]);

  // Initialize user nickname
  useEffect(() => {
    if (myId && !nicknames[myId]) {
      const newNickname = generateFarmerName();
      
      if (isOnline) {
        try {
          setSyncedNicknames(prev => ({
            ...safeObject(prev),
            [myId]: newNickname
          }));
        } catch (error) {
          console.warn('Failed to sync nickname, using local state:', error);
          setLocalNicknames(prev => ({
            ...prev,
            [myId]: newNickname
          }));
        }
      } else {
        setLocalNicknames(prev => ({
          ...prev,
          [myId]: newNickname
        }));
      }
    }
  }, [myId, nicknames, generateFarmerName, isOnline, setSyncedNicknames]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(!!myId && connectedUsers.length > 0);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [myId, connectedUsers]);

  // Safe post creation
  const handleCreatePost = useCallback(() => {
    if (!newPostContent || !newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    
    const newPost: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: myId || 'offline-user',
      nickname: myNickname,
      content: (newPostContent || '').trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags: ['farming', 'monfarm']
    };

    try {
      if (isOnline && myId) {
        // Try to sync online
        setSyncedPosts(prev => {
          const currentPosts = safeArray<SocialPost>(prev);
          return [newPost, ...currentPosts].slice(0, 50);
        });
      } else {
        // Fallback to local state
        setLocalPosts(prev => [newPost, ...prev].slice(0, 50));
      }
      
      setNewPostContent('');
      setShowCreatePost(false);
      toast.success(isOnline ? 'Post shared with the farming community! 🌾' : 'Post created (offline mode) 🌾');
    } catch (error) {
      console.warn('Failed to create post online, using local state:', error);
      setLocalPosts(prev => [newPost, ...prev].slice(0, 50));
      setNewPostContent('');
      setShowCreatePost(false);
      toast.success('Post created (offline mode) 🌾');
    } finally {
      setIsPosting(false);
    }
  }, [newPostContent, isPosting, myId, myNickname, isOnline, setSyncedPosts]);

  // Safe like handling
  const handleLikePost = useCallback((postId: string) => {
    const currentUserId = myId || 'offline-user';

    const updatePosts = (prevPosts: SocialPost[]) => {
      return safeArray<SocialPost>(prevPosts).map(post => {
        if (post.id === postId) {
          // Ensure likedBy is always an array
          const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
          const hasLiked = likedBy.includes(currentUserId);

          if (hasLiked) {
            return {
              ...post,
              likes: Math.max(0, (post.likes || 0) - 1),
              likedBy: likedBy.filter(id => id !== currentUserId)
            };
          } else {
            return {
              ...post,
              likes: (post.likes || 0) + 1,
              likedBy: [...likedBy, currentUserId]
            };
          }
        }
        return post;
      });
    };

    try {
      if (isOnline && myId) {
        setSyncedPosts(updatePosts);
      } else {
        setLocalPosts(updatePosts);
      }
    } catch (error) {
      console.warn('Failed to like post online, using local state:', error);
      setLocalPosts(updatePosts);
    }
  }, [myId, isOnline, setSyncedPosts]);

  // Nickname change function
  const changeNickname = useCallback((newNickname: string) => {
    if (!newNickname || !newNickname.trim() || !myId) return false;

    const trimmedNickname = (newNickname || '').trim();

    try {
      if (isOnline) {
        setSyncedNicknames(prev => ({
          ...safeObject(prev),
          [myId]: trimmedNickname
        }));
      } else {
        setLocalNicknames(prev => ({
          ...prev,
          [myId]: trimmedNickname
        }));
      }

      toast.success(`Nickname changed to "${trimmedNickname}" 🌾`);
      return true;
    } catch (error) {
      console.warn('Failed to change nickname:', error);
      toast.error('Failed to change nickname. Please try again.');
      return false;
    }
  }, [myId, isOnline, setSyncedNicknames, setLocalNicknames]);

  // Expose nickname change function to parent component
  useEffect(() => {
    if (onNicknameChange) {
      onNicknameChange(changeNickname);
    }
  }, [onNicknameChange, changeNickname]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreatePost();
    }
  }, [handleCreatePost]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-[#171717] border border-[#333] p-3 rounded-none">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-green-400" />
          <span className="text-sm text-white">
            {isOnline ? `${connectedUsers.length} farmers online` : 'Offline mode'}
          </span>
          <div className={cn(
            "w-2 h-2 rounded-full ml-2",
            isOnline ? "bg-green-500" : "bg-yellow-500"
          )} />
        </div>
        <span className="text-xs text-gray-400">Welcome, {myNickname}!</span>
      </div>

      {/* Post creation area */}
      {!showCreatePost ? (
        <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
          <Button
            onClick={() => setShowCreatePost(true)}
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
                  {safeString(myNickname).slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">{myNickname}</span>
            </div>
            
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onKeyDown={handleKeyPress}
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
                  disabled={!newPostContent || !newPostContent.trim() || isPosting}
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
        {Array.isArray(posts) && posts.map((post) => {
          // Additional safety check for each post
          if (!post || typeof post !== 'object') {
            console.warn('Invalid post object:', post);
            return null;
          }

          return (
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
                    {safeString(post.nickname).slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{safeString(post.nickname) || 'Anonymous'}</span>
                    {isOnline && (
                      <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400 ml-2">
                        Online
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-white/60">
                    {new Date(post.timestamp || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-[#222] rounded-none h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Post content */}
            <div className="p-4">
              <p className="text-white mb-3 whitespace-pre-wrap">{safeString(post.content)}</p>

              {/* Tags */}
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-[#444] text-white/70 rounded-none">
                      #{safeString(tag)}
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
                    Array.isArray(post.likedBy) && post.likedBy.includes(myId || 'offline-user') && "text-red-400"
                  )}
                >
                  <HeartIcon
                    className={cn(
                      "h-5 w-5",
                      Array.isArray(post.likedBy) && post.likedBy.includes(myId || 'offline-user') && "fill-red-400 text-red-400"
                    )}
                  />
                  <span>{post.likes || 0}</span>
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
          );
        }).filter(Boolean)}
      </AnimatePresence>
      
      {posts.length === 0 && (
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

// Export as default for compatibility
export default BulletproofSocialFeed;

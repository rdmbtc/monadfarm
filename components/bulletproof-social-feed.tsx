"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useStateTogether, useConnectedUsers, useMyId, useFunctionTogether } from 'react-together';
import { useUnifiedNickname } from '../hooks/useUnifiedNickname';
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { HeartIcon, MessageCircle, Share2, Bookmark, Send, Plus, Users, MoreHorizontal, Hash, X, Upload } from "lucide-react"
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

  // React Together state with safe initialization
  const [syncedPosts, setSyncedPosts] = useStateTogether<SocialPost[]>('bulletproof-posts', []);

  // Get current user info
  const myId = useMyId();
  const connectedUsers = useConnectedUsers();

  // Real-time event broadcasting
  const broadcastSocialEvent = useFunctionTogether('broadcastSocialEvent', (event: any) => {
    console.log('BulletproofSocialFeed: Broadcasting social event:', event);
    if (event.type === 'newPost') {
      setSyncedPosts(prev => {
        const currentPosts = safeArray<SocialPost>(prev);
        const exists = currentPosts.some(p => p.id === event.post.id);
        if (exists) return prev;
        return [event.post, ...currentPosts].slice(0, 50);
      });
    } else if (event.type === 'likePost') {
      setSyncedPosts(prev => {
        const currentPosts = safeArray<SocialPost>(prev);
        return currentPosts.map(post => {
          if (post.id === event.postId) {
            const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
            const hasLiked = likedBy.includes(event.userId);
            if (hasLiked) {
              return {
                ...post,
                likes: Math.max(0, (post.likes || 0) - 1),
                likedBy: likedBy.filter(id => id !== event.userId)
              };
            } else {
              return {
                ...post,
                likes: (post.likes || 0) + 1,
                likedBy: [...likedBy, event.userId]
              };
            }
          }
          return post;
        });
      });
    }
  });

  // Use the unified nickname system
  const { nickname: myNickname, updateNickname } = useUnifiedNickname();

  // Debug React Together connection
  useEffect(() => {
    console.log('BulletproofSocialFeed: React Together status - myId:', myId, 'connectedUsers:', connectedUsers.length);
    console.log('BulletproofSocialFeed: API Key available:', !!process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY);
    console.log('BulletproofSocialFeed: Current nickname:', myNickname);
  }, [myId, connectedUsers, myNickname]);

  // For compatibility with existing post display logic, create allNicknames object
  const allNicknames = { [myId || 'offline-user']: myNickname };
  
  // Local UI state
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);

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

  // Generate farmer name
  const generateFarmerName = useCallback(() => {
    const adjectives = ["Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden"];
    const farmTerms = ["Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const term = farmTerms[Math.floor(Math.random() * farmTerms.length)];
    return `${adj} ${term}`;
  }, []);

  // Initialize user nickname if not set
  useEffect(() => {
    if (myId && (!myNickname || myNickname.trim() === '')) {
      const newNickname = generateFarmerName();
      updateNickname(newNickname);
    }
  }, [myId, myNickname, generateFarmerName, updateNickname]);

  // Monitor connection status - check if properly connected to Multisynq
  useEffect(() => {
    const checkConnection = () => {
      // Check if we have a valid myId and are connected to React Together
      const online = !!(myId && myId.trim() !== '' && connectedUsers.length >= 0);
      console.log('BulletproofSocialFeed: Connection check - myId:', myId, 'connectedUsers:', connectedUsers.length, 'online:', online);
      setIsOnline(online);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000); // Check less frequently

    return () => clearInterval(interval);
  }, [myId, connectedUsers]);

  // Safe post creation
  const handleCreatePost = useCallback(() => {
    if (!newPostContent || !newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    
    const newPost: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: myId || 'offline-user',
      nickname: safeString(myNickname),
      content: (newPostContent || '').trim(),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags: ['farming', 'monfarm']
    };

    try {
      if (isOnline && myId) {
        // Broadcast the new post event for real-time sync
        broadcastSocialEvent({
          type: 'newPost',
          post: newPost,
          userId: myId,
          nickname: myNickname
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
  }, [newPostContent, isPosting, myId, myNickname, isOnline, setSyncedPosts, broadcastSocialEvent]);

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
        // Broadcast the like event for real-time sync
        broadcastSocialEvent({
          type: 'likePost',
          postId: postId,
          userId: currentUserId,
          nickname: myNickname
        });
      } else {
        setLocalPosts(updatePosts);
      }
    } catch (error) {
      console.warn('Failed to like post online, using local state:', error);
      setLocalPosts(updatePosts);
    }
  }, [myId, isOnline, setSyncedPosts, broadcastSocialEvent, myNickname]);

  // Nickname change function
  const changeNickname = useCallback((newNickname: string) => {
    console.log('BulletproofSocialFeed: changeNickname called with:', newNickname);
    console.log('BulletproofSocialFeed: myId:', myId, 'isOnline:', isOnline);

    if (!newNickname || !newNickname.trim() || !myId) {
      console.log('BulletproofSocialFeed: Invalid input, returning false');
      return false;
    }

    const trimmedNickname = (newNickname || '').trim();
    console.log('BulletproofSocialFeed: Trimmed nickname:', trimmedNickname);

    try {
      console.log('BulletproofSocialFeed: Setting nickname via unified system');
      const success = updateNickname(trimmedNickname);

      if (success) {
        console.log('BulletproofSocialFeed: Nickname change successful');
        toast.success(`Nickname changed to "${trimmedNickname}" 🌾`);
        return true;
      } else {
        console.log('BulletproofSocialFeed: Nickname change failed');
        toast.error('Failed to change nickname. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('BulletproofSocialFeed: Failed to change nickname:', error);
      toast.error('Failed to change nickname. Please try again.');
      return false;
    }
  }, [myId, isOnline, updateNickname]);

  // Create a fallback nickname change function that works even when React Together isn't ready
  const fallbackChangeNickname = useCallback((newNickname: string) => {
    console.log('BulletproofSocialFeed: fallbackChangeNickname called with:', newNickname);

    if (!newNickname || !newNickname.trim()) {
      console.log('BulletproofSocialFeed: Invalid input, returning false');
      return false;
    }

    const trimmedNickname = (newNickname || '').trim();
    console.log('BulletproofSocialFeed: Trimmed nickname:', trimmedNickname);

    try {
      console.log('BulletproofSocialFeed: Setting nickname via unified system');
      const success = updateNickname(trimmedNickname);

      if (success) {
        console.log('BulletproofSocialFeed: Nickname change successful');
        toast.success(`Nickname changed to "${trimmedNickname}" 🌾`);
        return true;
      } else {
        console.log('BulletproofSocialFeed: Nickname change failed');
        toast.error('Failed to change nickname. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('BulletproofSocialFeed: Failed to change nickname:', error);
      toast.error('Failed to change nickname. Please try again.');
      return false;
    }
  }, [myId, isOnline, updateNickname]);

  // Expose nickname change function to parent component immediately
  useEffect(() => {
    console.log('BulletproofSocialFeed: Exposing nickname change function to parent');
    if (onNicknameChange) {
      console.log('BulletproofSocialFeed: onNicknameChange callback provided, calling it');
      // Use the fallback function that works even when React Together isn't ready
      onNicknameChange(fallbackChangeNickname);
    } else {
      console.log('BulletproofSocialFeed: No onNicknameChange callback provided');
    }
  }, [onNicknameChange, fallbackChangeNickname]);

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
            {isOnline ? `${connectedUsers.length} farmers online` : 'Offline mode - Connect to sync with others'}
          </span>
          <div className={cn(
            "w-2 h-2 rounded-full ml-2",
            isOnline ? "bg-green-500 animate-pulse" : "bg-yellow-500"
          )} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Welcome, {myNickname}!</span>
          {isOnline && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              🌾 Live
            </span>
          )}
        </div>
      </div>

      {/* Hashtag Filter Display */}
      {hashtagFilter && (
        <div className="flex items-center gap-2 bg-[#171717] border border-[#333] p-3 rounded-none">
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            <Hash className="h-3 w-3 mr-1" />
            Filtering by: {hashtagFilter}
          </Badge>
          <Button
            onClick={() => setHashtagFilter(null)}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}

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
                    {safeString(allNicknames[post.userId] || post.nickname).slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{safeString(allNicknames[post.userId] || post.nickname) || 'Anonymous'}</span>
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

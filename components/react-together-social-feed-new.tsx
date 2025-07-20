"use client"

import React, { useState } from 'react';
import { useStateTogether, useConnectedUsers, useMyId } from 'react-together';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Heart, 
  Send,
  Users,
  Plus,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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

interface ReactTogetherSocialFeedNewProps {
  className?: string;
}

export function ReactTogetherSocialFeedNew({ className }: ReactTogetherSocialFeedNewProps) {
  // React Together hooks - these automatically sync across all users!
  const [posts, setPosts] = useStateTogether<SocialPost[]>('social-posts', []);
  const [userNicknames, setUserNicknames] = useStateTogether<Record<string, string>>('user-nicknames', {});
  
  // Get current user info
  const myId = useMyId();
  const connectedUsers = useConnectedUsers();
  
  // Local state for UI
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Generate or get user nickname
  const myNickname = userNicknames[myId] || generateFarmerName();
  
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
    if (!postContent.trim() || !myId || isPosting) return;

    setIsPosting(true);
    
    const newPost: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: myId,
      nickname: myNickname,
      content: postContent.trim(),
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
    
    setPostContent('');
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
        // Ensure likedBy is always an array
        const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
        const hasLiked = likedBy.includes(myId);

        if (hasLiked) {
          // Unlike
          return {
            ...post,
            likes: Math.max(0, (post.likes || 0) - 1),
            likedBy: likedBy.filter(id => id !== myId)
          };
        } else {
          // Like
          return {
            ...post,
            likes: (post.likes || 0) + 1,
            likedBy: [...likedBy, myId]
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
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Sparkles className="h-5 w-5" />
            Farm Social Feed
            <div className="flex items-center gap-1 ml-auto">
              <Users className="h-4 w-4" />
              <span className="text-sm">{connectedUsers.length}</span>
              <div className={cn(
                "w-2 h-2 rounded-full ml-2",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
            </div>
          </CardTitle>
          <p className="text-sm text-gray-400">
            Welcome, <strong>{myNickname}</strong>! Share your farming experience.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Create Post Section */}
          <div className="space-y-3">
            {!showCreatePost ? (
              <Button
                onClick={() => setShowCreatePost(true)}
                disabled={!isConnected}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Share your farming experience
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-600"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-600 text-white text-xs">
                      {(myNickname || '').slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-300">{myNickname}</span>
                </div>
                
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What's happening on your farm? Share your harvest, discoveries, or farming tips..."
                  className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                  maxLength={1000}
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {postContent.length}/1000 • Ctrl+Enter to post
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreatePost(false);
                        setPostContent('');
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={!postContent.trim() || isPosting}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Posts Feed */}
          <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
              <AnimatePresence>
                {Array.isArray(posts) && posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {(post.nickname || '').slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{post.nickname}</span>
                          {connectedUsers.some(user => user.id === post.userId) && (
                            <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400">
                              Online
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(post.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="mb-3">
                      <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Post Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id)}
                        disabled={!isConnected}
                        className={cn(
                          "text-gray-400 hover:text-red-400 hover:bg-red-400/10",
                          post.likedBy.includes(myId || '') && "text-red-400 bg-red-400/10"
                        )}
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4 mr-1",
                            post.likedBy.includes(myId || '') && "fill-current"
                          )} 
                        />
                        {post.likes}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(!Array.isArray(posts) || posts.length === 0) && (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No posts yet!</p>
                  <p className="text-sm text-gray-600">
                    Be the first to share your farming experience
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Connection Status */}
          {!isConnected && (
            <div className="text-center py-4 text-yellow-500 text-sm">
              Connecting to farm social network...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client"

import React, { useEffect, useState, useRef } from 'react';
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
import Script from 'next/script';

// Declare Multisynq global
declare global {
  interface Window {
    Multisynq: any;
  }
}

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

// Define the SocialFeedModel class (based on your Multisynq pattern)
class SocialFeedModel extends window.Multisynq?.Model {
  init() {
    this.views = new Map();
    this.participants = 0;
    this.posts = []; // Array of social posts
    this.postIdCounter = 0;
    this.lastPostTime = null;
    this.inactivity_timeout_ms = 60 * 1000 * 30; // 30 minutes
    
    // Subscribe to events
    this.subscribe(this.sessionId, "view-join", this.viewJoin);
    this.subscribe(this.sessionId, "view-exit", this.viewExit);
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "likePost", this.likePost);
    this.subscribe("input", "reset", this.resetPosts);
  }

  viewJoin(viewId: string) {
    const existing = this.views.get(viewId);
    if (!existing) {
      const nickname = this.randomFarmerName();
      this.views.set(viewId, nickname);
    }
    this.participants++;
    this.publish("viewInfo", "refresh");
  }

  viewExit(viewId: string) {
    this.participants--;
    this.views.delete(viewId);
    this.publish("viewInfo", "refresh");
  }

  newPost(postData: { viewId: string; content: string; tags?: string[] }) {
    const postingView = postData.viewId;
    const nickname = this.views.get(postingView);

    this.postIdCounter++;
    const post: SocialPost = {
      id: `post_${this.postIdCounter}_${Date.now()}`,
      userId: postingView,
      nickname: nickname || 'Anonymous Farmer',
      content: this.escape(postData.content),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      tags: postData.tags || ['farming', 'monfarm']
    };

    this.addToFeed(post);
    this.lastPostTime = this.now();
    this.future(this.inactivity_timeout_ms).resetIfInactive();
  }

  likePost(likeData: { postId: string; viewId: string }) {
    const { postId, viewId } = likeData;
    const post = this.posts.find((p: SocialPost) => p.id === postId);
    
    if (!post) return;

    const hasLiked = post.likedBy.includes(viewId);
    
    if (hasLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter((id: string) => id !== viewId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(viewId);
      post.likes += 1;
    }

    this.publish("posts", "refresh");
  }

  addToFeed(post: SocialPost) {
    this.posts.unshift(post); // Add to beginning
    if (this.posts.length > 50) this.posts.pop(); // Keep last 50 posts
    this.publish("posts", "refresh");
  }

  resetIfInactive() {
    if (this.lastPostTime !== this.now() - this.inactivity_timeout_ms) return;
    this.resetPosts("due to inactivity");
  }

  resetPosts(reason?: string) {
    this.posts = [];
    this.lastPostTime = null;
    this.publish("posts", "refresh");
  }

  escape(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  randomFarmerName(): string {
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
}

// Register the model
if (typeof window !== 'undefined' && window.Multisynq) {
  SocialFeedModel.register("SocialFeedModel");
}

// React Social Feed Component
export function MultisynqSocialFeedProper({ className }: { className?: string }) {
  const [nickname, setNickname] = useState('Anonymous Farmer');
  const [participants, setParticipants] = useState(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [multisynqLoaded, setMultisynqLoaded] = useState(false);
  const viewRef = useRef<any>(null);

  useEffect(() => {
    if (!multisynqLoaded || !window.Multisynq) return;

    // Custom SocialFeedView integrated with React
    class MySocialFeedView extends window.Multisynq.View {
      constructor(model: any) {
        super(model);
        viewRef.current = this;
        this.model = model;
        this.subscribe("posts", "refresh", this.refreshPosts);
        this.subscribe("viewInfo", "refresh", this.refreshViewInfo);
        this.refreshPosts();
        this.refreshViewInfo();
        
        // If this is the first participant, welcome them
        if (model.participants === 1 && model.posts.length === 0) {
          // Could add a welcome post here if desired
        }
      }

      createPost(content: string, tags: string[] = []) {
        if (content.trim()) {
          this.publish("input", "newPost", { 
            viewId: this.viewId, 
            content: content.trim(),
            tags 
          });
        }
      }

      likePost(postId: string) {
        this.publish("input", "likePost", { 
          viewId: this.viewId, 
          postId 
        });
      }

      refreshViewInfo() {
        setNickname(this.model.views.get(this.viewId) || 'Anonymous Farmer');
        setParticipants(this.model.participants);
      }

      refreshPosts() {
        setPosts([...this.model.posts]);
      }
    }

    // Join the Multisynq session
    window.Multisynq.Session.join({
      appId: "monfarm.social.feed",
      apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY || "demo-key",
      name: "monfarm-social-feed",
      password: "public",
      model: SocialFeedModel,
      view: MySocialFeedView
    }).then(() => {
      setIsConnected(true);
      toast.success('Connected to farm social feed! 🌾');
    }).catch((error: any) => {
      console.error('Failed to join Multisynq session:', error);
      toast.error('Failed to connect to social feed');
    });

    // Cleanup on unmount
    return () => {
      // Session cleanup handled by Multisynq
    };
  }, [multisynqLoaded]);

  const handleCreatePost = () => {
    if (postContent && postContent.trim() && viewRef.current && !isPosting) {
      setIsPosting(true);
      try {
        viewRef.current.createPost(postContent.trim(), ['farming', 'monfarm']);
        setPostContent('');
        setShowCreatePost(false);
        toast.success('Post created! 🌾');
      } catch (error) {
        console.error('Failed to create post:', error);
        toast.error('Failed to create post. Please try again.');
      } finally {
        setIsPosting(false);
      }
    }
  };

  const handleLikePost = (postId: string) => {
    if (viewRef.current && postId) {
      try {
        viewRef.current.likePost(postId);
      } catch (error) {
        console.error('Failed to like post:', error);
        toast.error('Failed to like post. Please try again.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreatePost();
    }
  };

  return (
    <>
      {/* Load Multisynq script */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js"
        onLoad={() => {
          setMultisynqLoaded(true);
          console.log('Multisynq loaded successfully');
        }}
        onError={(e) => {
          console.error('Failed to load Multisynq:', e);
          toast.error('Failed to load Multisynq');
        }}
      />

      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Sparkles className="h-5 w-5" />
              Farm Social Feed
              <div className="flex items-center gap-1 ml-auto">
                <Users className="h-4 w-4" />
                <span className="text-sm">{participants}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full ml-2",
                  isConnected ? "bg-green-500" : multisynqLoaded ? "bg-yellow-500" : "bg-red-500"
                )} />
              </div>
            </CardTitle>
            <p className="text-sm text-gray-400">
              Welcome, <strong>{nickname}</strong>! Share your farming experience.
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
                        {nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300">{nickname}</span>
                  </div>
                  
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onKeyDown={handleKeyPress}
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
                  {Array.isArray(posts) && posts.map((post) => {
                    // Safety check for post object
                    if (!post || typeof post !== 'object' || !post.id) {
                      return null;
                    }

                    return (
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
                              {(post.nickname || 'Anonymous').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{post.nickname || 'Anonymous Farmer'}</span>
                              <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400">
                                Online
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(post.timestamp || Date.now()).toLocaleString()}
                            </span>
                          </div>
                        </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <p className="text-gray-200 whitespace-pre-wrap"
                           dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                      </div>

                      {/* Post Tags */}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                              #{tag || ''}
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
                            Array.isArray(post.likedBy) && post.likedBy.includes(viewRef.current?.viewId || '') && "text-red-400 bg-red-400/10"
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4 mr-1",
                              Array.isArray(post.likedBy) && post.likedBy.includes(viewRef.current?.viewId || '') && "fill-current"
                            )}
                          />
                          {post.likes || 0}
                        </Button>
                      </div>
                    </motion.div>
                    );
                  }).filter(Boolean)}
                </AnimatePresence>
                
                {posts.length === 0 && (
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
                {multisynqLoaded ? 'Connecting to farm social network...' : 'Loading Multisynq...'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

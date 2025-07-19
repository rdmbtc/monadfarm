'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStateTogether, useFunctionTogether } from 'react-together';

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: number;
  type?: 'text' | 'system' | 'emoji';
}

export interface SocialPost {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  comments: number;
  likedBy: Set<string>;
  media?: string;
  tags: string[];
}

export interface User {
  userId: string;
  nickname: string;
  joinedAt: number;
  lastActive: number;
  isOnline: boolean;
}

export interface UseReactTogetherOptions {
  sessionName?: string;
  autoConnect?: boolean;
}

export interface UseReactTogetherReturn {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User management
  currentUser: User | null;
  users: User[];
  onlineCount: number;
  
  // Chat functionality
  messages: ChatMessage[];
  sendMessage: (text: string, type?: string) => void;
  setNickname: (nickname: string) => void;
  
  // Social feed functionality
  posts: SocialPost[];
  createPost: (content: string, media?: string, tags?: string[]) => void;
  likePost: (postId: string) => void;
  
  // Connection management
  connect: (sessionName?: string) => Promise<void>;
  disconnect: () => void;
  getSessionUrl: () => string;
}

export function useReactTogether(options: UseReactTogetherOptions = {}): UseReactTogetherReturn {
  const { sessionName = 'monfarm-default', autoConnect = true } = options;
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User state using React Together
  const [users, setUsers] = useStateTogether<User[]>('users', []);
  const [currentUserId, setCurrentUserId] = useStateTogether<string>('currentUserId', '');
  const [userNicknames, setUserNicknames] = useStateTogether<Record<string, string>>('userNicknames', {});
  
  // Chat state using React Together
  const [messages, setMessages] = useStateTogether<ChatMessage[]>('messages', []);
  
  // Social feed state using React Together
  const [posts, setPosts] = useStateTogether<SocialPost[]>('posts', []);
  
  // Use useFunctionTogether for real-time communication
  const broadcastChatEvent = useFunctionTogether('broadcastChatEvent', (event: any) => {
    if (event.type === 'newMessage') {
      setMessages(prev => [...prev, event.message])
    }
  });

  const broadcastUserEvent = useFunctionTogether('broadcastUserEvent', (event: any) => {
    if (event.type === 'userJoined') {
      setUsers(prev => [...prev, event.user])
    } else if (event.type === 'userLeft') {
      setUsers(prev => prev.filter(u => u.userId !== event.userId))
    }
  });

  const broadcastSocialEvent = useFunctionTogether('broadcastSocialEvent', (event: any) => {
    if (event.type === 'newPost') {
      setPosts(prev => [event.post, ...prev])
    }
  });
  
  // Generate unique user ID
  const generateUserId = useCallback(() => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Generate random nickname
  const generateRandomNickname = useCallback(() => {
    const adjectives = ['Happy', 'Clever', 'Bright', 'Swift', 'Kind', 'Brave', 'Calm', 'Wise'];
    const animals = ['Panda', 'Fox', 'Owl', 'Cat', 'Dog', 'Bear', 'Wolf', 'Eagle'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj}${animal}`;
  }, []);
  
  // Current user derived from users array
  const currentUser = users.find(user => user.userId === currentUserId) || null;
  const onlineCount = users.filter(user => user.isOnline).length;
  
  // Initialize user when component mounts
  useEffect(() => {
    if (!currentUserId) {
      const newUserId = generateUserId();
      const newNickname = generateRandomNickname();
      
      setCurrentUserId(newUserId);
      setUserNicknames(prev => ({ ...prev, [newUserId]: newNickname }));
      
      // Add user to users list
      const newUser: User = {
        userId: newUserId,
        nickname: newNickname,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        isOnline: true
      };
      
      setUsers(prev => {
        const exists = prev.some(u => u.userId === newUserId);
        if (exists) return prev;
        return [...prev, newUser];
      });
      
      // Announce user joined
      sendUserEvent({
        type: 'userJoined',
        user: newUser
      });
      
      setIsConnected(true);
    }
  }, [currentUserId, generateUserId, generateRandomNickname, setCurrentUserId, setUserNicknames, setUsers, sendUserEvent]);
  
  // Handle chat events
  onChatEvent(useCallback((event: any) => {
    switch (event.type) {
      case 'newMessage':
        setMessages(prev => {
          const exists = prev.some(m => m.id === event.message.id);
          if (exists) return prev;
          return [...prev, event.message].slice(-500); // Keep last 500 messages
        });
        break;
    }
  }, [setMessages]));
  
  // Handle user events
  onUserEvent(useCallback((event: any) => {
    switch (event.type) {
      case 'userJoined':
        setUsers(prev => {
          const exists = prev.some(u => u.userId === event.user.userId);
          if (exists) return prev;
          return [...prev, event.user];
        });
        break;
      case 'userLeft':
        setUsers(prev => prev.map(user => 
          user.userId === event.userId 
            ? { ...user, isOnline: false }
            : user
        ));
        break;
      case 'nicknameChanged':
        setUsers(prev => prev.map(user =>
          user.userId === event.userId
            ? { ...user, nickname: event.nickname }
            : user
        ));
        setUserNicknames(prev => ({ ...prev, [event.userId]: event.nickname }));
        break;
    }
  }, [setUsers, setUserNicknames]));
  
  // Social events are now handled by broadcastSocialEvent function above
  
  // Send message function
  const sendMessage = useCallback((text: string, type: string = 'text') => {
    if (!text.trim() || !currentUser) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.userId,
      nickname: currentUser.nickname,
      text: text.trim(),
      timestamp: Date.now(),
      type
    };
    
    sendChatEvent({
      type: 'newMessage',
      message
    });
  }, [currentUser, sendChatEvent]);
  
  // Set nickname function
  const setNickname = useCallback((nickname: string) => {
    if (!nickname.trim() || !currentUserId) return;
    
    sendUserEvent({
      type: 'nicknameChanged',
      userId: currentUserId,
      nickname: nickname.trim()
    });
  }, [currentUserId, sendUserEvent]);
  
  // Create post function
  const createPost = useCallback((content: string, media?: string, tags: string[] = []) => {
    if (!content.trim() || !currentUser) return;
    
    const post: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.userId,
      nickname: currentUser.nickname,
      content: content.trim(),
      media,
      tags,
      timestamp: Date.now(),
      likes: 0,
      comments: 0,
      likedBy: new Set()
    };
    
    sendSocialEvent({
      type: 'postCreated',
      post
    });
  }, [currentUser, sendSocialEvent]);
  
  // Like post function
  const likePost = useCallback((postId: string) => {
    if (!currentUserId) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const newLikedBy = new Set(post.likedBy);
    if (newLikedBy.has(currentUserId)) {
      newLikedBy.delete(currentUserId);
    } else {
      newLikedBy.add(currentUserId);
    }
    
    sendSocialEvent({
      type: 'postLiked',
      postId,
      likes: newLikedBy.size,
      likedBy: Array.from(newLikedBy)
    });
  }, [currentUserId, posts, sendSocialEvent]);
  
  // Connect function (for compatibility)
  const connect = useCallback(async (targetSessionName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // React Together handles connection automatically
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Disconnect function
  const disconnect = useCallback(() => {
    if (currentUserId) {
      sendUserEvent({
        type: 'userLeft',
        userId: currentUserId
      });
    }
    setIsConnected(false);
  }, [currentUserId, sendUserEvent]);
  
  // Get session URL (for sharing)
  const getSessionUrl = useCallback(() => {
    return `${window.location.origin}${window.location.pathname}?session=${sessionName}`;
  }, [sessionName]);
  
  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    
    // User management
    currentUser,
    users,
    onlineCount,
    
    // Chat functionality
    messages,
    sendMessage,
    setNickname,
    
    // Social feed functionality
    posts,
    createPost,
    likePost,
    
    // Connection management
    connect,
    disconnect,
    getSessionUrl
  };
}

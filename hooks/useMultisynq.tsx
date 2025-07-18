"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { multisynqService, getMultisynqConfig } from '../services/multisynq-service';
import { createSimpleModel, createSimpleView, clearModelRegistry, getRegistrationStatus } from '../lib/multisynq-simple-classes';
import { logMultisynqState, getMultisynqDebugInfo, validateMultisynqState } from '../lib/multisynq-debug';
import type { ChatMessage, MultisynqUser, MultisynqSession } from '../services/multisynq-service';
import type { SocialPost, UserActivity } from '../lib/multisynq-simple-classes';

export interface UseMultisynqOptions {
  autoConnect?: boolean;
  sessionName?: string;
  password?: string;
}

export interface UseMultisynqReturn {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  session: MultisynqSession | null;
  
  // User data
  currentUser: MultisynqUser | null;
  users: MultisynqUser[];
  onlineCount: number;
  
  // Chat data
  messages: ChatMessage[];
  
  // Social data
  posts: SocialPost[];
  activities: UserActivity[];
  
  // Actions
  connect: (sessionName?: string, password?: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string, type?: string) => void;
  setNickname: (nickname: string) => void;
  createPost: (content: string, media?: string, tags?: string[]) => void;
  likePost: (postId: string) => void;
  savePost: (postId: string) => void;
  resetChat: () => void;
  
  // Utility
  getSessionUrl: () => string;
  generateQRCode: () => string;
}

export function useMultisynq(options: UseMultisynqOptions = {}): UseMultisynqReturn {
  const { autoConnect = true, sessionName, password } = options;
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MultisynqSession | null>(null);
  const [currentUser, setCurrentUser] = useState<MultisynqUser | null>(null);
  const [users, setUsers] = useState<MultisynqUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  
  // Refs
  const sessionRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  
  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Initialize Multisynq
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const initializeMultisynq = async () => {
      try {
        setIsLoading(true);
        const config = getMultisynqConfig();
        
        if (!config.apiKey) {
          throw new Error('Multisynq API key not found. Please check your .env file.');
        }
        
        await multisynqService.initialize(config);
        isInitializedRef.current = true;
        
        // Auto-connect if enabled
        if (autoConnect) {
          const urlParams = multisynqService.getSessionFromUrl();
          const targetSessionName = sessionName || urlParams.sessionName;
          const targetPassword = password || urlParams.password;
          
          if (targetSessionName) {
            await connectToSession(targetSessionName, targetPassword);
          } else {
            await connectToSession();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Multisynq');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeMultisynq();
  }, [autoConnect, sessionName, password]);
  
  // Connect to session
  const connectToSession = useCallback(async (targetSessionName?: string, targetPassword?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let newSession: MultisynqSession;
      
      if (targetSessionName) {
        newSession = await multisynqService.joinSession(targetSessionName, targetPassword);
      } else {
        newSession = await multisynqService.createSession();
      }
      
      // Ensure Multisynq is loaded before creating model and view
      if (!window.Multisynq) {
        throw new Error('Multisynq library not loaded. Please check your internet connection and try again.');
      }

      // Log current registration status and validate Multisynq state
      const regStatus = getRegistrationStatus();
      const validation = validateMultisynqState();

      console.log('Current registration status:', regStatus);
      logMultisynqState('Before Model Creation');

      if (!validation.valid) {
        throw new Error(`Multisynq validation failed: ${validation.issues.join(', ')}`);
      }

      // Create model and view - try simple classes first
      console.log('Creating simple model and view classes...');
      let ChatModel, ChatView;

      try {
        ChatModel = createSimpleModel();
        console.log('Model created successfully:', ChatModel.name);

        // Verify model is properly registered
        if (!ChatModel || typeof ChatModel !== 'function') {
          throw new Error('Model creation failed - invalid model class');
        }
      } catch (modelError) {
        console.error('Failed to create model:', modelError);
        throw new Error(`Model creation failed: ${modelError.message}`);
      }

      try {
        ChatView = createSimpleView({
        onMessageReceived: (message) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev;
            return [...prev, message].slice(-500); // Keep last 500 messages
          });
        },
        onUserJoined: (user) => {
          if (viewRef.current && viewRef.current.isCurrentUser(user.userId)) {
            setCurrentUser(user);
          }
        },
        onUserLeft: (user) => {
          // User left is handled in onUserListUpdated
        },
        onUserListUpdated: (userList, online) => {
          setUsers(userList);
          setOnlineCount(online);
          
          // Update current user if needed
          if (viewRef.current) {
            const current = userList.find(u => viewRef.current.isCurrentUser(u.userId));
            if (current) {
              setCurrentUser(current);
            }
          }
        },
        onPostCreated: (post) => {
          setPosts(prev => {
            const exists = prev.some(p => p.id === post.id);
            if (exists) return prev;
            return [post, ...prev].slice(0, 100); // Keep last 100 posts
          });
        },
        onPostUpdated: (postId, updates) => {
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, likes: updates.likes, likedBy: new Set(updates.likedBy) }
              : post
          ));
        },
        onActivityUpdate: (activity) => {
          setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
        },
        onConnectionChanged: (connected) => {
          setIsConnected(connected);
        },
        onError: (err) => {
          setError(err.message || 'An error occurred');
        },
        onSystemMessage: (message) => {
          // Handle system messages as needed
          console.log('System message:', message);
        }
      });

      // Verify view is properly created
      if (!ChatView || typeof ChatView !== 'function') {
        throw new Error('View creation failed - invalid view class');
      }

      console.log('View created successfully:', ChatView.name);
      } catch (viewError) {
        console.error('Failed to create view:', viewError);
        throw new Error(`View creation failed: ${viewError.message}`);
      }

      // Final validation before session creation
      console.log('Validating model and view before session creation...');
      if (!ChatModel || !ChatView) {
        throw new Error('Model or View is null/undefined');
      }

      if (typeof ChatModel !== 'function' || typeof ChatView !== 'function') {
        throw new Error('Model or View is not a constructor function');
      }

      // Debug: Check what we're passing to Session.join
      console.log('Final validation passed. Model and View details:');
      console.log('ChatModel:', ChatModel.name, typeof ChatModel);
      console.log('ChatView:', ChatView.name, typeof ChatView);
      console.log('Registration status:', getRegistrationStatus());
      console.log('ChatView constructor:', ChatView?.constructor?.name);

      // Additional debugging
      console.log('window.Multisynq available:', !!window.Multisynq);
      console.log('window.Multisynq.Model:', window.Multisynq?.Model);
      console.log('window.Multisynq.View:', window.Multisynq?.View);

      // Small delay to ensure everything is properly initialized
      await new Promise(resolve => setTimeout(resolve, 200));

      // Final check before session creation
      if (!window.Multisynq || !window.Multisynq.Session) {
        throw new Error('Multisynq Session not available after initialization delay');
      }

      // Join Multisynq session
      console.log('Attempting to join Multisynq session with:', {
        apiKey: getMultisynqConfig().apiKey ? '***' : 'MISSING',
        appId: getMultisynqConfig().appId,
        modelType: typeof ChatModel,
        viewType: typeof ChatView,
        name: newSession.name,
        hasPassword: !!newSession.password
      });

      const multisynqSession = await window.Multisynq.Session.join({
        apiKey: getMultisynqConfig().apiKey,
        appId: getMultisynqConfig().appId,
        model: ChatModel,
        view: ChatView,
        name: newSession.name,
        password: newSession.password || undefined
      });
      
      sessionRef.current = multisynqSession;
      setSession(newSession);
      setIsConnected(true);
      
      // Store view reference for later use
      setTimeout(() => {
        if (multisynqSession.view) {
          viewRef.current = multisynqSession.view;
        }
      }, 100);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to session');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Disconnect from session
  const disconnect = useCallback(() => {
    try {
      if (sessionRef.current) {
        try {
          sessionRef.current.leave();
        } catch (err) {
          console.warn('Error leaving session:', err);
        }
        sessionRef.current = null;
      }

      viewRef.current = null;
      setIsConnected(false);
      setSession(null);
      setCurrentUser(null);
      setUsers([]);
      setOnlineCount(0);
      setMessages([]);
      setPosts([]);
      setActivities([]);
      setError(null);

      // Clear model registry to prevent conflicts on reconnection
      clearModelRegistry();
      console.log('Model registry cleared for clean reconnection');

      multisynqService.disconnect();
      console.log('Successfully disconnected from Multisynq session');
    } catch (error) {
      console.error('Error during disconnect:', error);
      setError(`Disconnect error: ${error.message || error}`);
    }
  }, []);
  
  // Action methods
  const sendMessage = useCallback((text: string, type: string = 'text') => {
    if (viewRef.current && isConnected) {
      viewRef.current.sendMessage(text, type);
    }
  }, [isConnected]);
  
  const setNickname = useCallback((nickname: string) => {
    if (viewRef.current && isConnected) {
      viewRef.current.setNickname(nickname);
    }
  }, [isConnected]);
  
  const createPost = useCallback((content: string, media?: string, tags: string[] = []) => {
    if (viewRef.current && isConnected) {
      viewRef.current.createPost(content, media, tags);
    }
  }, [isConnected]);
  
  const likePost = useCallback((postId: string) => {
    if (viewRef.current && isConnected) {
      viewRef.current.likePost(postId);
    }
  }, [isConnected]);
  
  const savePost = useCallback((postId: string) => {
    if (viewRef.current && isConnected) {
      viewRef.current.savePost(postId);
    }
  }, [isConnected]);
  
  const resetChat = useCallback(() => {
    if (viewRef.current && isConnected) {
      viewRef.current.resetChat();
    }
  }, [isConnected]);
  
  // Utility methods
  const getSessionUrl = useCallback(() => {
    return multisynqService.getSessionUrl(session || undefined);
  }, [session]);
  
  const generateQRCode = useCallback(() => {
    return multisynqService.generateQRCode(session || undefined);
  }, [session]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    session,
    
    // User data
    currentUser,
    users,
    onlineCount,
    
    // Chat data
    messages,
    
    // Social data
    posts,
    activities,
    
    // Actions
    connect: connectToSession,
    disconnect,
    sendMessage,
    setNickname,
    createPost,
    likePost,
    savePost,
    resetChat,
    
    // Utility
    getSessionUrl,
    generateQRCode,

    // Debug utilities
    getDebugInfo: () => ({
      multisynqState: getMultisynqDebugInfo(),
      registrationStatus: getRegistrationStatus(),
      validation: validateMultisynqState()
    }),
    logDebugState: (context?: string) => logMultisynqState(context || 'Manual Debug')
  };
}

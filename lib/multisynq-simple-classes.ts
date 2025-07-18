// lib/multisynq-simple-classes.ts
// Simplified Multisynq classes based on the official examples

import type { ChatMessage, MultisynqUser } from '../services/multisynq-service';

declare global {
  interface Window {
    Multisynq: any;
  }
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
  savedBy: Set<string>;
  media?: string;
  tags: string[];
}

export interface UserActivity {
  userId: string;
  nickname: string;
  action: 'joined' | 'left' | 'posted' | 'liked' | 'commented';
  target?: string;
  timestamp: number;
}

import {
  logRegistrationAttempt,
  logMultisynqState,
  safeRegisterModel,
  registrationStateManager
} from './multisynq-debug';

// Global registry to track registered models and prevent duplicates
const registeredModels = new Map<string, any>();
const registeredViews = new Map<string, any>();

// Simple model class following Multisynq patterns
export function createSimpleModel() {
  if (typeof window === 'undefined' || !window.Multisynq) {
    throw new Error('Multisynq not loaded');
  }

  // Check if model is already registered and return it
  const existingModel = registeredModels.get('MonFarmModel');
  if (existingModel) {
    console.log('MonFarmModel already exists, returning cached instance');
    return existingModel;
  }

  // Create a properly named model class
  const MonFarmModel = class extends window.Multisynq.Model {
    static get modelName() {
      return 'MonFarmModel';
    }
    init() {
      console.log('MonFarmModel.init() called');

      try {
        // Initialize data structures
        this.users = new Map();
        this.messages = [];
        this.socialPosts = [];
        this.activities = [];
        this.participants = 0;

        // Regular methods are used instead of arrow functions to avoid serialization issues

        // System event subscriptions with proper error handling
        try {
          this.subscribe(this.sessionId, "view-join", this.handleUserJoin);
          this.subscribe(this.sessionId, "view-exit", this.handleUserExit);
          console.log('System event subscriptions registered');
        } catch (sysError) {
          console.error('Failed to register system subscriptions:', sysError);
        }

        // Chat event subscriptions
        try {
          this.subscribe("chat", "sendMessage", this.handleSendMessage);
          this.subscribe("chat", "setNickname", this.handleSetNickname);
          console.log('Chat event subscriptions registered');
        } catch (chatError) {
          console.error('Failed to register chat subscriptions:', chatError);
        }

        // Social event subscriptions
        try {
          this.subscribe("social", "createPost", this.handleCreatePost);
          this.subscribe("social", "likePost", this.handleLikePost);
          console.log('Social event subscriptions registered');
        } catch (socialError) {
          console.error('Failed to register social subscriptions:', socialError);
        }

      } catch (initError) {
        console.error('Model initialization failed:', initError);
        throw initError;
      }
    }

    handleUserJoin(viewId) {
      try {
        console.log('User joined:', viewId);
        const nickname = this.generateRandomNickname();
        const user = {
          userId: viewId,
          nickname,
          joinedAt: this.now(),
          lastActive: this.now(),
          isOnline: true
        };

        this.users.set(viewId, user);
        this.participants++;

        // Notify all users
        this.publish("users", "userJoined", { user, totalUsers: this.participants });
        this.publishUserList();
      } catch (error) {
        console.error('Error handling user join:', error);
      }
    }

    handleUserExit(viewId) {
      try {
        console.log('User left:', viewId);
        const user = this.users.get(viewId);
        if (user) {
          user.isOnline = false;
          this.participants--;
          this.publish("users", "userLeft", { user, totalUsers: this.participants });
          this.publishUserList();
        }
      } catch (error) {
        console.error('Error handling user exit:', error);
      }
    }

    handleSendMessage(data) {
      try {
        const { userId, text, type = 'text' } = data;
        const user = this.users.get(userId);
        if (!user || !text?.trim()) return;

        const message: ChatMessage = {
          id: `msg_${this.now()}_${Math.floor(this.random() * 10000)}`,
          userId,
          nickname: user.nickname,
          text: text.trim(),
          timestamp: this.now(),
          serverTime: this.now(),
          type
        };

        this.messages.push(message);
        if (this.messages.length > 500) {
          this.messages = this.messages.slice(-500);
        }

        this.publish("chat", "newMessage", message);
      } catch (error) {
        console.error('Error handling send message:', error);
      }
    }

    handleSetNickname(data) {
      try {
        const { userId, nickname } = data;
        const user = this.users.get(userId);
        if (user && nickname?.trim()) {
          user.nickname = nickname.trim();
          this.publishUserList();
        }
      } catch (error) {
        console.error('Error handling nickname change:', error);
      }
    }

    handleCreatePost(data) {
      try {
        const { userId, content, media, tags = [] } = data;
        const user = this.users.get(userId);
        if (!user || !content?.trim()) return;

        const post = {
          id: `post_${this.now()}_${Math.floor(this.random() * 10000)}`,
          userId,
          nickname: user.nickname,
          content: content.trim(),
          media,
          tags,
          timestamp: this.now(),
          likes: 0,
          likedBy: new Set()
        };

        this.socialPosts.push(post);
        if (this.socialPosts.length > 100) {
          this.socialPosts = this.socialPosts.slice(-100);
        }

        this.publish("social", "postCreated", post);
      } catch (error) {
        console.error('Error handling create post:', error);
      }
    }

    handleLikePost(data) {
      try {
        const { userId, postId } = data;
        const user = this.users.get(userId);
        const post = this.socialPosts.find(p => p.id === postId);

        if (user && post && !post.likedBy.has(userId)) {
          post.likes++;
          post.likedBy.add(userId);
          this.publish("social", "postLiked", { postId, userId, likes: post.likes });
        }
      } catch (error) {
        console.error('Error handling like post:', error);
      }
    }

    generateRandomNickname() {
      const adjectives = ['Swift', 'Bright', 'Happy', 'Cool', 'Smart', 'Kind'];
      const animals = ['Mon', 'Fox', 'Owl', 'Cat', 'Dog', 'Bear'];
      const adj = adjectives[Math.floor(this.random() * adjectives.length)];
      const animal = animals[Math.floor(this.random() * animals.length)];
      return `${adj}${animal}`;
    }

    publishUserList() {
      const userList = Array.from(this.users.values());
      this.publish("users", "userListUpdated", {
        users: userList,
        onlineCount: this.participants,
        totalCount: userList.length
      });
    }
  }

  // Explicitly set the class name for Multisynq registration
  Object.defineProperty(MonFarmModel, 'name', {
    value: 'MonFarmModel',
    configurable: false
  });

  // Register the model class with Multisynq using safe registration
  logMultisynqState('Before Model Registration');

  try {
    // Check if already registered in Multisynq's internal registry
    const internalRegistry = (window.Multisynq.Model as any)?._registry;
    if (internalRegistry && internalRegistry['MonFarmModel']) {
      console.log('MonFarmModel already registered in Multisynq internal registry');
      logRegistrationAttempt('MonFarmModel', true, 'already-registered');
    } else {
      // Use safe registration with state management
      const registrationSuccess = safeRegisterModel(MonFarmModel, 'MonFarmModel', () => {
        // Try different registration methods
        if (MonFarmModel.register && typeof MonFarmModel.register === 'function') {
          MonFarmModel.register('MonFarmModel');
          console.log('MonFarmModel registered successfully via class method');
        } else if (window.Multisynq.Model.register) {
          window.Multisynq.Model.register('MonFarmModel', MonFarmModel);
          console.log('MonFarmModel registered successfully via Multisynq.Model.register');
        } else {
          throw new Error('No registration method available');
        }
      });

      if (!registrationSuccess) {
        console.warn('Model registration was skipped due to state management constraints');
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is about duplicate registration
    if (errorMessage.includes('already used') || errorMessage.includes('already registered')) {
      console.log('MonFarmModel already registered (duplicate registration prevented)');
      logRegistrationAttempt('MonFarmModel', true, 'duplicate-prevented');
    } else {
      console.error('Model registration failed:', error);
      logRegistrationAttempt('MonFarmModel', false, 'error', errorMessage);
      throw error; // Re-throw non-duplicate errors
    }
  }

  // Cache the model class to prevent recreation
  registeredModels.set('MonFarmModel', MonFarmModel);

  return MonFarmModel;
}

// Simple view class following Multisynq patterns
export function createSimpleView(callbacks: any = {}) {
  if (typeof window === 'undefined' || !window.Multisynq) {
    throw new Error('Multisynq not loaded');
  }

  // Check if view is already registered and return it
  const existingView = registeredViews.get('MonFarmView');
  if (existingView) {
    console.log('MonFarmView already exists, returning cached instance');
    return existingView;
  }

  // Create a properly named view class
  const MonFarmView = class extends window.Multisynq.View {
    static get viewName() {
      return 'MonFarmView';
    }
    constructor(model: any) {
      super(model);
      console.log('MonFarmView constructor called');
      this.model = model;
      this.callbacks = callbacks;
      this.setupEventListeners();
    }

    setupEventListeners() {
      // Chat event listeners
      this.subscribe("chat", "newMessage", this.handleNewMessage.bind(this));
      
      // User event listeners
      this.subscribe("users", "userJoined", this.handleUserJoined.bind(this));
      this.subscribe("users", "userLeft", this.handleUserLeft.bind(this));
      this.subscribe("users", "userListUpdated", this.handleUserListUpdated.bind(this));
    }

    handleNewMessage(message: ChatMessage) {
      console.log('New message received:', message);
      if (this.callbacks.onMessageReceived) {
        this.callbacks.onMessageReceived(message);
      }
    }

    handleUserJoined(data: any) {
      console.log('User joined event:', data);
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(data.user);
      }
    }

    handleUserLeft(data: any) {
      console.log('User left event:', data);
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(data.user);
      }
    }

    handleUserListUpdated(data: any) {
      console.log('User list updated:', data);
      if (this.callbacks.onUserListUpdated) {
        this.callbacks.onUserListUpdated(data.users, data.onlineCount);
      }
    }

    // Public methods for sending events to model
    sendMessage(text: string, type: string = 'text') {
      if (!text?.trim()) return;
      this.publish("chat", "sendMessage", {
        userId: this.viewId,
        text: text.trim(),
        type
      });
    }

    setNickname(nickname: string) {
      if (!nickname?.trim()) return;
      this.publish("chat", "setNickname", {
        userId: this.viewId,
        nickname: nickname.trim()
      });
    }

    getCurrentUser() {
      return this.model.users.get(this.viewId) || null;
    }

    getUsers() {
      return Array.from(this.model.users.values());
    }

    getMessages() {
      return [...this.model.messages];
    }

    isCurrentUser(userId: string) {
      return userId === this.viewId;
    }
  }

  // Explicitly set the class name for Multisynq registration
  Object.defineProperty(MonFarmView, 'name', {
    value: 'MonFarmView',
    configurable: false
  });

  // Register the view class with Multisynq if needed
  try {
    // Views typically don't need explicit registration like models do
    // But we'll cache it to prevent recreation
    console.log('MonFarmView created successfully');
  } catch (error) {
    console.warn('View creation failed:', error);
    throw error;
  }

  // Cache the view class to prevent recreation
  registeredViews.set('MonFarmView', MonFarmView);

  return MonFarmView;
}

// Utility functions for managing registration state
export function clearModelRegistry() {
  console.log('Clearing model and view registry');
  registeredModels.clear();
  registeredViews.clear();

  // Reset registration state manager
  registrationStateManager.reset();
  console.log('Registration state manager reset');
}

export function isModelRegistered(modelName: string): boolean {
  return registeredModels.has(modelName);
}

export function isViewRegistered(viewName: string): boolean {
  return registeredViews.has(viewName);
}

export function getRegistrationStatus() {
  return {
    models: Array.from(registeredModels.keys()),
    views: Array.from(registeredViews.keys()),
    modelCount: registeredModels.size,
    viewCount: registeredViews.size
  };
}

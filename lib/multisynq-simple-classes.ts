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

// Simple model class following Multisynq patterns
export function createSimpleModel() {
  if (typeof window === 'undefined' || !window.Multisynq) {
    throw new Error('Multisynq not loaded');
  }

  class MonFarmModel extends window.Multisynq.Model {
    init() {
      console.log('MonFarmModel.init() called');
      
      // Initialize data structures
      this.users = new Map();
      this.messages = [];
      this.socialPosts = [];
      this.activities = [];
      this.participants = 0;
      
      // System event subscriptions
      this.subscribe(this.sessionId, "view-join", this.handleUserJoin.bind(this));
      this.subscribe(this.sessionId, "view-exit", this.handleUserExit.bind(this));
      
      // Chat event subscriptions
      this.subscribe("chat", "sendMessage", this.handleSendMessage.bind(this));
      this.subscribe("chat", "setNickname", this.handleSetNickname.bind(this));
    }

    handleUserJoin(viewId) {
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
    }

    handleUserExit(viewId) {
      console.log('User left:', viewId);
      const user = this.users.get(viewId);
      if (user) {
        user.isOnline = false;
        this.participants--;
        this.publish("users", "userLeft", { user, totalUsers: this.participants });
        this.publishUserList();
      }
    }

    handleSendMessage(data) {
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
    }

    handleSetNickname(data) {
      const { userId, nickname } = data;
      const user = this.users.get(userId);
      if (user && nickname?.trim()) {
        user.nickname = nickname.trim();
        this.publishUserList();
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

  return MonFarmModel;
}

// Simple view class following Multisynq patterns
export function createSimpleView(callbacks: any = {}) {
  if (typeof window === 'undefined' || !window.Multisynq) {
    throw new Error('Multisynq not loaded');
  }

  class MonFarmView extends window.Multisynq.View {
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

  return MonFarmView;
}

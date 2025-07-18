// lib/multisynq-chat-view.ts

import type { ChatMessage, MultisynqUser } from '../services/multisynq-service';
import type { SocialPost, UserActivity } from './multisynq-chat-model';

declare global {
  interface Window {
    Multisynq: any;
  }
}

export interface ChatViewCallbacks {
  onMessageReceived?: (message: ChatMessage) => void;
  onUserJoined?: (user: MultisynqUser) => void;
  onUserLeft?: (user: MultisynqUser) => void;
  onUserListUpdated?: (users: MultisynqUser[], onlineCount: number) => void;
  onPostCreated?: (post: SocialPost) => void;
  onPostUpdated?: (postId: string, updates: any) => void;
  onActivityUpdate?: (activity: UserActivity) => void;
  onConnectionChanged?: (connected: boolean) => void;
  onError?: (error: any) => void;
  onSystemMessage?: (message: any) => void;
}

export class MonFarmChatView {
  private view: any;
  private callbacks: ChatViewCallbacks;
  private currentUser: MultisynqUser | null = null;

  constructor(callbacks: ChatViewCallbacks = {}) {
    this.callbacks = callbacks;

    if (typeof window === 'undefined' || !window.Multisynq) {
      throw new Error('Multisynq not loaded or not in browser environment');
    }
  }

  createView(model: any) {
    const MultisynqView = window.Multisynq.View;
    const callbacks = this.callbacks;
    
    return class extends MultisynqView {
      constructor(modelInstance: any) {
        super(modelInstance);
        this.model = modelInstance;
        this.setupEventListeners();
        this.initializeFromModel();
      }

      setupEventListeners() {
        // Chat event listeners
        this.subscribe("chat", "newMessage", this.handleNewMessage.bind(this));
        this.subscribe("chat", "messageHistory", this.handleMessageHistory.bind(this));
        this.subscribe("chat", "chatReset", this.handleChatReset.bind(this));
        
        // User event listeners
        this.subscribe("users", "userJoined", this.handleUserJoined.bind(this));
        this.subscribe("users", "userLeft", this.handleUserLeft.bind(this));
        this.subscribe("users", "userListUpdated", this.handleUserListUpdated.bind(this));
        this.subscribe("users", "nicknameChanged", this.handleNicknameChanged.bind(this));
        
        // Social event listeners
        this.subscribe("social", "newPost", this.handleNewPost.bind(this));
        this.subscribe("social", "postUpdated", this.handlePostUpdated.bind(this));
        this.subscribe("social", "postHistory", this.handlePostHistory.bind(this));
        this.subscribe("social", "socialReset", this.handleSocialReset.bind(this));
        
        // Activity event listeners
        this.subscribe("activity", "newActivity", this.handleNewActivity.bind(this));
        this.subscribe("activity", "activityHistory", this.handleActivityHistory.bind(this));
        
        // System event listeners
        this.subscribe("system", "sessionCleared", this.handleSessionCleared.bind(this));
        this.subscribe("error", this.handleError.bind(this));
        this.subscribe("system", this.handleSystemMessage.bind(this));
        
        // View-specific listeners (messages sent directly to this view)
        this.subscribe(this.viewId, "error", this.handleError.bind(this));
        this.subscribe(this.viewId, "system", this.handleSystemMessage.bind(this));
        this.subscribe(this.viewId, "chat", this.handleDirectChatMessage.bind(this));
        this.subscribe(this.viewId, "social", this.handleDirectSocialMessage.bind(this));
        this.subscribe(this.viewId, "activity", this.handleDirectActivityMessage.bind(this));
      }

      initializeFromModel() {
        // Get current user info
        const currentUser = this.model.users.get(this.viewId);
        if (currentUser && callbacks.onUserJoined) {
          callbacks.onUserJoined(currentUser);
        }
        
        // Initialize with existing data
        if (this.model.messages.length > 0 && callbacks.onMessageReceived) {
          this.model.messages.slice(-20).forEach((message: ChatMessage) => {
            callbacks.onMessageReceived!(message);
          });
        }
        
        if (this.model.socialPosts.length > 0 && callbacks.onPostCreated) {
          this.model.socialPosts.slice(0, 10).forEach((post: SocialPost) => {
            callbacks.onPostCreated!(post);
          });
        }
        
        // Update user list
        if (callbacks.onUserListUpdated) {
          const users = Array.from(this.model.users.values());
          callbacks.onUserListUpdated(users, this.model.participants);
        }
      }

      // Chat Event Handlers
      handleNewMessage(message: ChatMessage) {
        if (callbacks.onMessageReceived) {
          callbacks.onMessageReceived(message);
        }
      }

      handleMessageHistory(messages: ChatMessage[]) {
        if (callbacks.onMessageReceived) {
          messages.forEach(message => callbacks.onMessageReceived!(message));
        }
      }

      handleChatReset(data: any) {
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'chat_reset',
            message: `Chat was reset by ${data.by}`,
            timestamp: this.now()
          });
        }
      }

      // User Event Handlers
      handleUserJoined(data: any) {
        if (callbacks.onUserJoined) {
          callbacks.onUserJoined(data.user);
        }
        
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'user_joined',
            message: `${data.user.nickname} joined the chat`,
            timestamp: this.now()
          });
        }
      }

      handleUserLeft(data: any) {
        if (callbacks.onUserLeft) {
          callbacks.onUserLeft(data.user);
        }
        
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'user_left',
            message: `${data.user.nickname} left the chat`,
            timestamp: this.now()
          });
        }
      }

      handleUserListUpdated(data: any) {
        if (callbacks.onUserListUpdated) {
          callbacks.onUserListUpdated(data.users, data.onlineCount);
        }
      }

      handleNicknameChanged(data: any) {
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'nickname_changed',
            message: `${data.oldNickname} is now ${data.newNickname}`,
            timestamp: this.now()
          });
        }
      }

      // Social Event Handlers
      handleNewPost(post: SocialPost) {
        if (callbacks.onPostCreated) {
          callbacks.onPostCreated(post);
        }
      }

      handlePostUpdated(data: any) {
        if (callbacks.onPostUpdated) {
          callbacks.onPostUpdated(data.postId, data);
        }
      }

      handlePostHistory(posts: SocialPost[]) {
        if (callbacks.onPostCreated) {
          posts.forEach(post => callbacks.onPostCreated!(post));
        }
      }

      handleSocialReset(data: any) {
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'social_reset',
            message: `Social feed was reset by ${data.by}`,
            timestamp: this.now()
          });
        }
      }

      // Activity Event Handlers
      handleNewActivity(activity: UserActivity) {
        if (callbacks.onActivityUpdate) {
          callbacks.onActivityUpdate(activity);
        }
      }

      handleActivityHistory(activities: UserActivity[]) {
        if (callbacks.onActivityUpdate) {
          activities.forEach(activity => callbacks.onActivityUpdate!(activity));
        }
      }

      // System Event Handlers
      handleSessionCleared(data: any) {
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage({
            type: 'session_cleared',
            message: `Session cleared due to ${data.reason}`,
            timestamp: this.now()
          });
        }
      }

      handleError(error: any) {
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }

      handleSystemMessage(message: any) {
        if (callbacks.onSystemMessage) {
          callbacks.onSystemMessage(message);
        }
      }

      // Direct message handlers (messages sent specifically to this view)
      handleDirectChatMessage(event: string, data: any) {
        if (event === "messageHistory") {
          this.handleMessageHistory(data);
        }
      }

      handleDirectSocialMessage(event: string, data: any) {
        if (event === "postHistory") {
          this.handlePostHistory(data);
        }
      }

      handleDirectActivityMessage(event: string, data: any) {
        if (event === "activityHistory") {
          this.handleActivityHistory(data);
        }
      }

      // Public methods for sending events to model
      sendMessage(text: string, type: string = 'text') {
        if (!text || text.trim().length === 0) {
          return;
        }
        
        this.publish("chat", "sendMessage", {
          userId: this.viewId,
          text: text.trim(),
          type
        });
      }

      setNickname(nickname: string) {
        if (!nickname || nickname.trim().length === 0) {
          return;
        }
        
        this.publish("chat", "setNickname", {
          userId: this.viewId,
          nickname: nickname.trim()
        });
      }

      createPost(content: string, media?: string, tags: string[] = []) {
        if (!content || content.trim().length === 0) {
          return;
        }
        
        this.publish("social", "createPost", {
          userId: this.viewId,
          content: content.trim(),
          media,
          tags
        });
      }

      likePost(postId: string) {
        this.publish("social", "likePost", {
          userId: this.viewId,
          postId
        });
      }

      savePost(postId: string) {
        this.publish("social", "savePost", {
          userId: this.viewId,
          postId
        });
      }

      deletePost(postId: string) {
        this.publish("social", "deletePost", {
          userId: this.viewId,
          postId
        });
      }

      resetChat() {
        this.publish("admin", "resetChat", {
          userId: this.viewId
        });
      }

      // Utility methods
      getCurrentUser(): MultisynqUser | null {
        return this.model.users.get(this.viewId) || null;
      }

      getUsers(): MultisynqUser[] {
        return Array.from(this.model.users.values());
      }

      getOnlineUsers(): MultisynqUser[] {
        return Array.from(this.model.users.values()).filter(user => user.isOnline);
      }

      getMessages(): ChatMessage[] {
        return [...this.model.messages];
      }

      getPosts(): SocialPost[] {
        return [...this.model.socialPosts];
      }

      getActivities(): UserActivity[] {
        return [...this.model.activities];
      }

      isCurrentUser(userId: string): boolean {
        return userId === this.viewId;
      }
    };
  }
}

export const createMonFarmChatView = (callbacks: ChatViewCallbacks = {}) => {
  try {
    const monFarmView = new MonFarmChatView(callbacks);
    return monFarmView.createView.bind(monFarmView);
  } catch (error) {
    console.error('Error creating MonFarm chat view:', error);
    // Return a basic view class as fallback
    return class extends window.Multisynq.View {
      constructor(model: any) {
        super(model);
        console.log('Using fallback view class');
      }
    };
  }
};

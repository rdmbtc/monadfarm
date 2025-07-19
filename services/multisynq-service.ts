// services/multisynq-service.ts

declare global {
  interface Window {
    Multisynq: any;
  }
}

export interface MultisynqConfig {
  apiKey: string;
  appId: string;
  appName?: string;
}

export interface MultisynqSession {
  id: string;
  name: string;
  password?: string;
  isConnected: boolean;
}

export interface MultisynqUser {
  userId: string;
  nickname: string;
  joinedAt: number;
  lastActive: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: number;
  serverTime: number;
  type?: 'text' | 'system' | 'emoji';
}

export class MultisynqService {
  private static instance: MultisynqService;
  private isInitialized = false;
  private isLoading = false;
  private config: MultisynqConfig | null = null;
  private currentSession: MultisynqSession | null = null;
  private connectionCallbacks: Array<(connected: boolean) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];

  private constructor() {}

  static getInstance(): MultisynqService {
    if (!MultisynqService.instance) {
      MultisynqService.instance = new MultisynqService();
    }
    return MultisynqService.instance;
  }

  async initialize(config: MultisynqConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (this.isInitialized) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    this.isLoading = true;
    this.config = config;

    try {
      await this.loadMultisynqScript();
      this.isInitialized = true;
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      throw new Error(`Failed to initialize Multisynq: ${error}`);
    }
  }

  private loadMultisynqScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Multisynq is already loaded
      if (typeof window !== 'undefined' && window.Multisynq) {
        resolve();
        return;
      }

      if (typeof window === 'undefined') {
        reject(new Error('Multisynq can only be loaded in browser environment'));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js';
      script.async = true;
      
      script.onload = () => {
        if (typeof window !== 'undefined' && window.Multisynq) {
          resolve();
        } else {
          reject(new Error('Multisynq script loaded but Multisynq object not found'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Multisynq script'));
      };

      document.head.appendChild(script);
    });
  }

  async createSession(sessionName?: string, password?: string): Promise<MultisynqSession> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Multisynq service not initialized');
    }

    try {
      const sessionConfig = {
        apiKey: this.config.apiKey,
        appId: this.config.appId,
        name: sessionName || this.generateSessionName(),
        password: password || this.generatePassword(),
      };

      this.currentSession = {
        id: sessionConfig.name,
        name: sessionConfig.name,
        password: sessionConfig.password,
        isConnected: false,
      };

      return this.currentSession;
    } catch (error) {
      this.notifyError(new Error(`Failed to create session: ${error}`));
      throw error;
    }
  }

  async joinSession(sessionName: string, password?: string): Promise<MultisynqSession> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Multisynq service not initialized');
    }

    try {
      this.currentSession = {
        id: sessionName,
        name: sessionName,
        password: password,
        isConnected: false,
      };

      return this.currentSession;
    } catch (error) {
      this.notifyError(new Error(`Failed to join session: ${error}`));
      throw error;
    }
  }

  getCurrentSession(): MultisynqSession | null {
    return this.currentSession;
  }

  isConnected(): boolean {
    return this.currentSession?.isConnected || false;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  private notifyConnectionChange(connected: boolean): void {
    if (this.currentSession) {
      this.currentSession.isConnected = connected;
    }
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  private generateSessionName(): string {
    const adjectives = ['Swift', 'Bright', 'Happy', 'Cool', 'Smart'];
    const nouns = ['Farm', 'Garden', 'Field', 'Meadow', 'Grove'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${num}`;
  }

  private generatePassword(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // Utility methods for session management
  getSessionUrl(session?: MultisynqSession): string {
    const currentSession = session || this.currentSession;
    if (!currentSession) {
      return '';
    }

    // Only access window.location on client side
    if (typeof window === 'undefined') {
      return '';
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('session', currentSession.name);
    if (currentSession.password) {
      params.set('password', currentSession.password);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  getSessionFromUrl(): { sessionName?: string; password?: string } {
    if (typeof window === 'undefined') {
      return {};
    }

    const params = new URLSearchParams(window.location.search);
    return {
      sessionName: params.get('session') || undefined,
      password: params.get('password') || undefined,
    };
  }

  generateQRCode(session?: MultisynqSession): string {
    const url = this.getSessionUrl(session);
    // This would typically use a QR code library
    // For now, return the URL that can be used with QR code generators
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }

  disconnect(): void {
    if (this.currentSession) {
      this.currentSession.isConnected = false;
      this.currentSession = null;
    }
    this.notifyConnectionChange(false);
  }

  // Helper method to check if we're in browser environment
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}

// Export singleton instance
export const multisynqService = MultisynqService.getInstance();

// Export default configuration
export const getMultisynqConfig = (): MultisynqConfig => ({
  apiKey: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY || '',
  appId: process.env.NEXT_PUBLIC_APP_ID || 'com.monfarm.social',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MonFarm Social Hub',
});

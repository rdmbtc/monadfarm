// lib/dev-utils.ts
// Development utilities for MonFarm

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Development logger with MonFarm branding
export const devLog = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🌟 MonFarm Dev: ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ MonFarm Dev: ${message}`, data || '');
    }
  },
  error: (message: string, data?: any) => {
    if (isDevelopment) {
      console.error(`❌ MonFarm Dev: ${message}`, data || '');
    }
  },
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ MonFarm Dev: ${message}`, data || '');
    }
  },
  multisynq: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔄 Multisynq: ${message}`, data || '');
    }
  },
  social: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`👥 Social Hub: ${message}`, data || '');
    }
  },
};

// Performance monitoring for development
export const devPerf = {
  start: (label: string) => {
    if (isDevelopment && typeof window !== 'undefined') {
      performance.mark(`${label}-start`);
      devLog.info(`Performance tracking started: ${label}`);
    }
  },
  end: (label: string) => {
    if (isDevelopment && typeof window !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      devLog.info(`Performance: ${label} took ${measure.duration.toFixed(2)}ms`);
    }
  },
};

// Development state inspector
export const devInspect = {
  localStorage: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      const storage = { ...localStorage };
      devLog.info('Local Storage Contents:', storage);
      return storage;
    }
  },
  sessionStorage: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      const storage = { ...sessionStorage };
      devLog.info('Session Storage Contents:', storage);
      return storage;
    }
  },
  cookies: () => {
    if (isDevelopment && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      devLog.info('Cookies:', cookies);
      return cookies;
    }
  },
  network: () => {
    if (isDevelopment && typeof navigator !== 'undefined') {
      const info = {
        online: navigator.onLine,
        connection: (navigator as any).connection,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      };
      devLog.info('Network Information:', info);
      return info;
    }
  },
};

// Development utilities for Multisynq
export const devMultisynq = {
  logSession: (session: any) => {
    if (isDevelopment) {
      devLog.multisynq('Session State:', {
        id: session?.id,
        name: session?.name,
        connected: !!session,
        timestamp: new Date().toISOString(),
      });
    }
  },
  logUsers: (users: any[]) => {
    if (isDevelopment) {
      devLog.multisynq(`Users (${users.length}):`, users.map(u => ({
        id: u.userId,
        nickname: u.nickname,
        online: u.isOnline,
      })));
    }
  },
  logMessages: (messages: any[]) => {
    if (isDevelopment) {
      devLog.multisynq(`Messages (${messages.length}):`, messages.slice(-5));
    }
  },
  logError: (error: any, context?: string) => {
    if (isDevelopment) {
      devLog.error(`Multisynq Error${context ? ` in ${context}` : ''}:`, error);
    }
  },
};

// Development shortcuts
export const devShortcuts = {
  clearAll: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      devLog.success('All storage cleared');
      window.location.reload();
    }
  },
  reload: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      devLog.info('Reloading page...');
      window.location.reload();
    }
  },
  goTo: (path: string) => {
    if (isDevelopment && typeof window !== 'undefined') {
      devLog.info(`Navigating to: ${path}`);
      window.location.href = path;
    }
  },
};

// Development feature flags
export const devFlags = {
  enableDebugMode: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      (window as any).MONFARM_DEBUG = true;
      devLog.success('Debug mode enabled');
    }
  },
  disableDebugMode: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      (window as any).MONFARM_DEBUG = false;
      devLog.info('Debug mode disabled');
    }
  },
  isDebugMode: () => {
    if (isDevelopment && typeof window !== 'undefined') {
      return !!(window as any).MONFARM_DEBUG;
    }
    return false;
  },
};

// Export all utilities for global access in development
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).MonFarmDev = {
    log: devLog,
    perf: devPerf,
    inspect: devInspect,
    multisynq: devMultisynq,
    shortcuts: devShortcuts,
    flags: devFlags,
  };
  
  devLog.success('MonFarm Development utilities loaded! Access via window.MonFarmDev');
}

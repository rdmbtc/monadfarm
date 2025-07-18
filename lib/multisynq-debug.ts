// lib/multisynq-debug.ts
// Debug utilities for Multisynq registration and session management

export interface MultisynqDebugInfo {
  libraryLoaded: boolean;
  sessionAvailable: boolean;
  modelAvailable: boolean;
  viewAvailable: boolean;
  registryStatus: any;
  internalRegistry: any;
  timestamp: number;
}

export interface RegistrationAttempt {
  timestamp: number;
  modelName: string;
  success: boolean;
  error?: string;
  method: string;
}

// Track registration attempts
const registrationHistory: RegistrationAttempt[] = [];

export function logRegistrationAttempt(
  modelName: string, 
  success: boolean, 
  method: string, 
  error?: string
) {
  const attempt: RegistrationAttempt = {
    timestamp: Date.now(),
    modelName,
    success,
    method,
    error
  };
  
  registrationHistory.push(attempt);
  
  // Keep only last 20 attempts
  if (registrationHistory.length > 20) {
    registrationHistory.splice(0, registrationHistory.length - 20);
  }
  
  console.log(`[Multisynq Registration] ${success ? '✅' : '❌'} ${modelName} via ${method}`, error ? `Error: ${error}` : '');
}

export function getRegistrationHistory(): RegistrationAttempt[] {
  return [...registrationHistory];
}

export function clearRegistrationHistory() {
  registrationHistory.length = 0;
}

export function getMultisynqDebugInfo(): MultisynqDebugInfo {
  const info: MultisynqDebugInfo = {
    libraryLoaded: typeof window !== 'undefined' && !!window.Multisynq,
    sessionAvailable: typeof window !== 'undefined' && !!window.Multisynq?.Session,
    modelAvailable: typeof window !== 'undefined' && !!window.Multisynq?.Model,
    viewAvailable: typeof window !== 'undefined' && !!window.Multisynq?.View,
    registryStatus: null,
    internalRegistry: null,
    timestamp: Date.now()
  };

  if (typeof window !== 'undefined' && window.Multisynq) {
    // Try to access internal registry
    try {
      info.internalRegistry = (window.Multisynq.Model as any)?._registry || null;
    } catch (e) {
      info.internalRegistry = 'Access denied';
    }
  }

  return info;
}

export function validateMultisynqState(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (typeof window === 'undefined') {
    issues.push('Running in non-browser environment');
    return { valid: false, issues };
  }
  
  if (!window.Multisynq) {
    issues.push('Multisynq library not loaded');
    return { valid: false, issues };
  }
  
  if (!window.Multisynq.Session) {
    issues.push('Multisynq.Session not available');
  }
  
  if (!window.Multisynq.Model) {
    issues.push('Multisynq.Model not available');
  }
  
  if (!window.Multisynq.View) {
    issues.push('Multisynq.View not available');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export function logMultisynqState(context: string = 'Debug') {
  const debugInfo = getMultisynqDebugInfo();
  const validation = validateMultisynqState();
  
  console.group(`🔍 [${context}] Multisynq State`);
  console.log('Library Loaded:', debugInfo.libraryLoaded);
  console.log('Session Available:', debugInfo.sessionAvailable);
  console.log('Model Available:', debugInfo.modelAvailable);
  console.log('View Available:', debugInfo.viewAvailable);
  console.log('Internal Registry:', debugInfo.internalRegistry);
  
  if (!validation.valid) {
    console.group('❌ Issues:');
    validation.issues.forEach(issue => console.error(issue));
    console.groupEnd();
  }
  
  if (registrationHistory.length > 0) {
    console.group('📝 Recent Registration Attempts:');
    registrationHistory.slice(-5).forEach(attempt => {
      console.log(`${attempt.success ? '✅' : '❌'} ${attempt.modelName} (${attempt.method})`, 
                  attempt.error ? `- ${attempt.error}` : '');
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return { debugInfo, validation };
}

export function createRegistrationStateManager() {
  const state = {
    registrationInProgress: false,
    lastRegistrationTime: 0,
    registrationCooldown: 1000, // 1 second cooldown between attempts
  };

  return {
    canAttemptRegistration(modelName: string): boolean {
      const now = Date.now();
      const timeSinceLastAttempt = now - state.lastRegistrationTime;
      
      if (state.registrationInProgress) {
        console.warn(`Registration already in progress for ${modelName}`);
        return false;
      }
      
      if (timeSinceLastAttempt < state.registrationCooldown) {
        console.warn(`Registration cooldown active for ${modelName}. Wait ${state.registrationCooldown - timeSinceLastAttempt}ms`);
        return false;
      }
      
      return true;
    },

    startRegistration(modelName: string): void {
      state.registrationInProgress = true;
      state.lastRegistrationTime = Date.now();
      console.log(`Starting registration for ${modelName}`);
    },

    endRegistration(modelName: string, success: boolean): void {
      state.registrationInProgress = false;
      console.log(`Registration ${success ? 'completed' : 'failed'} for ${modelName}`);
    },

    getState() {
      return { ...state };
    },

    reset() {
      state.registrationInProgress = false;
      state.lastRegistrationTime = 0;
    }
  };
}

// Global registration state manager
export const registrationStateManager = createRegistrationStateManager();

export function safeRegisterModel(
  modelClass: any, 
  modelName: string, 
  registrationMethod: () => void
): boolean {
  if (!registrationStateManager.canAttemptRegistration(modelName)) {
    return false;
  }

  registrationStateManager.startRegistration(modelName);
  
  try {
    registrationMethod();
    logRegistrationAttempt(modelName, true, 'safe-register');
    registrationStateManager.endRegistration(modelName, true);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logRegistrationAttempt(modelName, false, 'safe-register', errorMessage);
    registrationStateManager.endRegistration(modelName, false);
    
    // Check if it's a duplicate registration error (which might be OK)
    if (errorMessage.includes('already used') || errorMessage.includes('already registered')) {
      console.log(`Model ${modelName} already registered (duplicate prevented)`);
      return true; // Consider this a success
    }
    
    throw error;
  }
}

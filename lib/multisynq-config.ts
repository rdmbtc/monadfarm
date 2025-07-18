// lib/multisynq-config.ts
// Comprehensive Multisynq configuration and validation

export interface MultisynqConfig {
  apiKey: string;
  appId: string;
  appName?: string;
  environment: 'development' | 'production';
  debug: boolean;
}

export interface MultisynqValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: MultisynqConfig;
}

/**
 * Validates and returns Multisynq configuration
 */
export function validateMultisynqConfig(): MultisynqValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required environment variables
  const apiKey = process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY;
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  const appName = process.env.NEXT_PUBLIC_APP_NAME;

  if (!apiKey) {
    errors.push('NEXT_PUBLIC_MULTISYNQ_API_KEY is required but not found in environment variables');
  } else if (apiKey.length < 10) {
    errors.push('NEXT_PUBLIC_MULTISYNQ_API_KEY appears to be invalid (too short)');
  } else if (apiKey === 'your-api-key-here' || apiKey === 'test-key') {
    errors.push('NEXT_PUBLIC_MULTISYNQ_API_KEY appears to be a placeholder value');
  }

  if (!appId) {
    errors.push('NEXT_PUBLIC_APP_ID is required but not found in environment variables');
  } else if (!appId.includes('.')) {
    warnings.push('NEXT_PUBLIC_APP_ID should follow reverse domain notation (e.g., com.yourcompany.appname)');
  }

  if (!appName) {
    warnings.push('NEXT_PUBLIC_APP_NAME is not set, using default value');
  }

  // Validate API key format (basic check)
  if (apiKey && !/^[A-Za-z0-9_-]+$/.test(apiKey)) {
    warnings.push('API key contains unexpected characters');
  }

  // Check environment
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const debug = environment === 'development';

  if (environment === 'production' && debug) {
    warnings.push('Debug mode should be disabled in production');
  }

  const config: MultisynqConfig = {
    apiKey: apiKey || '',
    appId: appId || 'com.monfarm.social',
    appName: appName || 'MonFarm Social Hub',
    environment,
    debug
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: errors.length === 0 ? config : undefined
  };
}

/**
 * Gets validated Multisynq configuration or throws an error
 */
export function getMultisynqConfig(): MultisynqConfig {
  const validation = validateMultisynqConfig();
  
  if (!validation.isValid) {
    const errorMessage = [
      'Multisynq configuration validation failed:',
      ...validation.errors.map(error => `  - ${error}`),
      '',
      'Please check your .env file and ensure all required environment variables are set.',
      'Required variables:',
      '  - NEXT_PUBLIC_MULTISYNQ_API_KEY',
      '  - NEXT_PUBLIC_APP_ID',
      'Optional variables:',
      '  - NEXT_PUBLIC_APP_NAME'
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Log warnings in development
  if (validation.warnings.length > 0 && validation.config?.debug) {
    console.warn('Multisynq configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return validation.config!;
}

/**
 * Checks if Multisynq is properly configured
 */
export function isMultisynqConfigured(): boolean {
  try {
    getMultisynqConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets configuration status for debugging
 */
export function getConfigurationStatus() {
  const validation = validateMultisynqConfig();
  
  return {
    configured: validation.isValid,
    hasApiKey: !!process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY,
    hasAppId: !!process.env.NEXT_PUBLIC_APP_ID,
    hasAppName: !!process.env.NEXT_PUBLIC_APP_NAME,
    environment: process.env.NODE_ENV,
    errors: validation.errors,
    warnings: validation.warnings,
    config: validation.config
  };
}

/**
 * Creates a sample .env file content
 */
export function generateSampleEnvFile(): string {
  return `# Multisynq Configuration
# Get your API key from https://multisynq.io/coder
NEXT_PUBLIC_MULTISYNQ_API_KEY=your-api-key-here

# Application Configuration
# Use reverse domain notation for your app ID
NEXT_PUBLIC_APP_ID=com.yourcompany.yourapp
NEXT_PUBLIC_APP_NAME=Your App Name

# Optional: Development settings
NODE_ENV=development
`;
}

/**
 * Logs configuration status to console (development only)
 */
export function logConfigurationStatus(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const status = getConfigurationStatus();
  
  console.group('🔧 Multisynq Configuration Status');
  console.log('Configured:', status.configured ? '✅' : '❌');
  console.log('Environment:', status.environment);
  console.log('Has API Key:', status.hasApiKey ? '✅' : '❌');
  console.log('Has App ID:', status.hasAppId ? '✅' : '❌');
  console.log('Has App Name:', status.hasAppName ? '✅' : '❌');
  
  if (status.errors.length > 0) {
    console.group('❌ Errors:');
    status.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  if (status.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (status.config) {
    console.group('📋 Configuration:');
    console.log('App ID:', status.config.appId);
    console.log('App Name:', status.config.appName);
    console.log('API Key:', status.config.apiKey ? `${status.config.apiKey.substring(0, 8)}...` : 'Not set');
    console.log('Debug Mode:', status.config.debug);
    console.groupEnd();
  }
  
  console.groupEnd();
}

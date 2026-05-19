/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

interface EnvConfig {
  apiBaseUrl: string;
  socketUrl: string;
  appUrl: string;
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get environment variables from Vite
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window === 'undefined') return defaultValue;
  return import.meta.env[key] || defaultValue;
};

// Create configuration object
export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
  socketUrl: getEnvVar('VITE_SOCKET_URL', 'http://localhost:8000'),
  appUrl: getEnvVar('VITE_APP_URL', 'http://localhost:5173'),
  environment: getEnvVar('VITE_ENVIRONMENT', 'development') as EnvConfig['environment'],
  isDevelopment: getEnvVar('VITE_ENVIRONMENT', 'development') === 'development',
  isProduction: getEnvVar('VITE_ENVIRONMENT', 'development') === 'production',
};

// Log configuration in development
if (env.isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 Environment Configuration:', env);
}

// Validate required environment variables
if (typeof window !== 'undefined') {
  const requiredEnvVars = ['VITE_API_BASE_URL', 'VITE_SOCKET_URL'];
  const missingEnvVars = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missingEnvVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingEnvVars);
    console.warn('⚠️ Using default values. Create .env.development file with:');
    missingEnvVars.forEach(key => {
      console.warn(`   ${key}=http://localhost:8000`);
    });
  }
}

export default env;


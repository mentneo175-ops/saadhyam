/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

interface EnvConfig {
  apiBaseUrl: string;
  socketUrl: string;
  appUrl: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  cloudinaryVideoUploadPreset: string;
  cloudinaryImageUploadPreset: string;
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get environment variables from Vite or process.env (for SSR)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

// Create configuration object
export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
  socketUrl: getEnvVar('VITE_SOCKET_URL', 'http://localhost:8000'),
  appUrl: getEnvVar('VITE_APP_URL', 'http://localhost:5173'),
  cloudinaryCloudName: getEnvVar('VITE_CLOUDINARY_CLOUD_NAME', ''),
  cloudinaryUploadPreset: getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', ''),
  cloudinaryVideoUploadPreset: getEnvVar('VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET', getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', '')),
  cloudinaryImageUploadPreset: getEnvVar('VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET', getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', '')),
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
      console.warn(`   ${key}='http://localhost:8000'`);
    });
  }
}

export default env;


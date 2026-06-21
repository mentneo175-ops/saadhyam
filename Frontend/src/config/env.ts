interface EnvConfig {
  apiBaseUrl: string;
  socketUrl: string;
  appUrl: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  cloudinaryVideoUploadPreset: string;
  cloudinaryImageUploadPreset: string;
  instagramVideoCompressorUrl: string;
  environment: "development" | "staging" | "production";
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get environment variables from Vite or process.env (for SSR)
const getEnvVar = (key: string, defaultValue: string = ""): string => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

const isLocalhost = (hostname: string) => {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  );
};

const getDynamicApiBaseUrl = (configuredUrl: string) => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (!isLocalhost(hostname) && (configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1"))) {
      return "https://saadhyam-production.up.railway.app";
    }
  }
  return configuredUrl;
};

const getDynamicSocketUrl = (configuredUrl: string) => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (!isLocalhost(hostname) && (configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1"))) {
      return "https://saadhyam-production.up.railway.app";
    }
  }
  return configuredUrl;
};

const getDynamicAppUrl = (configuredUrl: string) => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (!isLocalhost(hostname) && (configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1") || configuredUrl.includes("5173"))) {
      return window.location.origin;
    }
  }
  return configuredUrl;
};

// Create configuration object
export const env: EnvConfig = {
  get apiBaseUrl() {
    return getDynamicApiBaseUrl(getEnvVar("VITE_API_BASE_URL", "http://localhost:8000"));
  },
  get socketUrl() {
    return getDynamicSocketUrl(getEnvVar("VITE_SOCKET_URL", "http://localhost:8000"));
  },
  get appUrl() {
    return getDynamicAppUrl(getEnvVar("VITE_APP_URL", "http://localhost:5173"));
  },
  cloudinaryCloudName: getEnvVar("VITE_CLOUDINARY_CLOUD_NAME", ""),
  cloudinaryUploadPreset: getEnvVar("VITE_CLOUDINARY_UPLOAD_PRESET", ""),
  cloudinaryVideoUploadPreset: getEnvVar(
    "VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET",
    getEnvVar("VITE_CLOUDINARY_UPLOAD_PRESET", ""),
  ),
  cloudinaryImageUploadPreset: getEnvVar(
    "VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET",
    getEnvVar("VITE_CLOUDINARY_UPLOAD_PRESET", ""),
  ),
  instagramVideoCompressorUrl: getEnvVar(
    "VITE_INSTAGRAM_VIDEO_COMPRESSOR_URL",
    "https://www.freeconvert.com/video-compressor?utm_source=chatgpt.com",
  ),
  environment: getEnvVar("VITE_ENVIRONMENT", "development") as EnvConfig["environment"],
  isDevelopment: getEnvVar("VITE_ENVIRONMENT", "development") === "development",
  isProduction: getEnvVar("VITE_ENVIRONMENT", "development") === "production",
};

// Log configuration in development
if (env.isDevelopment && typeof window !== "undefined") {
  console.log("🔧 Environment Configuration:", env);
}

// Validate required environment variables
if (typeof window !== "undefined") {
  const requiredEnvVars = ["VITE_API_BASE_URL", "VITE_SOCKET_URL"];
  const missingEnvVars = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missingEnvVars.length > 0) {
    console.warn("⚠️ Missing environment variables:", missingEnvVars);
    console.warn("⚠️ Using default values. Create .env.development file with:");
    missingEnvVars.forEach((key) => {
      console.warn(`   ${key}='http://localhost:8000'`);
    });
  }
}

export default env;

import { env } from "@/config/env";

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

export const getApiBaseUrl = () => {
  let url = env.apiBaseUrl;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If the browser is running on a production/remote domain, but the API is set to localhost,
    // dynamically override it to the production backend URL.
    if (!isLocalhost(hostname) && (url.includes("localhost") || url.includes("127.0.0.1"))) {
      return "https://saadhyam-production.up.railway.app";
    }
  }
  return url;
};

export const getAdminApiBaseUrl = () => getApiBaseUrl();

export const getAppBaseUrl = () => {
  let url = env.appUrl;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If the browser is running on a production/remote domain, but the App URL is set to localhost,
    // dynamically override it to the current window origin.
    if (!isLocalhost(hostname) && (url.includes("localhost") || url.includes("127.0.0.1") || url.includes("5173"))) {
      return window.location.origin;
    }
  }
  return url;
};

const getBrowserHost = () => {
  if (typeof window === "undefined") {
    return "localhost";
  }

  return window.location.hostname || "localhost";
};

const buildUrl = (port: string) => {
  const host = getBrowserHost();
  return `http://${host}:${port}`;
};

export const getApiBaseUrl = () =>
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || buildUrl("8000");

export const getAdminApiBaseUrl = () =>
  import.meta.env.VITE_ADMIN_API_URL || getApiBaseUrl();

export const getAppBaseUrl = () =>
  import.meta.env.VITE_APP_URL || buildUrl("5173");

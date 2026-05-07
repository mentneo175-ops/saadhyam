const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 20000;

export async function sendQuery(query, token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token is provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use demo endpoint if no token (for testing)
    const endpoint = token ? `${API_URL}/assistant` : `${API_URL}/assistant/demo`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Assistant request failed");
    }

    const data = await response.json();
    return data.response || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 90000; // Increased to 90 seconds for AI processing with retries

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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Assistant request failed";
      
      // Provide user-friendly messages for common errors
      if (response.status === 429) {
        throw new Error("The assistant is experiencing high demand. Please wait a moment and try again.");
      } else if (response.status === 503) {
        throw new Error("The assistant service is temporarily unavailable. Please try again in a moment.");
      } else if (response.status >= 500) {
        throw new Error("The assistant encountered an error. Please try again.");
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.response || "";
  } catch (error) {
    // Better error messages
    if (error.name === 'AbortError') {
      throw new Error("The request is taking longer than expected. The assistant may be experiencing high demand. Please try again.");
    }
    
    // Network errors
    if (error.message === 'Failed to fetch') {
      throw new Error("Unable to connect to the assistant. Please check your connection and try again.");
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

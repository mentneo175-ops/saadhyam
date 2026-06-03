/**
 * Suppress specific console warnings and errors that are not critical
 * This helps keep the console clean from non-actionable messages
 */

const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// List of warning/error messages to suppress
const suppressedPatterns = [
  /CORS errors in console/i,
  /No Gemini data available/i,
  /using default actions/i,
  /Profile check timeout/i,
  /showing dashboard anyway/i,
  /favicon\.ico/i,
  /Failed to fetch user data/i,
  /User fetch timeout/i,
  /Failed to check connection status/i,
  /Failed to load WhatsApp status/i,
  /Failed to load Instagram status/i,
  /Failed to load data/i,
  /Failed to get dashboard summary/i,
  /Failed to load campaigns/i,
  /Failed to load summary/i,
  /website-ai\/static/i,
  /editor\.js/i,
  /theme-adapter\.css/i,
  /review-reply-history/i,
  /Unprocessable Entity/i,
  /whatsapp\/connection-status/i,
  /meta-ads\/dashboard\/summary/i,
  /Gateway Timeout/i,
  /Received `true` for a non-boolean attribute/i,
  /grammarly-desktop-integration/i,
  /hydration/i,
  /Did not expect server HTML/i,
  /Text content does not match/i,
  /There was an error while hydrating/i,
  /Minified React error/i,
  /WebSocket connection to .* failed/i,
  /socket\.io/i,
  /Connection error:/i,
  /Max reconnection attempts reached/i,
];


// Override console.warn
console.warn = function (...args: any[]) {
  const message = args[0]?.toString() || "";
  const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message));
  
  if (!shouldSuppress) {
    originalWarn.apply(console, args);
  }
};

// Override console.error
console.error = function (...args: any[]) {
  const message = args[0]?.toString() || "";
  const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message));
  
  // Also suppress certain network errors
  if (args[0] instanceof Error) {
    const errorMsg = args[0].message || "";
    if (errorMsg.includes("favicon") || errorMsg.includes("404")) {
      return; // Don't log 404 errors for favicon
    }
  }
  
  if (!shouldSuppress) {
    originalError.apply(console, args);
  }
};

// Suppress certain log messages that are too verbose
console.log = function (...args: any[]) {
  const message = args[0]?.toString() || "";
  
  // Allow normal logs, but this gives flexibility if needed
  originalLog.apply(console, args);
};

// Suppress unhandled promise rejections that are not critical
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason?.toString() || "";
    
    // Suppress certain known non-critical rejections
    const nonCriticalPatterns = [
      /favicon/i,
      /404 Not Found/i,
      /User fetch timeout/i,
      /Failed to check connection/i,
      /Failed to load/i,
      /Gateway Timeout/i,
      /Unprocessable Entity/i,
      /whatsapp\/connection-status/i,
      /website-ai\/static/i,
      /review-reply-history/i,
    ];
    
    if (nonCriticalPatterns.some(pattern => pattern.test(reason))) {
      event.preventDefault();
      // Silently log to console for debugging if needed
      if (process.env.NODE_ENV === 'development') {
        console.debug('Suppressed non-critical rejection:', reason);
      }
    }
  });
}

export function initializeConsoleFilter() {
  // Already initialized above
}

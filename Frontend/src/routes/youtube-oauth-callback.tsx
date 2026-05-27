import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "lucide-react";

export const Route = createFileRoute("/youtube-oauth-callback")({
  component: YouTubeOAuthCallback,
});

function YouTubeOAuthCallback() {
  useEffect(() => {
    // Get URL parameters from Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const state = params.get("state");

    if (error) {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "youtube-oauth-error",
            error: errorDescription || error,
          },
          window.location.origin,
        );
      }
      window.close();
      return;
    }

    if (code) {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "youtube-oauth-success",
            data: {
              code: code,
              state: state,
            },
          },
          window.location.origin,
        );
      }
      // Parent window will close this popup
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center p-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl backdrop-blur-md">
        <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Connecting YouTube Channel...</h2>
        <p className="text-gray-400 text-sm">Please wait while we establish a secure connection.</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "@tanstack/react-router";
import { apiClient } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const InstagramOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Instagram authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("No authorization code received from Instagram");
          return;
        }

        // Send code to backend to exchange for access token
        const response = await apiClient.post("/instagram/auth/callback", {
          code,
        });

        if (response.data.success !== false) {
          setStatus("success");
          setMessage("Instagram account connected successfully! Redirecting...");

          // Redirect to Instagram page after 2 seconds
          setTimeout(() => {
            navigate({ to: "/dashboard/instagram" });
          }, 2000);
        } else {
          setStatus("error");
          setMessage(response.data.error || "Failed to connect Instagram account");
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setMessage(
          err.response?.data?.detail ||
            "An error occurred during Instagram authorization. Please try again.",
        );

        // Redirect to Instagram page after 3 seconds
        setTimeout(() => {
          navigate({ to: "/dashboard/instagram" });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4">
      <div className="max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting Instagram...</h2>
            <p className="text-gray-600">Please wait while we authorize your account</p>
          </div>
        )}

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <h2 className="font-bold mb-2">Success!</h2>
              <p>{message}</p>
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              <h2 className="font-bold mb-2">Connection Failed</h2>
              <p className="mb-4">{message}</p>
              <button
                onClick={() => (window.location.href = "/dashboard/instagram")}
                className="text-sm underline hover:no-underline"
              >
                Return to Instagram Settings
              </button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

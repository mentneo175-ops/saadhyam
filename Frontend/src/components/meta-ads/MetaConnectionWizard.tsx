/**
 * Meta Connection Wizard
 * Beautiful wizard for connecting Meta Ad Account
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { connectMetaAccount, getMetaConnectionStatus } from "@/lib/meta-ads-api";
import { toast } from "sonner";
import { env } from "@/config/env";

interface MetaConnectionWizardProps {
  onSuccess?: () => void;
}

export function MetaConnectionWizard({ onSuccess }: MetaConnectionWizardProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();

    // Listen for OAuth success message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== env.apiBaseUrl) return;

      if (event.data.type === "meta-auth-success") {
        toast.success("Meta Ads connected successfully!");
        setIsConnected(true);
        if (onSuccess) onSuccess();
      } else if (event.data.type === "meta-auth-error") {
        toast.error(event.data.message || "Failed to connect Meta Ads");
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  const checkConnection = async () => {
    try {
      const status = await getMetaConnectionStatus();
      setIsConnected(status.is_connected);
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = () => {
    try {
      setLoading(true);
      connectMetaAccount();
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="relative -m-4 flex-grow flex items-center justify-center min-h-[400px] bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="relative -m-4 flex-grow flex items-center justify-center p-6 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />
        <Card className="max-w-md w-full border border-green-500/20 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-xl">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Already Connected!</h2>
            <p className="text-gray-600 dark:text-slate-300">Your Meta Ads account is already connected.</p>
            <Button onClick={onSuccess} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative -m-4 flex-grow flex items-center justify-center p-6 md:p-8 bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />

      <Card className="max-w-2xl w-full border border-purple-500/20 bg-card/65 dark:bg-card/45 backdrop-blur-md shadow-2xl transition-all duration-300">
        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-float">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Connect Meta Ads
            </h1>
            <p className="text-gray-600 dark:text-slate-300 text-lg">
              Launch AI-powered ad campaigns on Facebook & Instagram
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/10 border border-purple-200/20 dark:border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">AI-Powered Targeting</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Smart audience recommendations</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-pink-500/5 dark:bg-pink-950/10 border border-pink-200/20 dark:border-pink-500/20 hover:border-pink-500/40 transition-colors duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Smart Budgeting</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">AI budget optimization</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-950/10 border border-blue-200/20 dark:border-blue-500/20 hover:border-blue-500/40 transition-colors duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Real-time Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Track performance live</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/5 dark:bg-green-950/10 border border-green-200/20 dark:border-green-500/20 hover:border-green-500/40 transition-colors duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">One-Click Promotion</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Promote posts instantly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/20">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 dark:text-slate-100">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Requirements
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Facebook Page
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instagram Business Account (connected to Page)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Meta Ad Account
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Connect Meta Ads Account
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By connecting, you agree to Meta's Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

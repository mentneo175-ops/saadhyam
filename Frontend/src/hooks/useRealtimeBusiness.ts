/**
 * Custom hook for real-time business intelligence data
 * Handles fetching, caching, and state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  getBusinessProfile,
  getRealtimeBusinessAnalysis,
  getRealtimeBusinessInsights,
  getRealtimeCompetitorAnalysis,
  clearCache,
  getCacheStatus,
  formatCacheAge,
  type BusinessProfile,
  type BusinessAnalysisResult,
  type BusinessInsightsResult,
  type CompetitorAnalysisResult,
} from "@/lib/realtimeBusinessApi";

export interface UseRealtimeBusinessReturn {
  // Profile
  profile: BusinessProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  
  // Analysis
  analysis: BusinessAnalysisResult | null;
  analysisLoading: boolean;
  analysisError: string | null;
  
  // Insights
  insights: BusinessInsightsResult | null;
  insightsLoading: boolean;
  insightsError: string | null;
  
  // Competitors
  competitors: CompetitorAnalysisResult | null;
  competitorsLoading: boolean;
  competitorsError: string | null;
  
  // Actions
  refreshAll: () => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshCompetitors: () => Promise<void>;
  
  // Cache info
  cacheStatus: ReturnType<typeof getCacheStatus>;
  lastUpdated: string | null;
}

export function useRealtimeBusiness(): UseRealtimeBusinessReturn {
  // Profile state
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Analysis state
  const [analysis, setAnalysis] = useState<BusinessAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Insights state
  const [insights, setInsights] = useState<BusinessInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Competitors state
  const [competitors, setCompetitors] = useState<CompetitorAnalysisResult | null>(null);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);

  // Cache status
  const [cacheStatus, setCacheStatus] = useState(getCacheStatus());
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load business profile
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const profileData = await getBusinessProfile();
      setProfile(profileData);
      
      if (!profileData) {
        setProfileError("Business profile not found. Please complete setup.");
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setProfileError(error.message || "Failed to load business profile");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load business analysis
  const loadAnalysis = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!profile) return;

      setAnalysisLoading(true);
      setAnalysisError(null);

      try {
        const result = await getRealtimeBusinessAnalysis(profile, forceRefresh);
        setAnalysis(result);

        if (result.status === "error") {
          setAnalysisError(result.message || "Failed to load analysis");
        } else {
          setLastUpdated(new Date().toISOString());
        }
      } catch (error: any) {
        console.error("Error loading analysis:", error);
        setAnalysisError(error.message || "Failed to load business analysis");
      } finally {
        setAnalysisLoading(false);
        setCacheStatus(getCacheStatus());
      }
    },
    [profile]
  );

  // Load business insights
  const loadInsights = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!profile) return;

      setInsightsLoading(true);
      setInsightsError(null);

      try {
        const result = await getRealtimeBusinessInsights(profile, forceRefresh);
        setInsights(result);

        if (result.status === "error") {
          setInsightsError(result.message || "Failed to load insights");
        } else {
          setLastUpdated(new Date().toISOString());
        }
      } catch (error: any) {
        console.error("Error loading insights:", error);
        setInsightsError(error.message || "Failed to load business insights");
      } finally {
        setInsightsLoading(false);
        setCacheStatus(getCacheStatus());
      }
    },
    [profile]
  );

  // Load competitor analysis
  const loadCompetitors = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!profile) return;

      setCompetitorsLoading(true);
      setCompetitorsError(null);

      try {
        const result = await getRealtimeCompetitorAnalysis(profile, forceRefresh);
        setCompetitors(result);

        if (result.status === "error") {
          setCompetitorsError(result.message || "Failed to load competitors");
        } else {
          setLastUpdated(new Date().toISOString());
        }
      } catch (error: any) {
        console.error("Error loading competitors:", error);
        setCompetitorsError(error.message || "Failed to load competitor analysis");
      } finally {
        setCompetitorsLoading(false);
        setCacheStatus(getCacheStatus());
      }
    },
    [profile]
  );

  // Refresh functions
  const refreshAnalysis = useCallback(async () => {
    await loadAnalysis(true);
  }, [loadAnalysis]);

  const refreshInsights = useCallback(async () => {
    await loadInsights(true);
  }, [loadInsights]);

  const refreshCompetitors = useCallback(async () => {
    await loadCompetitors(true);
  }, [loadCompetitors]);

  const refreshAll = useCallback(async () => {
    clearCache();
    await Promise.all([
      loadAnalysis(true),
      loadInsights(true),
      loadCompetitors(true),
    ]);
  }, [loadAnalysis, loadInsights, loadCompetitors]);

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load data when profile is available
  useEffect(() => {
    if (profile) {
      loadAnalysis();
      loadInsights();
      // Don't load competitors by default (can be heavy)
    }
  }, [profile, loadAnalysis, loadInsights]);

  return {
    // Profile
    profile,
    profileLoading,
    profileError,

    // Analysis
    analysis,
    analysisLoading,
    analysisError,

    // Insights
    insights,
    insightsLoading,
    insightsError,

    // Competitors
    competitors,
    competitorsLoading,
    competitorsError,

    // Actions
    refreshAll,
    refreshAnalysis,
    refreshInsights,
    refreshCompetitors,

    // Cache info
    cacheStatus,
    lastUpdated,
  };
}

import { useState, useEffect } from "react";
import type { Business } from "@/components/b2b-network/types";
import { env } from "@/config/env";

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${env.apiBaseUrl}/api/profile/business`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch business profile");
      }

      const data = await response.json();

      // Transform API response to Business type
      const businessData: Business = {
        id: "user-business",
        name: data.business_name || "Your Business",
        category: data.business_type || "Technology",
        logo: undefined,
        description: data.business_description,
        location: {
          lat: data.latitude || 17.3850,  // Use from profile or default to Hyderabad
          lng: data.longitude || 78.4867,
        },
        services: ["AI Automation", "Web Development"], // Default services
        employees: undefined,
        aiScore: 95,
        isPartner: true,
        isVerified: true,
        isSatellite: false,
        source: "saadhyam",
        website: data.website_url,
        connections: [],
      };
      
      console.log("📍 User business location:", businessData.location);

      setBusiness(businessData);
    } catch (err) {
      console.error("Error fetching business:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      // Fallback to mock data for development
      setBusiness({
        id: "user-business",
        name: "Your Business",
        category: "Technology",
        location: { lat: 17.3850, lng: 78.4867 },
        services: ["AI Automation", "Web Development", "Marketing"],
        employees: 25,
        aiScore: 95,
        isPartner: true,
        isVerified: true,
        isSatellite: false,
        source: "saadhyam",
        connections: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return { business, loading, error, refetch: fetchBusiness };
}

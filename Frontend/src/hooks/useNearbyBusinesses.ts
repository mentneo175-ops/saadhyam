import { useState, useEffect } from "react";
import type { Business } from "@/components/b2b-network/types";

export function useNearbyBusinesses(
  userLat?: number,  // Not used anymore - gets from backend
  userLng?: number,  // Not used anymore - gets from backend
  radius: number = 50000  // 50km radius for city-wide coverage
) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyBusinesses();
  }, [radius]);

  const fetchNearbyBusinesses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      if (!token) {
        console.error("No authentication token found");
        setBusinesses([]);
        return;
      }

      // Use /nearby/me endpoint to get businesses near user's exact location
      const response = await fetch(
        `http://localhost:8000/api/b2b-network/nearby/me?radius=${radius}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Fetched businesses near your location:", data.businesses.length);
        setBusinesses(data.businesses || []);
      } else if (response.status === 400) {
        console.error("Business location not set in profile");
        setError("Please set your business location in your profile");
        setBusinesses([]);
      } else {
        console.error("Failed to fetch businesses:", response.status);
        setBusinesses([]);
      }
    } catch (err) {
      console.error("Error fetching nearby businesses:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  return { businesses, loading, error, refetch: fetchNearbyBusinesses };
}

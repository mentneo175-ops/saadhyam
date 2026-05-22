import { useQuery } from "@tanstack/react-query";
import type { Business } from "@/components/b2b-network/types";
import { env } from "@/config/env";

// Fetch function for React Query with timeout
async function fetchNearbyBusinesses(
  radius: number,
  saadhyamOnly?: boolean
): Promise<Business[]> {
  const token = localStorage.getItem("saadhyam_token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  const params = new URLSearchParams({ radius: radius.toString() });
  if (saadhyamOnly) {
    params.append("saadhyam_only", "true");
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 second timeout (backend has 25s)

  try {
    const response = await fetch(
      `${env.apiBaseUrl}/api/b2b-network/nearby/me?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Please set your business location in your profile");
      }
      throw new Error(`Failed to fetch businesses: ${response.status}`);
    }

    const data = await response.json();
    return data.businesses || [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw error;
  }
}

export function useNearbyBusinesses(
  userLat?: number,  // Not used anymore - gets from backend
  userLng?: number,  // Not used anymore - gets from backend
  radius: number = 50000,  // 50km radius for city-wide coverage
  saadhyamOnly?: boolean  // Filter to show only Sadhyam users
) {
  const { data: businesses = [], isLoading, error, refetch } = useQuery({
    queryKey: ["nearby-businesses", radius, saadhyamOnly],
    queryFn: async () => {
      const result = await fetchNearbyBusinesses(radius, saadhyamOnly);
      console.log('📊 useNearbyBusinesses received:', result.length, 'businesses');
      console.log('📊 First business:', result[0]);
      return result;
    },
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    retry: 1, // Only retry once on failure
  });

  console.log('📊 useNearbyBusinesses hook state:', { 
    businessesCount: businesses.length, 
    isLoading, 
    hasError: !!error 
  });

  return {
    businesses,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

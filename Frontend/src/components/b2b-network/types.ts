export interface Business {
  id: string;
  name: string;
  category: string;
  logo?: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
  };
  services: string[];
  employees?: number;
  aiScore?: number;
  isPartner: boolean;
  isVerified: boolean;
  isSatellite: boolean;
  source: "saadhyam" | "external";
  website?: string;
  connections?: string[]; // IDs of connected businesses
  distance?: number; // Distance in meters
  distance_km?: number; // Distance in kilometers
}

export interface ServiceFlow {
  id: string;
  from: string;
  to: string;
  service: string;
  progress: number;
}

export interface NetworkNode {
  business: Business;
  x: number;
  y: number;
  connections: string[];
}

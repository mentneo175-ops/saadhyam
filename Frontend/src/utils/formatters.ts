/**
 * Format large numbers into K/M format
 * @param num - Number to format
 * @returns Formatted string (e.g., "12.5K", "1.2M")
 */
export function formatFollowers(num: number | string | undefined): string {
  if (num === undefined || num === null) {
    return "N/A";
  }

  // If it's already a string, try to parse it
  if (typeof num === "string") {
    // If it already has K or M, return as is
    if (num.includes("K") || num.includes("M") || num.includes("k") || num.includes("m")) {
      return num;
    }
    
    // Try to parse as number
    const parsed = parseFloat(num.replace(/,/g, ""));
    if (isNaN(parsed)) {
      return "N/A";
    }
    num = parsed;
  }

  // Handle 0 or invalid numbers
  if (num === 0 || isNaN(num)) {
    return "N/A";
  }

  // Format based on size
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

/**
 * Parse followers from various API response formats
 * @param data - Influencer data object
 * @returns Parsed follower count as number
 */
export function parseFollowers(data: any): number {
  // Try multiple possible field names
  const possibleFields = [
    "followers",
    "follower_count",
    "followersCount",
    "followerCount",
    "edge_followed_by",
    "subscriber_count",
    "subscriberCount",
  ];

  for (const field of possibleFields) {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      // If it's already a number
      if (typeof value === "number") {
        return value;
      }
      
      // If it's a string, try to parse
      if (typeof value === "string") {
        // Remove commas and parse
        const cleaned = value.replace(/,/g, "");
        
        // Handle K/M notation
        if (cleaned.includes("K") || cleaned.includes("k")) {
          return parseFloat(cleaned) * 1000;
        }
        if (cleaned.includes("M") || cleaned.includes("m")) {
          return parseFloat(cleaned) * 1000000;
        }
        
        // Try direct parse
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      
      // If it's an object (Instagram edge_followed_by format)
      if (typeof value === "object" && value.count !== undefined) {
        return value.count;
      }
    }
  }

  return 0;
}

/**
 * Format engagement rate
 * @param rate - Engagement rate (can be decimal or percentage)
 * @returns Formatted percentage string
 */
export function formatEngagement(rate: number | string | undefined): string {
  if (rate === undefined || rate === null) {
    return "N/A";
  }

  if (typeof rate === "string") {
    // If it already has %, return as is
    if (rate.includes("%")) {
      return rate;
    }
    
    const parsed = parseFloat(rate);
    if (isNaN(parsed)) {
      return "N/A";
    }
    rate = parsed;
  }

  if (rate === 0 || isNaN(rate)) {
    return "N/A";
  }

  // If rate is > 1, assume it's already a percentage
  if (rate > 1) {
    return rate.toFixed(1) + "%";
  }
  
  // Otherwise, convert decimal to percentage
  return (rate * 100).toFixed(1) + "%";
}

/**
 * Parse engagement rate from various formats
 * @param data - Influencer data object
 * @returns Parsed engagement rate as decimal (0.085 for 8.5%)
 */
export function parseEngagement(data: any): number {
  const possibleFields = [
    "engagement",
    "engagement_rate",
    "engagementRate",
    "avg_engagement",
    "avgEngagement",
  ];

  for (const field of possibleFields) {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      if (typeof value === "number") {
        // If > 1, assume it's percentage, convert to decimal
        return value > 1 ? value / 100 : value;
      }
      
      if (typeof value === "string") {
        const cleaned = value.replace("%", "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed > 1 ? parsed / 100 : parsed;
        }
      }
    }
  }

  return 0;
}

/**
 * Calculate estimated engagement rate from posts and followers
 * @param posts - Number of posts
 * @param followers - Number of followers
 * @param avgLikes - Average likes per post
 * @returns Estimated engagement rate as decimal
 */
export function estimateEngagement(
  posts: number,
  followers: number,
  avgLikes?: number
): number {
  if (followers === 0) return 0;
  
  // If we have average likes, use that
  if (avgLikes && avgLikes > 0) {
    return avgLikes / followers;
  }
  
  // Otherwise, estimate based on follower count
  // Typical engagement rates by follower count
  if (followers < 1000) return 0.08; // 8%
  if (followers < 10000) return 0.06; // 6%
  if (followers < 100000) return 0.04; // 4%
  if (followers < 1000000) return 0.02; // 2%
  return 0.01; // 1%
}

/**
 * Safe number formatter - never returns NaN or invalid values
 * @param value - Value to format
 * @param fallback - Fallback string if invalid
 * @returns Formatted string
 */
export function safeFormat(value: any, fallback: string = "N/A"): string {
  if (value === undefined || value === null || value === "" || value === 0) {
    return fallback;
  }
  
  if (typeof value === "number" && isNaN(value)) {
    return fallback;
  }
  
  return value.toString();
}

/**
 * Extract username from profile URL
 * @param url - Profile URL
 * @returns Username or empty string
 */
export function extractUsername(url: string): string {
  if (!url) return "";
  
  // Instagram
  const igMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  if (igMatch) return igMatch[1];
  
  // YouTube
  const ytMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
  if (ytMatch) return ytMatch[1];
  
  // Twitter
  const twMatch = url.match(/twitter\.com\/([a-zA-Z0-9_]+)/);
  if (twMatch) return twMatch[1];
  
  return "";
}

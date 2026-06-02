import { env } from "@/config/env";

const API_BASE_URL = env.apiBaseUrl;

export interface GoogleBusinessAccount {
  id: number;
  account_id: string;
  account_name?: string;
  created_at: string;
}

export interface GoogleBusinessLocation {
  id: number;
  location_id: string;
  location_name: string;
  address?: string;
  phone?: string;
  website?: string;
  primary_category?: string;
  is_verified: boolean;
  created_at: string;
}

export interface GoogleBusinessReview {
  id: number;
  reviewer_name: string;
  reviewer_photo?: string;
  rating: number;
  comment?: string;
  reply_comment?: string;
  reply_submitted_at?: string;
  review_created_at: string;
  created_at: string;
}

export interface GoogleBusinessPost {
  id: number;
  summary: string;
  media_url?: string;
  action_type: string;
  action_url?: string;
  status: 'pending' | 'published' | 'failed';
  post_id?: string;
  error_message?: string;
  created_at: string;
}

/**
 * Get Google OAuth connect link for Google Business Profile
 */
export async function getGoogleBusinessAuthUrl(token: string): Promise<{ oauth_url: string }> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/auth/connect`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Google Business connection URL');
  }

  return response.json();
}

/**
 * Send authorization code from redirect callback to register Google Business
 */
export async function handleGoogleBusinessCallback(
  token: string,
  code: string,
  state?: string
): Promise<GoogleBusinessAccount> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/auth/callback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to complete Google Business link');
  }

  return response.json();
}

/**
 * Get all connected Google Business accounts
 */
export async function getConnectedAccounts(
  token: string
): Promise<{ accounts: GoogleBusinessAccount[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/accounts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get connected accounts');
  }

  return response.json();
}

/**
 * Disconnect a Google Business account
 */
export async function disconnectAccount(
  token: string,
  accountId: number
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/accounts/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to disconnect account');
  }

  return response.json();
}

/**
 * Get all sync'd locations under active accounts
 */
export async function getConnectedLocations(
  token: string
): Promise<{ locations: GoogleBusinessLocation[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/locations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to retrieve business locations');
  }

  return response.json();
}

/**
 * Pull latest review changes from Google APIs and persist
 */
export async function syncLocationReviews(
  token: string,
  locationId: number
): Promise<{ reviews: GoogleBusinessReview[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/locations/${locationId}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to sync reviews');
  }

  return response.json();
}

/**
 * Load review details from local database
 */
export async function getLocationReviews(
  token: string,
  locationId: number,
  skip = 0,
  limit = 50
): Promise<{ reviews: GoogleBusinessReview[]; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/google-business/locations/${locationId}/reviews?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to load location reviews');
  }

  return response.json();
}

/**
 * Request AI-suggested response with specific tone profile
 */
export async function generateAiReply(
  token: string,
  reviewerName: string,
  comment: string,
  rating: number,
  tone = 'friendly'
): Promise<{ reply: string }> {
  const params = new URLSearchParams({
    reviewer_name: reviewerName,
    comment: comment,
    rating: String(rating),
    tone: tone,
  });

  const response = await fetch(`${API_BASE_URL}/api/google-business/reviews/generate-reply?${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate AI response suggestion');
  }

  return response.json();
}

/**
 * Submit approved reply comment to maps listing
 */
export async function submitReviewReply(
  token: string,
  reviewId: number,
  replyComment: string
): Promise<GoogleBusinessReview> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reply_comment: replyComment }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit review reply');
  }

  return response.json();
}

/**
 * Post an update directly to business profile
 */
export async function publishLocalPost(
  token: string,
  locationId: number,
  summary: string,
  actionType = 'LEARN_MORE',
  actionUrl?: string,
  mediaUrl?: string
): Promise<GoogleBusinessPost> {
  const response = await fetch(`${API_BASE_URL}/api/google-business/posts/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location_id: locationId,
      summary,
      action_type: actionType,
      action_url: actionUrl,
      media_url: mediaUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish post to Google Maps');
  }

  return response.json();
}

/**
 * List created posts under a location
 */
export async function getLocationPosts(
  token: string,
  locationId: number,
  skip = 0,
  limit = 20
): Promise<{ posts: GoogleBusinessPost[]; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/google-business/locations/${locationId}/posts?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to retrieve location posts');
  }

  return response.json();
}

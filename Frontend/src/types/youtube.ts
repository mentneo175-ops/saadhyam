export interface YouTubeChannel {
  id: number;
  user_id: number;
  social_account_id: number;
  channel_id: string;
  channel_title: string;
  channel_description?: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  thumbnail_url?: string;
  uploads_playlist_id?: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface YouTubeVideo {
  id: number;
  user_id: number;
  channel_id: number;
  video_id?: string;
  title: string;
  description?: string;
  tags?: string[];
  category_id: string;
  privacy_status: 'public' | 'private' | 'unlisted';
  video_url: string;
  thumbnail_url?: string;
  video_public_id?: string;
  thumbnail_public_id?: string;
  scheduled_time?: string;
  posted_time?: string;
  status: 'pending' | 'scheduled' | 'publishing' | 'posted' | 'failed';
  error_message?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface YouTubeAnalyticsSummary {
  views: number;
  watch_time_minutes: number;
  subscribers_gained: number;
  likes: number;
  comments: number;
  shares: number;
}

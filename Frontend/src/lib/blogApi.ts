/**
 * Blog API Client
 * Manages blog generation, publishing, and management
 */

const API_BASE_URL = 'http://localhost:8000';

export interface Blog {
  id: number;
  title: string;
  slug: string;
  meta_description: string;
  featured_image_url?: string;
  featured_image_prompt?: string;
  introduction: string;
  main_content: string;
  conclusion: string;
  seo_keywords: string[];
  tags: string[];
  category: string;
  reading_time: number;
  word_count: number;
  faq?: Array<{ question: string; answer: string }>;
  internal_links?: string[];
  cta?: { text: string; url: string };
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  source: string;
}

/**
 * Generate blog post using Auto Blogger
 */
export async function generateBlog(
  token: string,
  topic?: string,
  keywords?: string[]
): Promise<{ status: string; blog_id: number; blog: Blog; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/blogs/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      keywords
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate blog');
  }

  return response.json();
}

/**
 * Publish a blog post
 */
export async function publishBlog(
  token: string,
  blogId: number
): Promise<{ status: string; blog: Blog; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/blogs/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blog_id: blogId
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish blog');
  }

  return response.json();
}

/**
 * Get all user blogs
 */
export async function getUserBlogs(
  token: string,
  status?: 'draft' | 'published' | 'archived',
  limit: number = 20,
  offset: number = 0
): Promise<{ status: string; blogs: Blog[]; total: number }> {
  let url = `${API_BASE_URL}/api/blogs/?limit=${limit}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get blogs');
  }

  return response.json();
}

/**
 * Get blog by ID
 */
export async function getBlogById(
  token: string,
  blogId: number
): Promise<{ status: string; blog: Blog }> {
  const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get blog');
  }

  return response.json();
}

/**
 * Get blog by slug
 */
export async function getBlogBySlug(
  token: string,
  slug: string
): Promise<{ status: string; blog: Blog }> {
  const response = await fetch(`${API_BASE_URL}/api/blogs/slug/${slug}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get blog');
  }

  return response.json();
}

/**
 * Delete a blog post
 */
export async function deleteBlog(
  token: string,
  blogId: number
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete blog');
  }

  return response.json();
}

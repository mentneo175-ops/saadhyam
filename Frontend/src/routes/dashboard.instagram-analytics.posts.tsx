import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { env } from "@/config/env";
import { 
  Heart,
  MessageCircle, 
  Share2, 
  Bookmark,
  Eye,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  Zap,
  Calendar,
  BarChart3
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/instagram-analytics/posts')({
  component: InstagramPosts,
})

interface Post {
  id: number
  media_id: string
  media_type: string
  permalink: string
  caption: string
  media_url: string
  thumbnail_url: string
  like_count: number
  comment_count: number
  share_count: number
  save_count: number
  impressions: number
  reach: number
  engagement_rate: number
  engagement_score: number
  is_viral: boolean
  is_top_performer: boolean
  published_at: string
}

function InstagramPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'top' | 'viral'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'engagement' | 'likes'>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<number>(1)

  useEffect(() => {
    fetchPosts()
  }, [filter, sortBy])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      let url = `${env.apiBaseUrl}/api/instagram-analytics/content/${selectedAccount}/posts?limit=50`
      
      if (filter === 'top') {
        url = `${env.apiBaseUrl}/api/instagram-analytics/content/${selectedAccount}/top-posts?limit=20`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      let fetchedPosts = data.posts || []
      
      // Filter viral posts
      if (filter === 'viral') {
        fetchedPosts = fetchedPosts.filter((p: Post) => p.is_viral)
      }
      
      // Sort posts
      if (sortBy === 'engagement') {
        fetchedPosts.sort((a: Post, b: Post) => b.engagement_rate - a.engagement_rate)
      } else if (sortBy === 'likes') {
        fetchedPosts.sort((a: Post, b: Post) => b.like_count - a.like_count)
      }
      
      setPosts(fetchedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredPosts = posts.filter(post => 
    !searchQuery || 
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.media_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalEngagement = posts.reduce((sum, p) => sum + p.like_count + p.comment_count + p.share_count + p.save_count, 0)
  const avgEngagementRate = posts.length > 0 
    ? posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length 
    : 0
  const viralPostsCount = posts.filter(p => p.is_viral).length

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-b from-purple-50 to-white min-h-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-purple-800 mb-4">Instagram Post Analytics</h1>
        <p className="text-gray-600 text-lg">Track and analyze the performance of your Instagram posts with ease</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Posts</span>
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Engagement</span>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgEngagementRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Viral Posts</span>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{viralPostsCount}</p>
        </div>
      </div>

      {/* Post List */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Posts</h2>
          <div className="flex items-center space-x-4">
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as 'all' | 'top' | 'viral')} 
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All</option>
              <option value="top">Top</option>
              <option value="viral">Viral</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'engagement' | 'likes')} 
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="engagement">Engagement</option>
              <option value="likes">Likes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <div key={post.id} className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <img src={post.media_url} alt={post.caption} className="w-full h-48 object-cover rounded-md mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{post.caption || 'No Caption'}</h3>
                <p className="text-sm text-gray-600 mb-2">{formatDate(post.published_at)}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span><Heart className="inline w-4 h-4 text-red-500" /> {formatNumber(post.like_count)}</span>
                  <span><MessageCircle className="inline w-4 h-4 text-blue-500" /> {formatNumber(post.comment_count)}</span>
                  <span><Share2 className="inline w-4 h-4 text-green-500" /> {formatNumber(post.share_count)}</span>
                  <span><Bookmark className="inline w-4 h-4 text-yellow-500" /> {formatNumber(post.save_count)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

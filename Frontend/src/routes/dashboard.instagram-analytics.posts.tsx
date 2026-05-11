import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
      
      let url = `http://localhost:8000/api/instagram-analytics/content/${selectedAccount}/posts?limit=50`
      
      if (filter === 'top') {
        url = `http://localhost:8000/api/instagram-analytics/content/${selectedAccount}/top-posts?limit=20`
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Analytics</h1>
        <p className="text-gray-600">Detailed performance metrics for all your Instagram posts</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Posts</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Engagement</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgEngagementRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Engagement</span>
            <Heart className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalEngagement)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Viral Posts</span>
            <Zap className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{viralPostsCount}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setFilter('top')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'top' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Top Performers
            </button>
            <button
              onClick={() => setFilter('viral')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'viral' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Viral Posts
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="engagement">Highest Engagement</option>
            <option value="likes">Most Likes</option>
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              {/* Post Image */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  {post.is_viral && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      VIRAL
                    </div>
                  )}
                  {post.is_top_performer && (
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ⭐ Top
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {post.media_type}
                </div>
                
                {/* Engagement Score */}
                <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {post.engagement_rate.toFixed(1)}%
                </div>
              </div>

              {/* Post Details */}
              <div className="p-4">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.published_at)}
                </div>

                {/* Engagement Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.like_count)}</p>
                    <p className="text-xs text-gray-500">Likes</p>
                  </div>
                  <div className="text-center">
                    <MessageCircle className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.comment_count)}</p>
                    <p className="text-xs text-gray-500">Comments</p>
                  </div>
                  <div className="text-center">
                    <Share2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.share_count)}</p>
                    <p className="text-xs text-gray-500">Shares</p>
                  </div>
                  <div className="text-center">
                    <Bookmark className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.save_count)}</p>
                    <p className="text-xs text-gray-500">Saves</p>
                  </div>
                </div>

                {/* Reach & Impressions */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <Eye className="w-3 h-3" />
                      Reach
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.reach)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <BarChart3 className="w-3 h-3" />
                      Impressions
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatNumber(post.impressions)}</p>
                  </div>
                </div>

                {/* Caption Preview */}
                {post.caption && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {post.caption}
                  </p>
                )}

                {/* View on Instagram */}
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                >
                  View on Instagram
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

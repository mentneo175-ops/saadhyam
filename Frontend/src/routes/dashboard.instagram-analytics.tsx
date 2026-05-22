import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Instagram, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Eye,
  BarChart3,
  Lightbulb,
  RefreshCw,
  ExternalLink,
  Calendar,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { env } from "@/config/env";

export const Route = createFileRoute('/dashboard/instagram-analytics')({
  component: InstagramAnalytics,
  // Prevent redirect on refresh - stay on this route even if there are errors
  beforeLoad: async ({ location }) => {
    // Log the current location to help debug
    console.log("🔍 Loading instagram-analytics route:", location.pathname);
    // This ensures the route loads without redirecting
    // Even if there are errors, the errorComponent will handle them
    return {};
  },
  errorComponent: ({ error, reset }) => (
    <div className="p-6">
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load Instagram Analytics</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  ),
  // Explicitly prevent pending redirects
  pendingComponent: () => (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Instagram Analytics...</p>
      </div>
    </div>
  ),
})

interface InstagramAccount {
  id: number
  ig_account_id: string
  username: string
  name: string
  profile_picture_url: string
  is_active: boolean
  sync_status: string
  last_synced_at: string
  connected_at: string
}

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

interface Recommendation {
  id: number
  title: string
  recommendation: string
  category: string
  priority: string
  confidence_score: number
  generated_at: string
}

interface DashboardData {
  account: InstagramAccount
  overview: {
    followers_count: number
    follower_growth: number
    follower_growth_rate: number
    engagement_rate: number
    impressions: number
    reach: number
    profile_views: number
    website_clicks: number
  }
  recent_posts: Post[]
  recommendations: Recommendation[]
  prediction: any
  last_synced: string
}

function InstagramAnalytics() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchDashboard(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${env.apiBaseUrl}/api/instagram-analytics/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setAccounts(data.accounts || [])
      
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0].id)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async (accountId: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${env.apiBaseUrl}/api/instagram-analytics/dashboard/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    if (!selectedAccount) return
    
    try {
      setSyncing(true)
      const token = localStorage.getItem('token')
      await fetch(`${env.apiBaseUrl}/api/instagram-analytics/sync/${selectedAccount}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Refresh dashboard after sync
      setTimeout(() => {
        fetchDashboard(selectedAccount)
        setSyncing(false)
      }, 3000)
    } catch (error) {
      console.error('Error triggering sync:', error)
      setSyncing(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-full py-20">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Instagram Analytics...</p>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Instagram className="w-20 h-20 text-purple-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Instagram Business Account
          </h2>
          <p className="text-gray-600 mb-8">
            Get powerful analytics, AI-powered recommendations, and growth predictions for your Instagram account.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Connect Instagram Account
          </button>
          
          <div className="mt-12 grid grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-gray-600">Track followers, engagement, reach, and more</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <Lightbulb className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">AI Recommendations</h3>
              <p className="text-sm text-gray-600">Get smart suggestions to grow faster</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Growth Predictions</h3>
              <p className="text-sm text-gray-600">Forecast your account's future growth</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Instagram className="w-10 h-10 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instagram Analytics</h1>
            <p className="text-gray-600">AI-powered insights for your Instagram Business account</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Account Selector */}
      {accounts.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                @{account.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {dashboardData && (
        <>
          {/* Account Overview */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={dashboardData.account.profile_picture_url || '/placeholder-avatar.png'}
                alt={dashboardData.account.username}
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              <div>
                <h2 className="text-2xl font-bold">@{dashboardData.account.username}</h2>
                <p className="text-purple-100">{dashboardData.account.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-purple-100 text-sm">Followers</p>
                <p className="text-3xl font-bold">{formatNumber(dashboardData.overview.followers_count)}</p>
                <p className="text-sm text-purple-100">
                  {dashboardData.overview.follower_growth >= 0 ? '+' : ''}
                  {dashboardData.overview.follower_growth} ({dashboardData.overview.follower_growth_rate.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Engagement Rate</p>
                <p className="text-3xl font-bold">{dashboardData.overview.engagement_rate.toFixed(1)}%</p>
                <p className="text-sm text-purple-100">Average per post</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Reach</p>
                <p className="text-3xl font-bold">{formatNumber(dashboardData.overview.reach)}</p>
                <p className="text-sm text-purple-100">Total accounts reached</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Profile Views</p>
                <p className="text-3xl font-bold">{formatNumber(dashboardData.overview.profile_views)}</p>
                <p className="text-sm text-purple-100">Recent period</p>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {dashboardData.recommendations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-900">AI Recommendations</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.recommendations.slice(0, 4).map(rec => (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-white border">
                        {(rec.confidence_score * 100).toFixed(0)}% confident
                      </span>
                    </div>
                    <p className="text-sm">{rec.recommendation}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Target className="w-3 h-3" />
                      <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Recent Posts Performance</h3>
              </div>
              <a
                href={`/dashboard/instagram-analytics/posts`}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                View All Posts
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.recent_posts.slice(0, 6).map(post => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Post Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                    {post.is_viral && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        VIRAL
                      </div>
                    )}
                    {post.is_top_performer && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        ⭐ Top Post
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {post.media_type}
                    </div>
                  </div>

                  {/* Post Stats */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{formatDate(post.published_at)}</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {post.engagement_rate.toFixed(1)}% engagement
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold">{formatNumber(post.like_count)}</p>
                      </div>
                      <div>
                        <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold">{formatNumber(post.comment_count)}</p>
                      </div>
                      <div>
                        <Share2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold">{formatNumber(post.share_count)}</p>
                      </div>
                      <div>
                        <Bookmark className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold">{formatNumber(post.save_count)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(post.reach)} reach</span>
                      </div>
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        View on Instagram
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {post.caption && (
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {post.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Prediction */}
          {dashboardData.prediction && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Growth Prediction</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Followers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(dashboardData.prediction.predicted_followers)}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    +{formatNumber(dashboardData.prediction.predicted_follower_growth)} growth
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.prediction.predicted_growth_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Next {dashboardData.prediction.prediction_period}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(dashboardData.prediction.confidence_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Prediction accuracy</p>
                </div>
              </div>
            </div>
          )}

          {/* Last Synced */}
          {dashboardData.last_synced && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Last updated: {new Date(dashboardData.last_synced).toLocaleString()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

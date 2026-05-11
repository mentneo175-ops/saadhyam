import { useState } from 'react'
import { Instagram, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface InstagramConnectProps {
  onClose: () => void
  onSuccess: () => void
}

export function InstagramConnect({ onClose, onSuccess }: InstagramConnectProps) {
  const [step, setStep] = useState<'info' | 'connecting' | 'success' | 'error'>('info')
  const [error, setError] = useState<string>('')

  const handleConnect = async () => {
    setStep('connecting')
    
    try {
      // Step 1: Get OAuth URL from backend
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/instagram-analytics/oauth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get OAuth URL')
      }
      
      const data = await response.json()
      
      // Step 2: Open OAuth window
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const oauthWindow = window.open(
        data.oauth_url,
        'Instagram OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Step 3: Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'instagram-oauth-success') {
          oauthWindow?.close()
          
          // Connect account with received data
          try {
            const connectResponse = await fetch('http://localhost:8000/api/instagram-analytics/connect', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(event.data.data)
            })
            
            if (!connectResponse.ok) {
              throw new Error('Failed to connect account')
            }
            
            setStep('success')
            setTimeout(() => {
              onSuccess()
              onClose()
            }, 2000)
          } catch (err) {
            setStep('error')
            setError('Failed to connect Instagram account. Please try again.')
          }
        } else if (event.data.type === 'instagram-oauth-error') {
          oauthWindow?.close()
          setStep('error')
          setError(event.data.error || 'OAuth failed. Please try again.')
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Cleanup
      const checkClosed = setInterval(() => {
        if (oauthWindow?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          if (step === 'connecting') {
            setStep('error')
            setError('OAuth window was closed. Please try again.')
          }
        }
      }, 1000)
      
    } catch (err) {
      setStep('error')
      setError('Failed to initiate OAuth. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Info Step */}
        {step === 'info' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Instagram Business Account
              </h2>
              <p className="text-gray-600">
                Connect your Instagram Business account to unlock powerful analytics and AI insights
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Real-Time Analytics</p>
                  <p className="text-sm text-gray-600">Track followers, engagement, reach, and impressions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">AI Recommendations</p>
                  <p className="text-sm text-gray-600">Get smart suggestions to optimize your content</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Growth Predictions</p>
                  <p className="text-sm text-gray-600">Forecast your account's future performance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Post Performance</p>
                  <p className="text-sm text-gray-600">Detailed analytics for every post, reel, and story</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> You need an Instagram Business or Creator account connected to a Facebook Page to use this feature.
              </p>
            </div>

            <button
              onClick={handleConnect}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Connect Instagram Account
            </button>
          </>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connecting...</h3>
            <p className="text-gray-600">
              Please complete the authorization in the popup window
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Successfully Connected!</h3>
            <p className="text-gray-600">
              Your Instagram account has been connected. Fetching analytics...
            </p>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Failed</h3>
              <p className="text-gray-600">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('info')}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

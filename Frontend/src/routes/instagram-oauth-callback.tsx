import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader } from 'lucide-react'

export const Route = createFileRoute('/instagram-oauth-callback')({
  component: InstagramOAuthCallback,
})

function InstagramOAuthCallback() {
  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'instagram-oauth-error',
          error: errorDescription || error
        }, window.location.origin)
      }
      window.close()
      return
    }

    if (code) {
      // Exchange code for token and account info
      // This would typically be done on the backend
      // For now, send the code to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'instagram-oauth-success',
          data: {
            code: code
          }
        }, window.location.origin)
      }
      // Window will be closed by parent
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-slate-100">
          Connecting Instagram Account...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete the connection
        </p>
      </div>
    </div>
  )
}

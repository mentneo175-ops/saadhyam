import { Instagram } from "lucide-react";

export function InstagramLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8">
      {/* Animated background circles - subtle */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Rotating app icon - clean and simple */}
        <div className="relative">
          <img 
            src="/src/Icon/Saadhyam_Icon-removebg-preview.png" 
            alt="Saadhyam AI" 
            className="w-24 h-24 object-contain animate-spin"
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Loading text with gradient */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-pink-500" />
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Loading Instagram
            </h2>
          </div>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import LogoImage from "@/Icon/Saadhyam_Icon-removebg-preview.png";

interface DashboardLoaderProps {
  isLoading: boolean;
  message?: string;
}

export function DashboardLoader({ isLoading, message = "Analyzing your business..." }: DashboardLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with spinning animation */}
        <div className="relative mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 -m-4">
            <div className="w-32 h-32 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          
          {/* Logo */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <img 
              src={LogoImage} 
              alt="Saadhyam AI" 
              className="w-20 h-20 object-contain animate-pulse"
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>
          <p className="text-sm text-gray-600">
            Setting up your personalized dashboard
          </p>
        </div>

        {/* Progress indicators */}
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

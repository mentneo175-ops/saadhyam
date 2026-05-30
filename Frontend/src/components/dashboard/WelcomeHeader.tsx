import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
}

const BUSINESS_QUOTES = [
  "Success is not final, failure is not fatal. Keep pushing forward.",
  "Your business is a reflection of your vision. Make it extraordinary.",
  "Great businesses are built on great relationships. Nurture them daily.",
  "Growth starts with a single decision. Make it today.",
  "Transform your vision into reality, one action at a time.",
  "The best time to start is now. The second best was yesterday.",
  "Your business deserves excellence. Demand it every day.",
  "Innovation is the heartbeat of every successful business.",
  "Lead with purpose, build with passion, succeed with persistence.",
  "Every challenge is an opportunity to grow stronger.",
];

export const WelcomeHeader = () => {
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Set hydration flag
    setIsHydrated(true);

    // Load business profile
    const loadBusinessData = async () => {
      try {
        const response = await apiClient.get("/business/profile");
        if (response.data) {
          setBusinessProfile(response.data);
        }
      } catch (error) {
        // Fallback to localStorage
        const stored = localStorage.getItem("businessProfile");
        if (stored) {
          try {
            setBusinessProfile(JSON.parse(stored));
          } catch (e) {
            console.error("Failed to parse stored business profile");
          }
        }
      }
    };

    loadBusinessData();

    // Select random quote
    const randomQuote = BUSINESS_QUOTES[Math.floor(Math.random() * BUSINESS_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  const businessName = isHydrated
    ? businessProfile?.business_name || user?.name || "Business"
    : "Business";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="mb-8 pt-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
          {getGreeting()},{" "}
          <span className="bg-linear-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            {businessName}
          </span>
        </h1>
        <p className="text-gray-600 text-base lg:text-lg italic max-w-2xl leading-relaxed">
          "{quote}"
        </p>
      </div>
    </div>
  );
};

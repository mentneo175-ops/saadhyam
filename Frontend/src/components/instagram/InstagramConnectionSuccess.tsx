import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Instagram,
  ArrowRight,
  Sparkles,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";

interface InstagramConnectionSuccessProps {
  accountUsername?: string;
  pageName?: string;
  onContinue: () => void;
  onGoToSettings: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: "AI Content Creation",
    description: "Generate engaging captions and content ideas",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Post at optimal times for maximum engagement",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your post performance and growth",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Automation Tools",
    description: "Automate posting and engagement workflows",
    color: "from-orange-500 to-red-500",
  },
];

export const InstagramConnectionSuccess: React.FC<InstagramConnectionSuccessProps> = ({
  accountUsername,
  pageName,
  onContinue,
  onGoToSettings,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse" />
        </div>
      )}

      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              🎉 Instagram Connected Successfully!
            </h1>
            <p className="text-lg text-gray-600">
              Your Instagram Business account is now ready for AI-powered content creation
            </p>
          </div>
        </div>

        {/* Account Info */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Instagram className="w-6 h-6 text-pink-500" />
              Connected Account
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                @{accountUsername || 'Your Account'}
              </p>
              {pageName && (
                <p className="text-gray-600">{pageName}</p>
              )}
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              ✅ Business Account Connected
            </Badge>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-slate-100">
            What You Can Do Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 dark:text-slate-100">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center text-blue-900">
              Ready to Get Started?
            </CardTitle>
            <CardDescription className="text-center text-blue-700">
              Choose what you'd like to do first with your connected Instagram account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
                size="lg"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Start Creating Posts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={onGoToSettings}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                size="lg"
              >
                Configure Automation Settings
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-600">
                💡 <strong>Pro Tip:</strong> Visit Settings to configure automated posting, 
                scheduling preferences, and notification settings for the best experience.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">✓</p>
            <p className="text-sm text-gray-600">Account Connected</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">∞</p>
            <p className="text-sm text-gray-600">Unlimited Posts</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-purple-600">AI</p>
            <p className="text-sm text-gray-600">Powered Content</p>
          </div>
        </div>
      </div>
    </div>
  );
};
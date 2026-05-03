import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, DollarSign, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/pricing")({
  head: () => ({ meta: [{ title: "Pricing Suggestion AI — Saadhyam AI" }] }),
  component: PricingAIPage,
});

function PricingAIPage() {
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await apiClient.getPricingSuggestion({
        service_type: serviceType,
        location: location,
        experience: experience,
      });
      if (response.success) {
        setSuggestedPrice(response.suggested_price);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setSuggestedPrice("₹2,500 - ₹3,500");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Pricing Suggestion AI"
        subtitle="Get AI-powered pricing recommendations for your services"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Market Analysis
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Service Type</label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g., Teeth Whitening, Hair Cut, Massage"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Hyderabad, Banjara Hills"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Experience Level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            >
              <option value="">Select experience</option>
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (3-5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>

          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Target size={16} className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Get Pricing Suggestion
              </>
            )}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-4">Pricing Analysis</h3>

          {suggestedPrice ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Suggested Price Range</p>
                <p className="text-3xl font-bold text-gray-900">{suggestedPrice}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <DollarSign size={16} className="mx-auto mb-1 text-gray-600" />
                  <p className="text-xs text-gray-600">Low</p>
                  <p className="text-sm font-semibold">₹2,000</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-300">
                  <Target size={16} className="mx-auto mb-1 text-purple-600" />
                  <p className="text-xs text-purple-600">Optimal</p>
                  <p className="text-sm font-semibold">₹3,000</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <TrendingUp size={16} className="mx-auto mb-1 text-gray-600" />
                  <p className="text-xs text-gray-600">High</p>
                  <p className="text-sm font-semibold">₹4,000</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Market Insights</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Competitors charge ₹2,500-₹3,800</li>
                  <li>• Premium locations can charge 20% more</li>
                  <li>• Offer packages for better value</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Enter service details to get pricing suggestions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Download, Edit, Share2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { env } from "@/config/env";

export const Route = createFileRoute("/website/$websiteId")({
  head: () => ({ meta: [{ title: "Website Preview — Saadhyam AI" }] }),
  component: WebsitePreviewPage,
});

function WebsitePreviewPage() {
  const { websiteId } = Route.useParams();
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWebsiteData = async () => {
      try {
        setLoading(true);
        
        // Fetch website data from the backend
        const response = await fetch(`${env.apiBaseUrl}/api/v1/websites/${websiteId}`, {
          headers: {
            "Authorization": `Bearer ${apiClient.getToken()}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWebsiteData(data);
        } else {
          setError("Website not found");
        }
      } catch (err) {
        console.error("Failed to load website:", err);
        setError("Failed to load website");
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      loadWebsiteData();
    }
  }, [websiteId]);

  const handleViewLive = () => {
    if (websiteData?.preview_url) {
      window.open(`${env.apiBaseUrl}${websiteData.preview_url}`, '_blank');
    }
  };

  const handleDownload = () => {
    if (websiteData?.html_url) {
      window.open(`${env.apiBaseUrl}${websiteData.html_url}`, '_blank');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/saadhyam/${websiteId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${websiteData?.business_name} Website`,
          text: `Check out this website created with Saadhyam AI`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success("Website link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Website Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={16} /> Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">{websiteData?.business_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {websiteData?.theme} • Created {new Date(websiteData?.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={16} /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download size={16} /> Download
              </Button>
              <Button variant="hero" size="sm" onClick={handleViewLive}>
                <ExternalLink size={16} /> View Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Website Preview */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-background rounded px-3 py-1 text-sm text-muted-foreground">
                {websiteData?.preview_url ? `localhost:8000${websiteData.preview_url}` : 'Website Preview'}
              </div>
            </div>
          </div>
          
          {/* Website iframe */}
          <div className="aspect-16/10 bg-white">
            {websiteData?.preview_url ? (
              <iframe
                src={`${env.apiBaseUrl}${websiteData.preview_url}`}
                className="w-full h-full border-0"
                title={`${websiteData.business_name} Website Preview`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Website preview not available
              </div>
            )}
          </div>
        </div>

        {/* Website Details */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Website Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span>{websiteData?.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Type:</span>
                <span>{websiteData?.business_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme:</span>
                <span className="capitalize">{websiteData?.theme?.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize text-green-600">{websiteData?.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleViewLive}>
                <ExternalLink size={16} /> Open in New Tab
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                <Download size={16} /> Download HTML
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                <Share2 size={16} /> Share Website
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Edit size={16} /> Edit Website (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
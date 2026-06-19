import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import ResponsiveDesktopNotice from "@/components/ResponsiveDesktopNotice";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, Download, Loader2, Code, ExternalLink, Share2, Brain, Zap, Target, Check, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/website")({
  head: () => ({ meta: [{ title: "Website AI — Saadhyam AI" }] }),
  component: WebsiteAIPage,
});

const templates = [
  { key: "hero-split", label: "Hero Split", desc: "Modern hero section with split layout" },
  { key: "bento-box", label: "Bento Box", desc: "Grid-based modern design" },
  { key: "card-masonry", label: "Card Masonry", desc: "Pinterest-style card layout" },
  { key: "magazine-grid", label: "Magazine Grid", desc: "Editorial magazine style" },
  { key: "parallax-scroll", label: "Parallax Scroll", desc: "Engaging parallax effects" },
  { key: "timeline-vertical", label: "Timeline", desc: "Vertical timeline layout" },
  { key: "minimal-modern", label: "Minimal Modern", desc: "Ultra-clean layout with beautiful typography" },
  { key: "agency-dark", label: "Agency Dark", desc: "Dark glassmorphism digital agency style" },
  { key: "retro-brutalism", label: "Retro Brutalism", desc: "Neo-brutalist cyberpunk style" },
  { key: "restaurant-showcase", label: "Restaurant Showcase", desc: "Serif typography and menu grid" },
  { key: "saas-dashboard", label: "SaaS Dashboard", desc: "SaaS layout with mock product dashboard" },
  { key: "creative-portfolio", label: "Creative Portfolio", desc: "Sleek agency/creative portfolio" },
];

function WebsiteAIPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Website generation state
  const [selectedTemplate, setSelectedTemplate] = useState("hero-split");
  const [websiteData, setWebsiteData] = useState({
    business_name: "",
    business_type: "",
    description: "",
    services: "",
    contact_email: "",
    contact_phone: "",
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<string>("");
  const [websiteResult, setWebsiteResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [websiteHtml, setWebsiteHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPreviewPath, setCurrentPreviewPath] = useState("/");
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Website confirmation state
  const [isWebsiteConfirmed, setIsWebsiteConfirmed] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Listen for navigation updates and save notifications from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Message received from iframe:', event.data);
      if (event.data.type === 'updateAddress') {
        const newPath = event.data.path;
        console.log('Updating address bar to:', newPath);
        setCurrentPreviewPath(newPath);
      } else if (event.data.type === 'contentSaved') {
        console.log('🎉 Website content saved successfully:', event.data.websiteId);
        toast.success("Website saved successfully!");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-fill data from database on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("🔍 Loading user data for auto-fill...");
        const userData = await apiClient.getProfile();
        console.log("👤 User data received:", userData);
        
        let servicesStr = "";
        let phoneVal = "";

        // 1. Fetch latest business analysis for services
        try {
          const analysisRes = await apiClient.getLatestBusinessAnalysis();
          console.log("📊 Latest business analysis received:", analysisRes);
          if (analysisRes && analysisRes.success && analysisRes.data) {
            const bizDetails = analysisRes.data.business_details || {};
            const services = bizDetails.services || [];
            if (Array.isArray(services)) {
              servicesStr = services.join(", ");
            }
          }
        } catch (e) {
          console.warn("⚠️ Failed to load business analysis services:", e);
        }

        // 2. Fetch user settings for phone number
        try {
          const settingsRes = await apiClient.getSettings();
          console.log("⚙️ User settings received:", settingsRes);
          if (settingsRes && settingsRes.success && settingsRes.settings) {
            phoneVal = settingsRes.settings.phone || "";
          }
        } catch (e) {
          console.warn("⚠️ Failed to load user settings phone:", e);
        }

        // Auto-fill form with database data from the correct API structure
        const newWebsiteData = {
          business_name: userData.business_profile?.business_name || "",
          business_type: userData.business_profile?.business_type || "",
          description: userData.business_profile?.business_description || "",
          services: servicesStr,
          contact_email: userData.email || "",
          contact_phone: phoneVal,
        };
        
        console.log("📝 Setting website data:", newWebsiteData);
        setWebsiteData(newWebsiteData);
      } catch (error) {
        console.error("❌ Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Load confirmed website on component mount
  useEffect(() => {
    const loadConfirmedWebsite = async () => {
      try {
        const profile = await apiClient.getProfile();
        
        if (profile.last_generated_website_id) {
          console.log("✅ Found confirmed website:", profile.last_generated_website_id);
          setIsWebsiteConfirmed(true);
          setShowForm(false);  // Hide form
          setWebsiteResult({ 
            website_id: profile.last_generated_website_id,
            preview_url: `/saadhyam/${profile.last_generated_website_id}`
          });
          await fetchWebsiteHtml(profile.last_generated_website_id);
        }
      } catch (error) {
        console.error("❌ Error loading confirmed website:", error);
      }
    };
    
    loadConfirmedWebsite();
  }, []);

  // Fetch website HTML for preview
  const fetchWebsiteHtml = async (websiteId: string) => {
    try {
      console.log("🔍 Fetching website HTML for preview:", websiteId);
      console.log("🔑 Token:", apiClient.getToken() ? "Present" : "Missing");
      
      const url = `${env.apiBaseUrl}/saadhyam/${websiteId}`;
      console.log("🌐 Fetching from URL:", url);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiClient.getToken()}`,
        },
      });
      
      console.log("📡 Response status:", response.status, response.statusText);
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to fetch website HTML:", response.status, errorText);
        setWebsiteStatus(`❌ Failed to load preview: ${response.status} - ${errorText.substring(0, 100)}`);
        return;
      }
      
      let html = await response.text();
      console.log("✅ Received HTML, length:", html.length);
      console.log("✅ HTML preview (first 200 chars):", html.substring(0, 200));
      
      if (!html || html.length === 0) {
        console.error("❌ Received empty HTML");
        setWebsiteStatus("❌ Received empty website content");
        return;
      }

      // Prepend backend apiBaseUrl to any root-relative website-ai assets so they load correctly inside the iframe
      html = html.replace(/(src|href)\s*=\s*["']\/website-ai\//gi, `$1="${env.apiBaseUrl}/website-ai/`);
        
        // Add base URL for resolving relative links
        const baseUrl = `${env.apiBaseUrl}/website-ai/output/`;
        const baseTag = `<base href="${baseUrl}" target="_self">`;
        
        // Minimal navigation script - handle hash links and blog navigation
        const internalNavigationScript = `
          <script>
            console.log('🚀 Navigation script loaded');
            
            // Handle hash navigation (scroll to sections)
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link) {
                const href = link.getAttribute('href');
                
                // Handle hash links (e.g., #services, #contact)
                if (href && href.startsWith('#')) {
                  e.preventDefault();
                  const targetId = href.substring(1);
                  const targetElement = document.getElementById(targetId);
                  
                  if (targetElement) {
                    console.log('📍 Scrolling to:', targetId);
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  return;
                }
                
                // Handle blog links (blogs.html, blog-*.html) - open in new tab
                if (href && (href.includes('blogs.html') || href.includes('blog-'))) {
                  e.preventDefault();
                  const fullUrl = href.startsWith('http') ? href : env.apiBaseUrl + '/website-ai/output/' + href;
                  console.log('📝 Opening blog page in new tab:', fullUrl);
                  window.open(fullUrl, '_blank');
                  return;
                }
                
                // Allow /api/ links - open in new tab
                if (href && href.startsWith('/api/')) {
                  e.preventDefault();
                  console.log('🔗 Opening API link in new tab:', href);
                  window.open(env.apiBaseUrl + href, '_blank');
                  return;
                }
                
                // Block external links in preview
                if (href && href.includes('://') && !href.includes('localhost')) {
                  e.preventDefault();
                  console.log('🚫 External link blocked in preview:', href);
                  toast.info('External links are disabled in preview mode');
                  return;
                }
              }
            }, true);
            
            // Prevent form submissions in preview
            document.addEventListener('submit', function(e) {
              e.preventDefault();
              toast.info('Form submissions are disabled in preview mode');
            }, true);
            
            console.log('✅ Navigation ready');
          </script>
        `;
        
        // Don't modify hrefs - keep them as is for proper navigation
        // Only block external links
        html = html.replace(/href\s*=\s*["'](https?:\/\/[^"']*)["']/gi, function(match, href) {
          if (!href.includes('localhost')) {
            // External link - make it show alert
            return `href="javascript:void(0)" data-external-url="${href}" onclick="alert('External links are disabled in preview mode')"`;
          }
          return match; // Keep localhost links as is
        });
        
        // Remove target="_blank" to keep navigation in same window
        html = html.replace(/target\s*=\s*["']_blank["']/gi, '');
        
        // Add meta tags and base tag
        const safeMeta = `
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${baseTag}
        `;
        
        // Insert navigation script and base tag before </head>
        html = html.replace('</head>', safeMeta + internalNavigationScript + '</head>');
        
        // Add minimal CSS
        const minimalCSS = `
          <style>
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Preview indicator */
            body::after {
              content: 'PREVIEW MODE';
              position: fixed;
              top: 10px;
              right: 10px;
              background: rgba(34, 197, 94, 0.9);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              z-index: 999999;
              pointer-events: none;
            }
          </style>
        `;
        
        html = html.replace('</head>', minimalCSS + '</head>');
        
        console.log("📝 Setting websiteHtml state, length:", html.length);
        setWebsiteHtml(html);
        console.log("📝 Setting showPreview to true");
        setShowPreview(true);
        console.log("✅ Website HTML prepared - preview should now be visible");
    } catch (error) {
      console.error("❌ Error fetching website HTML:", error);
      setWebsiteStatus(`❌ Error loading preview: ${error}`);
    }
  };

  // Download website HTML file
  const downloadWebsiteHtml = async (websiteId: string, businessName: string) => {
    try {
      const response = await fetch(`${env.apiBaseUrl}/saadhyam/${websiteId}`, {
        headers: {
          "Authorization": `Bearer ${apiClient.getToken()}`,
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-website.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log("✅ Website HTML downloaded");
      }
    } catch (error) {
      console.error("❌ Error downloading website HTML:", error);
    }
  };

  // View website source code
  const viewWebsiteCode = async (websiteId: string) => {
    try {
      const response = await fetch(`${env.apiBaseUrl}/saadhyam/${websiteId}`, {
        headers: {
          "Authorization": `Bearer ${apiClient.getToken()}`,
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          const htmlContent = `
            <html>
              <head>
                <title>Website Source Code</title>
                <style>
                  body { font-family: 'Courier New', monospace; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
                  pre { white-space: pre-wrap; word-wrap: break-word; }
                  .header { background: #2d2d30; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>Website Source Code</h2>
                  <p>Website ID: ${websiteId}</p>
                </div>
                <pre>${html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              </body>
            </html>
          `;
          newWindow.document.open();
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      }
    } catch (error) {
      console.error("❌ Error viewing website code:", error);
    }
  };

  const handleGenerateWebsite = async () => {
    // Validate required fields
    if (!websiteData.business_name.trim()) {
      setWebsiteStatus("❌ Business name is required");
      return;
    }
    
    if (!websiteData.business_type.trim()) {
      setWebsiteStatus("❌ Business type is required");
      return;
    }
    
    // Clear any existing polling
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }
    
    setIsGenerating(true);
    setIsProcessing(true);
    setProgress(0);
    setWebsiteStatus("🚀 Starting generation...");
    setWebsiteResult(null);
    setShowPreview(false);
    setJobId(null);
    
    try {
      const servicesArray = websiteData.services.split(",").map(s => s.trim()).filter(s => s);
      
      const requestData = {
        business_name: websiteData.business_name.trim(),
        business_type: websiteData.business_type.trim(),
        description: websiteData.description.trim() ? 
          websiteData.description.trim().substring(0, 500) : undefined,
        services: servicesArray.length > 0 ? servicesArray : undefined,
        contact_email: websiteData.contact_email.trim() || undefined,
        contact_phone: websiteData.contact_phone.trim() || undefined,
        theme: selectedTemplate,
      };
      
      console.log("📤 Sending request data:", requestData);
      
      const response = await fetch(`${env.apiBaseUrl}/api/v1/website-ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiClient.getToken()}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📡 Response data:", data);
      
      if (!response.ok) {
        // Handle validation errors (422) and other HTTP errors
        let errorMessage = "Generation failed";
        
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Pydantic validation errors
            errorMessage = data.detail.map((err: any) => 
              `${err.loc?.join('.')} - ${err.msg}`
            ).join(', ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        
        console.error("❌ API Error:", errorMessage);
        setWebsiteStatus(`❌ ${errorMessage}`);
        setIsProcessing(false);
        return;
      }
      
      if (data.job_id) {
        setJobId(data.job_id);
        setWebsiteStatus(`📋 Job created! ID: ${data.job_id}`);
        console.log("✅ Starting to poll for job:", data.job_id);
        // Poll for status
        pollJobStatus(data.job_id);
      } else {
        console.error("❌ No job_id in response:", data);
        setWebsiteStatus(`❌ Generation failed: ${data.detail || 'Unknown error'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Website generation error:", error);
      setWebsiteStatus("❌ Generation failed. Please try again.");
      setIsProcessing(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    let pollCount = 0;
    const maxPollCount = 150; // 5 minutes max (150 * 2 seconds)
    
    const checkStatus = async () => {
      try {
        pollCount++;
        console.log(`📊 Polling job ${jobId} (attempt ${pollCount}/${maxPollCount})`);
        
        if (pollCount > maxPollCount) {
          console.error("❌ Polling timeout - job took too long");
          setWebsiteStatus("❌ Generation timeout - please try again");
          setIsProcessing(false);
          return;
        }
        
        const response = await fetch(`${env.apiBaseUrl}/api/v1/website-ai/jobs/${jobId}`, {
          headers: {
            "Authorization": `Bearer ${apiClient.getToken()}`,
          },
        });
        
        if (!response.ok) {
          console.error("❌ Failed to fetch job status:", response.status);
          setWebsiteStatus("❌ Failed to check job status");
          setIsProcessing(false);
          return;
        }
        
        const data = await response.json();
        console.log(`📊 Job ${jobId} status:`, data.status, `progress: ${data.progress}%`);
        
        setProgress(data.progress || 0);
        
        // Update status with unique business analysis animation
        if (data.status === "pending") {
          setWebsiteStatus(`⏳ Queued - ${data.progress}%`);
          // Continue polling for pending jobs
          const timeoutId = setTimeout(checkStatus, 2000);
          setPollingTimeoutId(timeoutId);
        } else if (data.status === "processing") {
          const messages = [
            { icon: "🧠", text: "AI analyzing your business model", progress: 0 },
            { icon: "🎯", text: "Identifying target audience", progress: 20 },
            { icon: "🏗️", text: "Designing website architecture", progress: 40 },
            { icon: "📝", text: "Generating content sections", progress: 60 },
            { icon: "✨", text: "Optimizing for your audience", progress: 80 },
            { icon: "🚀", text: "Finalizing website structure", progress: 95 }
          ];
          
          const currentMessage = messages.find(m => data.progress >= m.progress) || messages[0];
          setWebsiteStatus(`${currentMessage.icon} ${currentMessage.text}... - ${data.progress}%`);
          
          // Continue polling for processing jobs
          const timeoutId = setTimeout(checkStatus, 2000);
          setPollingTimeoutId(timeoutId);
        } else if (data.status === "completed") {
          console.log("✅ Job completed! Fetching result...");
          // Fetch the result data when job is completed
          try {
            const resultResponse = await fetch(`${env.apiBaseUrl}/api/v1/website-ai/jobs/${jobId}/result`, {
              headers: {
                "Authorization": `Bearer ${apiClient.getToken()}`,
              },
            });
            
            if (!resultResponse.ok) {
              throw new Error(`Failed to fetch result: ${resultResponse.status}`);
            }
            
            const resultData = await resultResponse.json();
            console.log("✅ Result data:", resultData);
            
            setWebsiteStatus(`🎉 Website Generated Successfully!`);
            setProgress(100);
            
            // Store the result data for the buttons
            setWebsiteResult(resultData);
            
            // Automatically fetch HTML for preview
            if (resultData.website_id) {
              console.log("🌐 Fetching website HTML for preview...");
              await fetchWebsiteHtml(resultData.website_id);
            }
            
            // Show confirmation button instead of hiding form
            setShowConfirmButton(true);
            setIsProcessing(false);
            
            // DON'T hide form yet - wait for user confirmation
          } catch (error) {
            console.error("❌ Failed to fetch result:", error);
            setWebsiteStatus(`⚠️ Website generated but failed to load preview`);
            setIsProcessing(false);
          }
        } else if (data.status === "failed") {
          console.error("❌ Job failed:", data.error_message);
          setWebsiteStatus(`❌ Generation failed: ${data.error_message || 'Unknown error'}`);
          setProgress(0);
          setIsProcessing(false);
        } else {
          console.warn("⚠️ Unknown job status:", data.status);
          // Continue polling for unknown statuses
          const timeoutId = setTimeout(checkStatus, 2000);
          setPollingTimeoutId(timeoutId);
        }
      } catch (error) {
        console.error("❌ Status check error:", error);
        setWebsiteStatus("❌ Failed to check generation status");
        setIsProcessing(false);
      }
    };
    
    checkStatus();
  };

  const handleConfirmWebsite = async () => {
    if (!websiteResult?.website_id) return;
    
    try {
      console.log("📝 Confirming website:", websiteResult.website_id);
      
      const response = await fetch(`${env.apiBaseUrl}/api/profile/confirm-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
        body: JSON.stringify({
          website_id: websiteResult.website_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm website');
      }
      
      const data = await response.json();
      console.log("✅ Website confirmed:", data);
      
      // Update state
      setIsWebsiteConfirmed(true);
      setShowConfirmButton(false);
      setShowForm(false); // NOW hide the form
      
    } catch (error) {
      console.error("❌ Error confirming website:", error);
      toast.error("Failed to confirm website. Please try again.");
    }
  };

  const handleRegenerateWebsite = () => {
    setShowForm(true);
    setIsWebsiteConfirmed(false);
    setShowConfirmButton(false);
    setShowPreview(false);
    setWebsiteHtml("");
    setWebsiteResult(null);
    setProgress(0);
    setWebsiteStatus("");
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Website AI"
        subtitle="Generate instant website content or complete websites for your business"
      />

      <ResponsiveDesktopNotice storageKey="saadhyam_website_desktop_notice" />

      
        <div className={showForm ? "grid lg:grid-cols-[400px_1fr] gap-4 min-h-[600px] lg:h-[calc(100vh-16rem)]" : "w-full min-h-[600px] lg:h-[calc(100vh-16rem)]"}>
          {/* Full Website Generation */}
          {showForm && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4 h-full flex flex-col">
            <div>
              <p className="text-sm font-semibold mb-3">Select Template</p>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs border transition ${
                      selectedTemplate === t.key
                        ? "bg-gradient-primary text-primary-foreground border-transparent shadow-sm"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <p className="text-sm font-semibold">Business Details</p>
              <input
                type="text"
                placeholder="Business Name *"
                value={websiteData.business_name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 120) {
                    setWebsiteData({...websiteData, business_name: value});
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="text"
                placeholder="Business Type (e.g., Restaurant, Spa) *"
                value={websiteData.business_type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 80) {
                    setWebsiteData({...websiteData, business_type: value});
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <div className="relative">
                <textarea
                  placeholder="Business Description"
                  value={websiteData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 500) {
                      setWebsiteData({...websiteData, description: value});
                    }
                  }}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {websiteData.description.length}/500
                </div>
              </div>
              <input
                type="text"
                placeholder="Services (comma-separated)"
                value={websiteData.services}
                onChange={(e) => setWebsiteData({...websiteData, services: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={websiteData.contact_email}
                onChange={(e) => setWebsiteData({...websiteData, contact_email: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={websiteData.contact_phone}
                onChange={(e) => setWebsiteData({...websiteData, contact_phone: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </div>

            <Button
              variant="hero"
              className="w-full mt-auto"
              size="lg"
              onClick={handleGenerateWebsite}
              disabled={
                isGenerating || 
                !websiteData.business_name.trim() || 
                !websiteData.business_type.trim()
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating Website...
                </>
              ) : (
                <>
                  <Globe size={16} /> Generate Full Website
                </>
              )}
            </Button>
          </div>
          )}

          <div className={showForm ? "bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col h-full" : "w-full h-full relative bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col"}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Website Preview</p>
              <div className="flex items-center gap-2">
                {isProcessing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    <Loader2 size={10} className="animate-spin" /> Processing
                  </span>
                )}
                {websiteResult && showPreview && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success">
                    <Sparkles size={10} /> Complete
                  </span>
                )}
              </div>
            </div>

            {/* Confirmation Button - Show after generation */}
            {showConfirmButton && !isWebsiteConfirmed && websiteResult && (
              <div className="mb-3 p-4 bg-[#F3EEFF] border border-[#E9D5FF] rounded-xl">
                <p className="text-sm font-semibold text-[#8B5CF6] mb-2">
                  ✅ Website Generated Successfully!
                </p>
                <p className="text-xs text-[#7C3AED] mb-3">
                  Review your website preview below. Click "Confirm &amp; Use This Website" to make it your official website. Your published blogs will be automatically added to this website.
                </p>
                <button
                  onClick={handleConfirmWebsite}
                  className="w-full h-10 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/25 transition-all"
                >
                  <Check size={16} />
                  Confirm &amp; Use This Website
                </button>
              </div>
            )}

            {/* Regenerate Button - Show when website is confirmed and form is hidden */}
            {isWebsiteConfirmed && !showForm && (
              <div className="mb-3 flex items-center justify-between p-3 bg-[#F3EEFF] border border-[#E9D5FF] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#8B5CF6]">Your Confirmed Website</p>
                  <p className="text-xs text-[#7C3AED]">This is your official website. Blogs will be published here.</p>
                </div>
                <button
                  onClick={handleRegenerateWebsite}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#E9D5FF] text-[#8B5CF6] hover:bg-[#F3EEFF] rounded-lg transition-all"
                >
                  <RefreshCw size={12} className="inline mr-1" />
                  Regenerate
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {websiteResult && (
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewWebsiteCode(websiteResult.website_id)}
                  className="flex-1"
                >
                  <Code size={13} /> Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (websiteResult?.preview_url) {
                      window.open(`${env.apiBaseUrl}${websiteResult.preview_url}`, '_blank');
                    }
                  }}
                  className="flex-1"
                >
                  <ExternalLink size={13} /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadWebsiteHtml(websiteResult.website_id, websiteData.business_name)}
                  className="flex-1"
                >
                  <Download size={13} /> Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex-1 opacity-50"
                  title="Coming Soon - Publish to custom domain"
                >
                  <Share2 size={13} /> Publish
                </Button>
              </div>
            )}

            <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 overflow-hidden flex flex-col">
              {/* Unique Business Analysis Loading Animation */}
              {isProcessing && (
                <div className="space-y-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                      </div>
                      <span className="text-sm font-medium">Business Analysis</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{progress}%</span>
                  </div>
                  
                  {/* Animated Progress Bar */}
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden dark:bg-slate-700">
                    <div 
                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      <div className="absolute right-0 top-0 w-4 h-full bg-white/50 animate-bounce"></div>
                    </div>
                  </div>
                  
                  {/* Analysis Steps Visualization */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`flex items-center gap-1 text-xs p-2 rounded-lg transition-all ${progress >= 20 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Target className="w-3 h-3" />
                      <span>Audience</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs p-2 rounded-lg transition-all ${progress >= 60 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Zap className="w-3 h-3" />
                      <span>Content</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs p-2 rounded-lg transition-all ${progress >= 90 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Sparkles className="w-3 h-3" />
                      <span>Design</span>
                    </div>
                  </div>
                  
                  {/* Processing Status */}
                  <div className="text-sm text-center text-purple-600 font-medium">
                    {websiteStatus}
                  </div>
                </div>
              )}

              {/* Partial Website Preview During Generation */}
              {isProcessing && progress > 30 && (
                <div className="flex-1 mt-4">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span>Website Preview (Generating...)</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden h-full bg-gradient-to-br from-purple-50 to-pink-50 relative min-h-[250px]">
                    {/* Skeleton/Partial Website Preview */}
                    <div className="p-4 space-y-3 animate-pulse h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-20 h-6 bg-purple-200 rounded"></div>
                        <div className="flex gap-2">
                          <div className="w-16 h-4 bg-gray-200 rounded dark:bg-slate-700"></div>
                          <div className="w-16 h-4 bg-gray-200 rounded dark:bg-slate-700"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-3/4 h-8 bg-purple-300 rounded"></div>
                        <div className="w-full h-4 bg-gray-200 rounded dark:bg-slate-700"></div>
                        <div className="w-5/6 h-4 bg-gray-200 rounded dark:bg-slate-700"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="h-20 bg-pink-200 rounded"></div>
                        <div className="h-20 bg-blue-200 rounded"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="h-12 bg-gray-200 rounded dark:bg-slate-700"></div>
                        <div className="h-12 bg-gray-200 rounded dark:bg-slate-700"></div>
                        <div className="h-12 bg-gray-200 rounded dark:bg-slate-700"></div>
                      </div>
                    </div>
                    
                    {/* Loading Overlay */}
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building your website...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Message - Only when not processing and no preview */}
              {!showPreview && !isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="mb-4">
                    <Globe className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                  </div>
                  <div className="text-sm leading-relaxed text-gray-600 max-w-sm">
                    Fill in the business details and click 'Generate Full Website' to create your complete website with the selected template.
                  </div>
                  
                  {/* Debug Info */}
                  {websiteResult && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-left">
                      <p className="font-bold mb-2">Debug Info:</p>
                      <p>showPreview: {showPreview ? "true" : "false"}</p>
                      <p>websiteHtml length: {websiteHtml.length}</p>
                      <p>isProcessing: {isProcessing ? "true" : "false"}</p>
                      <p>websiteResult.website_id: {websiteResult?.website_id}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Website Preview */}
              {showPreview && websiteHtml && !isProcessing && (() => {
                console.log("🎨 Rendering preview - showPreview:", showPreview, "websiteHtml length:", websiteHtml.length, "isProcessing:", isProcessing);
                return (
                <div className="flex-1 flex flex-col">
                  <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between flex-shrink-0">
                    <span>Live Preview</span>
                    <span className="text-green-600">● Active</span>
                  </div>
                  
                  {/* Browser-like Address Bar */}
                  <div className="flex items-center gap-2 bg-gray-100 border rounded-lg p-2 mb-2 flex-shrink-0 dark:bg-slate-800">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={websiteResult?.preview_url ? `${env.apiBaseUrl}${websiteResult.preview_url}${currentPreviewPath}` : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newUrl = e.target.value;
                          if (newUrl.includes('/saadhyam/')) {
                            // Extract website ID and path from URL
                            const urlParts = newUrl.split('/saadhyam/')[1];
                            if (urlParts) {
                              const [websiteId, ...pathParts] = urlParts.split('/');
                              const path = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
                              
                              if (websiteId !== websiteResult?.website_id) {
                                fetchWebsiteHtml(websiteId);
                              }
                              setCurrentPreviewPath(path);
                            }
                          }
                        }}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            const newUrl = (e.target as HTMLInputElement).value;
                            if (newUrl.includes('/saadhyam/')) {
                              const urlParts = newUrl.split('/saadhyam/')[1];
                              if (urlParts) {
                                const [websiteId, ...pathParts] = urlParts.split('/');
                                const path = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
                                
                                if (websiteId) {
                                  fetchWebsiteHtml(websiteId);
                                  setCurrentPreviewPath(path);
                                }
                              }
                            } else {
                              // Open external URL in new tab
                              window.open(newUrl, '_blank');
                            }
                          }
                        }}
                        className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-400 dark:bg-slate-900 dark:border-slate-700"
                        placeholder="Enter website URL..."
                      />
                      <button
                        onClick={() => {
                          if (websiteResult?.preview_url) {
                            window.open(`${env.apiBaseUrl}${websiteResult.preview_url}`, '_blank');
                          }
                        }}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title="Open in new tab"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden flex-1 bg-white min-h-[400px] dark:bg-slate-900">
                    <iframe
                      srcDoc={websiteHtml}
                      className="w-full h-full border-0"
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                </div>
                );
              })()}
              

              
              {/* Job ID Info */}
              {jobId && !websiteResult && (
                <div className="mt-4 p-3 bg-background/50 rounded-lg flex-shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">Job ID: {jobId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}




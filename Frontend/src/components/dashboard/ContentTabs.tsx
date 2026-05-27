import { useState, useEffect } from "react";
import { Copy, Edit3, Share2, Check, Sparkles, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";

const tabs = [
  { key: "instagram", label: "Instagram Post" },
  { key: "whatsapp", label: "WhatsApp Message" },
  { key: "facebook", label: "Facebook Post" },
  { key: "reels", label: "Reels Script" },
];

interface GeneratedContent {
  headline: string;
  caption: string;
  subtext: string;
  cta: string;
  hashtags: string[];
  script?: string;
}

interface ContentItem {
  title: string;
  body: string;
  meta: string;
}

interface BusinessProfile {
  business_name: string;
  business_type: string;
  business_location: string;
  business_description: string;
}

export function ContentTabs() {
  const [active, setActive] = useState("instagram");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, ContentItem>>({});
  const [editMode, setEditMode] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Fetch user business profile on mount
  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    try {
      const response = await apiClient.get<any>("/api/profile/");
      if (response.business_profile) {
        setBusinessProfile({
          business_name: response.business_profile.business_name || "Your Business",
          business_type: response.business_profile.business_type || "General Business",
          business_location: response.business_profile.business_location || "",
          business_description: response.business_profile.business_description || ""
        });
        // Generate content after fetching profile
        generateContent(response.business_profile);
      }
    } catch (error) {
      console.error("Failed to fetch business profile:", error);
      // Generate with default values
      generateContent(null);
    }
  };

  const generateContent = async (profile?: BusinessProfile | null) => {
    setLoading(true);
    try {
      const businessData = profile || businessProfile || {
        business_name: "Your Business",
        business_type: "General Business",
        business_location: "",
        business_description: ""
      };

      // Generate content for all platforms
      const platforms = ["instagram", "facebook", "reels"];
      const newContent: Record<string, ContentItem> = {};

      for (const platform of platforms) {
        const userInput = businessData.business_description 
          ? `${businessData.business_name} - ${businessData.business_description}`
          : businessData.business_name;

        const response = await apiClient.post<any>("/content/generate", {
          business_type: businessData.business_type,
          platform: platform,
          goal: "engagement",
          tone: "friendly",
          language: "english",
          user_input: userInput
        });

        if (response.status === "success" && response.content) {
          const content: GeneratedContent = response.content;
          
          if (platform === "reels") {
            newContent[platform] = {
              title: content.headline,
              body: content.script || content.caption,
              meta: `AI-generated for ${businessData.business_name} · Optimized for Reels`
            };
          } else {
            const _tags = Array.isArray(content.hashtags)
              ? content.hashtags
              : typeof content.hashtags === "string"
              ? content.hashtags.split(/\s+/).filter(Boolean)
              : [];
            newContent[platform] = {
              title: content.headline,
              body: `${content.caption}\n\n${_tags.join(" ")}`,
              meta: `AI-generated for ${businessData.business_name} · Optimized for engagement`
            };
          }
        }
      }

      // WhatsApp message (customer engagement)
      const whatsappResponse = await apiClient.post<any>("/content/generate", {
        business_type: businessData.business_type,
        platform: "instagram",
        goal: "promotion",
        tone: "friendly",
        language: "english",
        user_input: `${businessData.business_name} customer engagement message`
      });

      if (whatsappResponse.status === "success" && whatsappResponse.content) {
        const content: GeneratedContent = whatsappResponse.content;
        newContent.whatsapp = {
          title: `Message from ${businessData.business_name}`,
          body: content.caption.replace(/\n\n/g, "\n"),
          meta: `AI-generated · Personalized for your customers`
        };
      }

      setGeneratedContent(newContent);
    } catch (error) {
      console.error("Failed to generate content:", error);
      // Fallback to default content with business name
      const businessName = businessProfile?.business_name || "Your Business";
      setGeneratedContent({
        instagram: {
          title: `${businessName} Update ✨`,
          body: `Share your story with the world! Create meaningful connections and grow your community. 🚀\n\n#Business #Growth #Success #Engagement`,
          meta: `Ready to customize for ${businessName}`
        },
        whatsapp: {
          title: "Customer Message",
          body: `Hi! 👋 We have something special for you from ${businessName}. Check out our latest updates and exclusive offers!`,
          meta: "Personalized message"
        },
        facebook: {
          title: `${businessName} Community`,
          body: `Building relationships, one post at a time. Join us on this journey! 💼\n\n#Community #Business #Facebook`,
          meta: `Ready to customize for ${businessName}`
        },
        reels: {
          title: "Reels Script",
          body: `Hook: Grab attention in 3 seconds\nValue: Share your key message about ${businessName}\nCTA: Tell them what to do next`,
          meta: "Script template"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const currentContent = generatedContent[active] || {
    title: "Loading...",
    body: "Generating personalized content...",
    meta: "Please wait"
  };

  const copy = () => {
    navigator.clipboard?.writeText(editMode ? editedBody : currentContent.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEdit = () => {
    if (!editMode) {
      setEditedBody(currentContent.body);
      setEditMode(true);
    } else {
      // Save edited content
      setGeneratedContent({
        ...generatedContent,
        [active]: {
          ...currentContent,
          body: editedBody
        }
      });
      setEditMode(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentContent.title,
          text: editMode ? editedBody : currentContent.body,
        });
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      copy();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Ready-to-use content</h3>
          {businessProfile && (
            <p className="text-[11px] text-gray-600 mt-0.5">
              Personalized for {businessProfile.business_name}
            </p>
          )}
        </div>
        <button 
          onClick={() => generateContent()}
          disabled={loading}
          className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Generate new
            </>
          )}
        </button>
      </div>
      <div 
        className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActive(t.key);
              setEditMode(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              active === t.key
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">{currentContent.title}</p>
        {editMode ? (
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full text-sm text-gray-700 leading-relaxed bg-white border border-gray-300 rounded-lg p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="Edit your content..."
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {currentContent.body}
          </p>
        )}
        <p className="text-[11px] text-gray-600 mt-3">{currentContent.meta}</p>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={copy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button 
          onClick={handleEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition"
        >
          <Edit3 size={13} /> 
          {editMode ? "Save" : "Edit"}
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 transition"
        >
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  );
}

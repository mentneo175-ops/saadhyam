import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RefreshCcw,
  Copy,
  Wand2,
  Instagram,
  Mail,
  Megaphone,
  MessageCircle,
  Loader2,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/dashboard/content")({
  head: () => ({ meta: [{ title: "Content Creator — Saadhyam AI" }] }),
  component: ContentStudio,
});

const types = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "email", label: "Email", icon: Mail },
  { key: "ad", label: "Ad copy", icon: Megaphone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const tones = ["Friendly", "Professional", "Playful", "Bold"];
const languages = ["English", "Telugu", "Hindi", "Tamil"];
const imageStyles = ["Modern", "Premium", "Vibrant"];
const imageUseCases = ["Poster", "Product", "Banner"];

function ContentStudio() {
  const [type, setType] = useState("instagram");
  const [tone, setTone] = useState("Friendly");
  const [language, setLanguage] = useState("English");
  const [prompt, setPrompt] = useState(
    "Promote our new Diwali handbag collection with 30% off this weekend.",
  );
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [note, setNote] = useState("");
  
  // Image generation states
  const [imageStyle, setImageStyle] = useState("Premium");
  const [imageUseCase, setImageUseCase] = useState("Poster");
  const [imagePrompt, setImagePrompt] = useState(""); // Auto-generated prompt for image
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [promptGenerating, setPromptGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setNote("");
    try {
      const response = await apiClient.generateContent({
        content_type: type,
        tone: tone.toLowerCase(),
        language: language.toLowerCase(),
        prompt: prompt,
      });

      if (response.success) {
        setOutput(response.content);
        setIsAIGenerated(true);
        if (response.note) {
          setNote(response.note);
          toast.info("Using fallback content generation");
        } else {
          toast.success("Content generated successfully!");
        }
      } else {
        toast.error("Failed to generate content");
        setIsAIGenerated(false);
      }
    } catch (error: any) {
      console.error("Content generation error:", error);
      toast.error(error.message || "Failed to generate content");
      setIsAIGenerated(false);

      // Fallback mock data
      setOutput(
        `✨ ${prompt}\n\nGenerated in ${language} with ${tone} tone.\n\n#AI #Content #SaadhyamAI`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImagePrompt = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    setPromptGenerating(true);
    try {
      // Get business type
      let businessType = "Business";
      try {
        const profile = localStorage.getItem("businessProfile");
        if (profile) {
          const parsed = JSON.parse(profile);
          businessType = parsed.business_name || parsed.business_type || "Business";
        }
      } catch (e) {
        // Ignore
      }

      // Generate content first to get the image_prompt from backend
      const response = await apiClient.generateContent({
        content_type: type,
        tone: tone.toLowerCase(),
        language: language.toLowerCase(),
        prompt: prompt,
      });

      // Extract image prompt from the script/content
      // For now, create a detailed prompt based on user input
      const generatedPrompt = `${imageStyle} ${imageUseCase} for ${businessType}, ${prompt}, professional marketing visual, high quality, eye-catching design, commercial photography style`;
      
      setImagePrompt(generatedPrompt);
      toast.success("Image prompt generated!");
    } catch (error: any) {
      console.error("Prompt generation error:", error);
      // Fallback: create basic prompt
      const fallbackPrompt = `${imageStyle} ${imageUseCase}, ${prompt}`;
      setImagePrompt(fallbackPrompt);
      toast.info("Using basic prompt");
    } finally {
      setPromptGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please generate image prompt first");
      return;
    }

    setImageLoading(true);
    console.log("🖼️ Starting image generation...");
    
    try {
      // Get business type from localStorage or use default
      let businessType = "Business";
      try {
        const profile = localStorage.getItem("businessProfile");
        if (profile) {
          const parsed = JSON.parse(profile);
          businessType = parsed.business_name || parsed.business_type || "Business";
        }
      } catch (e) {
        // Ignore
      }

      const payload = {
        business_type: businessType,
        use_case: imageUseCase.toLowerCase(),
        offer: imagePrompt, // Use the generated/edited prompt
        style: imageStyle.toLowerCase(),
        model: "flux",
      };

      console.log("📤 Image generation request:", payload);

      const response = await apiClient.post("/image/generate", payload);

      console.log("📥 Image generation response:", response);

      if (response.status === "success" && response.image_url) {
        const fullImageUrl = `http://localhost:8000${response.image_url}`;
        console.log("✅ Image URL:", fullImageUrl);
        setGeneratedImageUrl(fullImageUrl);
        toast.success("Image generated successfully!");
      } else {
        console.error("❌ Invalid response:", response);
        toast.error(response.message || "Failed to generate image");
      }
    } catch (error: any) {
      console.error("❌ Image generation error:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard?.writeText(output);
      toast.success("Copied to clipboard!");
    }
  };

  const handleDownloadImage = async () => {
    if (generatedImageUrl) {
      try {
        // Fetch the image as blob for proper download
        const response = await fetch(generatedImageUrl);
        if (!response.ok) throw new Error("Failed to fetch image");
        
        const blob = await response.blob();
        
        // Create object URL from blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `saadhyam-generated-poster-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        toast.success("Image downloaded successfully!");
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download image");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Content Creator"
        subtitle="Generate on-brand content in seconds"
        actions={
          <Button
            variant="hero"
            size="sm"
            onClick={() => {
              setPrompt("");
              setOutput("");
              setNote("");
              setIsAIGenerated(false);
              setGeneratedImageUrl("");
            }}
          >
            <Wand2 size={14} /> New generation
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2">Content type</p>
            <div className="flex gap-2 flex-wrap">
              {types.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    type === t.key
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Tone</p>
            <div className="flex gap-2 flex-wrap">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    tone === t
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted hover:bg-accent/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Language</p>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    language === lang
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted hover:bg-accent/40"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">What do you want to say?</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="E.g., Promote our new Diwali handbag collection with 30% off this weekend."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
            />
          </div>

          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate content
              </>
            )}
          </Button>

          {/* Image Generation Section */}
          <div className="pt-5 border-t border-border/40">
            <p className="text-sm font-semibold mb-3">Generate Image from Prompt</p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Image Style</p>
                <div className="flex gap-2 flex-wrap">
                  {imageStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setImageStyle(style)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        imageStyle === style
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted hover:bg-accent/40"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Use Case</p>
                <div className="flex gap-2 flex-wrap">
                  {imageUseCases.map((useCase) => (
                    <button
                      key={useCase}
                      onClick={() => setImageUseCase(useCase)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        imageUseCase === useCase
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted hover:bg-accent/40"
                      }`}
                    >
                      {useCase}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Image Prompt</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleGenerateImagePrompt}
                    disabled={promptGenerating || !prompt.trim()}
                  >
                    {promptGenerating ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} /> Auto-generate
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  placeholder="Click 'Auto-generate' to create image prompt from your text..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleGenerateImage}
                disabled={imageLoading || !imagePrompt.trim()}
              >
                {imageLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating image...
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} /> Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">AI output</p>
            {(output || generatedImageUrl) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <Sparkles size={10} /> Generated
              </span>
            )}
          </div>
          
          {note && (
            <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">{note}</p>
            </div>
          )}
          
          <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-3 min-h-[300px] overflow-auto">
            {/* Show generated image if available */}
            {generatedImageUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Generated Image</p>
                  <span className="text-[10px] text-muted-foreground">
                    {imageStyle} • {imageUseCase}
                  </span>
                </div>
                <div className="rounded-lg overflow-hidden border border-border/40">
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated content" 
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error("Image load error");
                      toast.error("Failed to load image");
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDownloadImage}
                  >
                    <Download size={13} /> Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleGenerateImage}
                    disabled={imageLoading}
                  >
                    <RefreshCcw size={13} /> Regenerate
                  </Button>
                </div>
              </div>
            ) : output ? (
              /* Show text content if no image */
              <div className="space-y-2">
                <p className="text-sm leading-relaxed whitespace-pre-line">{output}</p>
                {isAIGenerated && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/40">
                    Generated in {language} with {tone.toLowerCase()} tone.
                  </p>
                )}
              </div>
            ) : (
              /* Show placeholder */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Your generated content will appear here...
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate content or image to see results
                </p>
              </div>
            )}
          </div>
          
          {/* Action buttons - only show for text content */}
          {output && !generatedImageUrl && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopy}
                disabled={!output}
              >
                <Copy size={13} /> Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                <RefreshCcw size={13} /> Regenerate
              </Button>
              <Button variant="hero" size="sm" className="flex-1" disabled={!output}>
                Use it →
              </Button>
            </div>
          )}
          
          {/* Show text content below image if both exist */}
          {output && generatedImageUrl && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Text Content</p>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs leading-relaxed whitespace-pre-line">{output}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  <Copy size={13} /> Copy Text
                </Button>
                <Button variant="hero" size="sm" className="flex-1">
                  Use Both →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

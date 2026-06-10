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
  Zap,
  Stars,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { env } from "@/config/env";

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
  
  // Instagram posting states
  const [instagramLoading, setInstagramLoading] = useState(false);

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
        const fullImageUrl = `${env.apiBaseUrl}${response.image_url}`;
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

  const handlePostToInstagram = async (type: 'image' | 'both') => {
    if (instagramLoading) return;

    try {
      setInstagramLoading(true);

      // Check Instagram connection first
      try {
        const status = await apiClient.getInstagramStatus();
        if (!status.is_connected) {
          toast.error("Instagram not connected. Please connect your Instagram account in Settings first.", {
            action: {
              label: "Go to Settings",
              onClick: () => window.location.href = "/dashboard/settings"
            }
          });
          return;
        }
      } catch (error) {
        toast.error("Unable to check Instagram connection. Please try again.");
        return;
      }

      // Must have generated image for Instagram posting
      if (!generatedImageUrl) {
        toast.error("No image to post. Please generate an image first.");
        return;
      }

      let caption = "";
      if (type === 'both' && output) {
        caption = output;
      }

      // Convert image URL to File (supports both images and videos)
      let mediaFile: File;
      try {
        console.log("🖼️ Converting media URL to File:", generatedImageUrl);
        const response = await fetch(generatedImageUrl);
        if (!response.ok) throw new Error("Failed to fetch media");
        
        const blob = await response.blob();
        const isVideo = blob.type.startsWith('video/');
        const extension = isVideo ? 'mp4' : 'png';
        mediaFile = new File([blob], `saadhyam-content-${Date.now()}.${extension}`, { 
          type: blob.type || (isVideo ? 'video/mp4' : 'image/png')
        });
        console.log(`✅ Media converted to File: ${mediaFile.name}, ${mediaFile.size} bytes, type: ${mediaFile.type}`);
      } catch (error) {
        console.error("❌ Error converting media to file:", error);
        toast.error("Failed to prepare media for posting");
        return;
      }

      // Post to Instagram using the centralized apiClient
      const isVideo = mediaFile.type.startsWith("video/");
      console.log(`🚀 Posting ${isVideo ? 'video' : 'image'} to Instagram...`);
      console.log(`📝 Caption: ${caption}`);
      console.log(`${isVideo ? '🎥' : '🖼️'} Media: ${mediaFile.name} (${mediaFile.size} bytes)`);

      const data = await apiClient.uploadAndPostInstagram(mediaFile, caption);
      console.log("📥 Response data:", data);

      console.log("✅ Post successful, showing success toast");
      
      // Always show a basic success message first (same as Instagram dashboard)
      toast.success(`🎉 ${isVideo ? 'Video' : 'Image'} posted to Instagram successfully!`, {
        duration: 4000,
      });
      
      // Then show detailed message if available
      if (data && data.message) {
        setTimeout(() => {
          toast.success(data.message, {
            duration: 6000,
            description: data.details ? 
              `Posted to ${data.details.account} • ${data.details.posted_at}` : 
              data.post?.instagram_post_id ? 
                `Post ID: ${data.post.instagram_post_id}` : 
                "Your post is now live on Instagram!"
          });
        }, 500);
      }
      
      console.log("Post successful:", data);
      
      // Show Instagram URL if available
      if (data.post?.instagram_url) {
        console.log("📱 Showing Instagram link toast");
        setTimeout(() => {
          toast.info("View your post on Instagram", {
            duration: 8000,
            description: "Click to open Instagram",
            action: {
              label: "Open Instagram",
              onClick: () => window.open(data.post.instagram_url, '_blank')
            }
          });
        }, 2000);
      }

      // Clear the generated content after successful post
      setTimeout(() => {
        setOutput("");
        setGeneratedImageUrl("");
        setImagePrompt("");
        setNote("");
        setIsAIGenerated(false);
      }, 3000);

    } catch (error: any) {
      console.error("❌ Error during post:", error);
      const errorMessage = error?.data?.detail || error?.message || "Failed to post to Instagram";
      toast.error(errorMessage);
    } finally {
      setInstagramLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white p-4 md:p-6 lg:p-8">
      {/* Clean Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Content Creator
            </h1>
            <p className="text-sm text-gray-600">
              AI-powered creative studio for instant content generation
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPrompt("");
              setOutput("");
              setNote("");
              setIsAIGenerated(false);
              setGeneratedImageUrl("");
            }}
            className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all"
          >
            <Wand2 size={14} /> New Generation
          </motion.button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Clean Input Area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 space-y-6"
        >
          {/* Content Type Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Content Type
            </p>
            <div className="flex gap-2 flex-wrap">
              {types.map((t, idx) => (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setType(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === t.key
                      ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white border-transparent shadow-lg shadow-[#8B5CF6]/25"
                      : "border-gray-200 hover:border-[#8B5CF6]/40 hover:bg-[#F9F7FF] text-gray-700"
                  }`}
                >
                  <t.icon size={16} /> {t.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tone Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Tone
            </p>
            <div className="flex gap-2 flex-wrap">
              {tones.map((t, idx) => (
                <motion.button
                  key={t}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tone === t
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent"
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Language Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Language
            </p>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang, idx) => (
                <motion.button
                  key={lang}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    language === lang
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent"
                  }`}
                >
                  {lang}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Clean AI Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">
              What do you want to create?
            </p>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="E.g., Promote our new Diwali handbag collection with 30% off this weekend..."
                className="w-full rounded-lg border border-gray-300 bg-white p-4 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-400 resize-none"
              />
              <motion.div
                className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Stars size={12} className="text-purple-500" />
                <span>AI-powered</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Clean Generate Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Content</span>
              </>
            )}
          </motion.button>

          {/* Clean Image Generation Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-6 border-t border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon size={16} className="text-purple-600" />
                Image Generation
              </p>
              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                Required for Instagram
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Image Style */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Image Style</p>
                <div className="flex gap-2 flex-wrap">
                  {imageStyles.map((style, idx) => (
                    <motion.button
                      key={style}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.75 + idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        imageStyle === style
                          ? "bg-purple-100 text-purple-700 border border-purple-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-transparent"
                      }`}
                    >
                      {style}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Use Case */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Use Case</p>
                <div className="flex gap-2 flex-wrap">
                  {imageUseCases.map((useCase, idx) => (
                    <motion.button
                      key={useCase}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageUseCase(useCase)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        imageUseCase === useCase
                          ? "bg-purple-100 text-purple-700 border border-purple-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-transparent"
                      }`}
                    >
                      {useCase}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Image Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">Image Prompt</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateImagePrompt}
                    disabled={promptGenerating || !prompt.trim()}
                    className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {promptGenerating ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} />
                        Auto-generate
                      </>
                    )}
                  </motion.button>
                </div>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  placeholder="Click 'Auto-generate' to create image prompt from your text..."
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Generate Image Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateImage}
                disabled={imageLoading || !imagePrompt.trim()}
                className="w-full h-11 bg-white border border-gray-300 hover:border-purple-400 hover:bg-purple-50 text-gray-700 font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imageLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} />
                    Generate Image
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Clean AI Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 flex flex-col min-h-[600px]"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">
              AI Output
            </p>
            <AnimatePresence>
              {(output || generatedImageUrl) && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-300"
                >
                  <Sparkles size={12} />
                  AI Generated
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {note && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200"
            >
              <p className="text-xs text-amber-800 flex items-center gap-2">
                <Sparkles size={12} />
                {note}
              </p>
            </motion.div>
          )}
          
          <div className="flex-1 rounded-xl bg-gradient-to-br from-[#F8F7FC] to-[#F3F1F9] border border-gray-200/60 p-6 mb-4 min-h-[400px] overflow-auto">
            {/* Content */}
            {generatedImageUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <ImageIcon size={14} className="text-purple-600" />
                    Generated Image
                  </p>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                    {imageStyle} • {imageUseCase}
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                >
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated content" 
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error("Image load error");
                      toast.error("Failed to load image");
                    }}
                  />
                </motion.div>
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadImage}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Download size={14} /> Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateImage}
                    disabled={imageLoading}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCcw size={14} /> Regenerate
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={instagramLoading}
                    onClick={() => handlePostToInstagram('image')}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {instagramLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Instagram size={14} />
                        Post
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ) : output ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-800">{output}</p>
                {isAIGenerated && (
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-600" />
                    Generated in {language} with {tone.toLowerCase()} tone
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <Sparkles size={48} className="text-gray-300 mb-4" />
                <p className="text-base font-medium text-gray-700 mb-2">
                  Your AI-generated content will appear here
                </p>
                <p className="text-sm text-gray-500">
                  Generate content and image to post to Instagram
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Action buttons - only show for text content */}
          <AnimatePresence>
            {output && !generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  disabled={!output}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Copy size={14} /> Copy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCcw size={14} /> Regenerate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Instagram size={14} /> Need Image
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Show text content below image if both exist */}
          <AnimatePresence>
            {output && generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageCircle size={12} className="text-purple-600" />
                  Text Content
                </p>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
                  <p className="text-xs leading-relaxed whitespace-pre-line text-gray-700">{output}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopy}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Copy size={14} /> Copy Text
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={instagramLoading}
                    onClick={() => handlePostToInstagram('both')}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {instagramLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Instagram size={14} />
                        Post Both
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

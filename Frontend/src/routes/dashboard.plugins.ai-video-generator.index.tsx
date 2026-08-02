import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Download,
  Trash2,
  Save,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Copy,
  Settings,
  Sliders,
  Play,
  Pause,
  Square,
  FileText,
  Volume2,
  Image as ImageIcon,
  Edit3,
  Type,
  Plus,
  RefreshCw,
  Video,
  Layers,
  Music,
  Share2,
  AlertTriangle,
  Film,
  Globe,
  Search,
  Upload,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";


export const Route = createFileRoute("/dashboard/plugins/ai-video-generator/")({
  head: () => ({
    meta: [{ title: "AI Video Generator — Saadhyam AI" }],
  }),
  component: AIVideoGeneratorPage,
});

interface BrandSetup {
  businessName: string;
  website: string;
  industry: string;
  logoText: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
  brandTone: string;
}

interface VideoConfig {
  platform: string;
  videoType: string;
  duration: string;
  aspectRatio: string;
  resolution: string;
  language: string;
  targetAudience: string;
  cta: string;
}

interface GeneratedScript {
  title: string;
  hook: string;
  narration: string;
  cta: string;
}

interface StoryboardScene {
  id: string;
  title: string;
  duration: number;
  visualDescription: string;
  cameraAngle: string;
  animation: string;
  transition: string;
  imageUrl?: string;
  captionText?: string;
}

interface VoiceConfig {
  gender: string;
  accent: string;
  speed: string;
  audioUrl?: string;
  duration?: number;
  provider?: string;
  model?: string;
  generationTime?: number;
  status?: string;
}

interface CaptionConfig {
  fontFamily: string;
  color: string;
  position: string;
  animation: string;
}

interface RenderedVideoDetails {
  videoUrl?: string;
  thumbnailUrl?: string;
  previewGif?: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  renderTime?: number;
  status?: "completed" | "fallback" | "failed";
  outputSize?: number;
  message?: string;
}

interface MusicConfig {
  mood: string;
  genre: string;
  duration: string;
  volume: number;
  loop: boolean;
  musicUrl?: string;
  provider?: string;
  model?: string;
  status?: string;
}

interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: SubtitleWord[];
}

interface CaptionPreset {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bgBox: boolean;
  shadow: boolean;
  opacity: number;
  animation: string;
  position: string;
}

interface SubtitleState {
  segments: SubtitleSegment[];
  srtUrl?: string;
  vttUrl?: string;
  assUrl?: string;
  txtUrl?: string;
  provider?: string;
  model?: string;
  language: string;
  quality: "fast" | "balanced" | "accurate";
  targetLanguages: string[];
  translations: Record<string, SubtitleSegment[]>;
  translationFiles: Record<string, { srtUrl: string; vttUrl: string }>;
  history: SubtitleSegment[][];
}

interface ExtendedCaptionConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bgBox: boolean;
  shadow: boolean;
  opacity: number;
  animation: string;
  position: string;
}

interface SavedProject {
  id: string;
  timestamp: string;
  brand: BrandSetup;
  config: VideoConfig;
  script: GeneratedScript;
  scenes: StoryboardScene[];
  voice: VoiceConfig;
  captions: CaptionConfig;
  musicTrack: string;
  renderedVideo?: RenderedVideoDetails | null;
  music?: MusicConfig;
  mixedAudioUrl?: string;
  subtitles?: SubtitleState;
}

const DEFAULT_BRAND: BrandSetup = {
  businessName: "",
  website: "",
  industry: "Technology",
  logoText: "",
  primaryColor: "#a855f7",
  secondaryColor: "#ec4899",
  fontStyle: "Inter",
  brandTone: "Professional",
};

const DEFAULT_CONFIG: VideoConfig = {
  platform: "Instagram",
  videoType: "Reels/Shorts",
  duration: "30s",
  aspectRatio: "9:16 Vertical",
  resolution: "1080p Full HD",
  language: "English",
  targetAudience: "Young Entrepreneurs, Tech Enthusiasts",
  cta: "Learn More",
};

const DEFAULT_SCRIPT: GeneratedScript = {
  title: "",
  hook: "",
  narration: "",
  cta: "",
};

const DEFAULT_VOICE: VoiceConfig = {
  gender: "Female",
  accent: "US English",
  speed: "1.0x",
};

const DEFAULT_CAPTIONS: CaptionConfig = {
  fontFamily: "Inter",
  color: "#ffffff",
  position: "Bottom Center",
  animation: "Pop-in",
};

const DEFAULT_EXTENDED_CAPTIONS: ExtendedCaptionConfig = {
  fontFamily: "Inter",
  fontSize: 28,
  fontWeight: "700",
  color: "#FFFFFF",
  strokeColor: "#000000",
  strokeWidth: 2,
  bgBox: false,
  shadow: true,
  opacity: 1.0,
  animation: "Fade",
  position: "Bottom Center",
};

const DEFAULT_SUBTITLE_STATE: SubtitleState = {
  segments: [],
  language: "en",
  quality: "balanced",
  targetLanguages: [],
  translations: {},
  translationFiles: {},
  history: [],
};

const BUILT_IN_PRESETS: CaptionPreset[] = [
  { name: "TikTok", fontFamily: "Impact", fontSize: 32, fontWeight: "900", color: "#FFFF00", strokeColor: "#000000", strokeWidth: 3, bgBox: false, shadow: true, opacity: 1.0, animation: "Word-by-word", position: "Bottom Center" },
  { name: "Instagram Reels", fontFamily: "Inter", fontSize: 28, fontWeight: "700", color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 2, bgBox: false, shadow: true, opacity: 1.0, animation: "Slide Up", position: "Bottom Center" },
  { name: "YouTube Shorts", fontFamily: "Roboto", fontSize: 28, fontWeight: "700", color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 2, bgBox: true, shadow: false, opacity: 0.9, animation: "Fade", position: "Bottom Center" },
  { name: "Corporate", fontFamily: "Inter", fontSize: 24, fontWeight: "400", color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 0, bgBox: true, shadow: false, opacity: 0.85, animation: "Fade", position: "Bottom Center" },
  { name: "Netflix", fontFamily: "Arial", fontSize: 26, fontWeight: "700", color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 1, bgBox: false, shadow: true, opacity: 1.0, animation: "None", position: "Bottom Center" },
  { name: "Cinematic", fontFamily: "Times New Roman", fontSize: 24, fontWeight: "400", color: "#F5F0DC", strokeColor: "#000000", strokeWidth: 0, bgBox: false, shadow: false, opacity: 0.95, animation: "Fade", position: "Middle Center" },
  { name: "Gaming", fontFamily: "Impact", fontSize: 30, fontWeight: "900", color: "#00FF00", strokeColor: "#000000", strokeWidth: 3, bgBox: false, shadow: true, opacity: 1.0, animation: "Pop", position: "Top Center" },
  { name: "Minimal", fontFamily: "Inter", fontSize: 20, fontWeight: "300", color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 0, bgBox: false, shadow: false, opacity: 0.8, animation: "Fade", position: "Bottom Center" },
];

const PRESET_EMOJI: Record<string, string> = {
  "TikTok": "🎵", "Instagram Reels": "📸", "YouTube Shorts": "▶️",
  "Corporate": "💼", "Netflix": "🎬", "Cinematic": "🎞️", "Gaming": "🎮", "Minimal": "✨"
};

const DEFAULT_MUSIC: MusicConfig = {
  mood: "Corporate",
  genre: "Corporate",
  duration: "30s",
  volume: 20,
  loop: true,
};

const INITIAL_SCENES: StoryboardScene[] = [
  {
    id: "scene-1",
    title: "Intro Hook",
    duration: 5,
    visualDescription: "Bright glowing logo animations sliding in from the center",
    cameraAngle: "Zoom In",
    animation: "Slide",
    transition: "Dissolve",
    imageUrl: "bg-gradient-to-tr from-purple-800 to-pink-700",
    captionText: "Are you ready to transform your B2B sales operations today?",
  },
  {
    id: "scene-2",
    title: "Problem Statement",
    duration: 10,
    visualDescription: "Frustrated team members looking at unoptimized dashboard logs",
    cameraAngle: "Wide Angle",
    animation: "Fade",
    transition: "Wipe",
    imageUrl: "bg-gradient-to-tr from-slate-800 to-indigo-950",
    captionText: "Legacy dashboards are slow, complex, and block your workflow.",
  },
  {
    id: "scene-3",
    title: "Solution Details",
    duration: 10,
    visualDescription: "AI Video compiler compiling dashboard reports automatically",
    cameraAngle: "Close-up",
    animation: "Pan Right",
    transition: "Zoom",
    imageUrl: "bg-gradient-to-tr from-purple-950 to-purple-900",
    captionText: "Introducing Saadhyam AI — the dynamic dashboard assistant.",
  },
  {
    id: "scene-4",
    title: "Call to Action",
    duration: 5,
    visualDescription: "Sleek card prompting users to install the plugin today",
    cameraAngle: "Medium Shot",
    animation: "Pop-in",
    transition: "None",
    imageUrl: "bg-gradient-to-tr from-pink-850 to-purple-950",
    captionText: "Visit our site to try Saadhyam AI today. Click Learn More!",
  },
];

const normalizeImageUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/") || url.startsWith("output/") || url.includes(".") || url.includes("/")) {
    const base = "http://localhost:8000";
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${base}${path}`;
  }
  return url;
};

function AIVideoGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // States
  const [brand, setBrand] = useState<BrandSetup>(DEFAULT_BRAND);
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_CONFIG);
  const [script, setScript] = useState<GeneratedScript>(DEFAULT_SCRIPT);
  const [scenes, setScenes] = useState<StoryboardScene[]>(INITIAL_SCENES);
  const [voice, setVoice] = useState<VoiceConfig>(DEFAULT_VOICE);
  const [captions, setCaptions] = useState<CaptionConfig>(DEFAULT_CAPTIONS);
  const [musicTrack, setMusicTrack] = useState<string>("Corporate Tech");

  // Script inputs
  const [scriptProduct, setScriptProduct] = useState("");
  const [scriptOffer, setScriptOffer] = useState("");
  const [scriptKeywords, setScriptKeywords] = useState("");

  // Playback & Renders states
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [history, setHistory] = useState<SavedProject[]>([]);
  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [isScriptGenerating, setIsScriptGenerating] = useState(false);
  const [isImagesGenerating, setIsImagesGenerating] = useState(false);
  const [generatingSceneIdx, setGeneratingSceneIdx] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [renderedVideo, setRenderedVideo] = useState<RenderedVideoDetails | null>(null);
  const [renderStatusText, setRenderStatusText] = useState<string>("");
  const [music, setMusic] = useState<MusicConfig>(DEFAULT_MUSIC);
  const [isMusicGenerating, setIsMusicGenerating] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"voice" | "music" | "mixed">("mixed");

  // v3.6 – Subtitle state
  const [subtitleState, setSubtitleState] = useState<SubtitleState>(DEFAULT_SUBTITLE_STATE);
  const [extCaptions, setExtCaptions] = useState<ExtendedCaptionConfig>(DEFAULT_EXTENDED_CAPTIONS);
  const [isSubtitleGenerating, setIsSubtitleGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [subtitleSearch, setSubtitleSearch] = useState("");
  const [activeTranslationLang, setActiveTranslationLang] = useState<string>("en");
  const [selectedPresetName, setSelectedPresetName] = useState<string>("Instagram Reels");
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const subtitleFileRef = useRef<HTMLInputElement>(null);

  // v3.7 – Timeline Editor state
  const [timelineZoom, setTimelineZoom] = useState<number>(100);
  const [safeAreaType, setSafeAreaType] = useState<string>("TikTok");
  const [selectedBlock, setSelectedBlock] = useState<{ track: string; id: string } | null>(null);
  const [timelineTracks, setTimelineTracks] = useState<any>(null);
  const [overlaysList, setOverlaysList] = useState<any[]>([]);
  const [animationConfigs, setAnimationConfigs] = useState<Record<string, any>>({});
  const [clipboard, setClipboard] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [activePreviewAnimation, setActivePreviewAnimation] = useState<string>("");
  const [selectedTransition, setSelectedTransition] = useState<string>("CrossFade");


  // Refs for timers
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const savedBrand = localStorage.getItem("saadhyam_video_brand");
      if (savedBrand) setBrand(JSON.parse(savedBrand));

      const savedConfig = localStorage.getItem("saadhyam_video_config");
      if (savedConfig) setConfig(JSON.parse(savedConfig));

      const savedScript = localStorage.getItem("saadhyam_video_script");
      if (savedScript) setScript(JSON.parse(savedScript));

      const savedStoryboard = localStorage.getItem("saadhyam_video_storyboard");
      if (savedStoryboard) {
        const parsed: StoryboardScene[] = JSON.parse(savedStoryboard);
        const normalized = parsed.map(s => ({
          ...s,
          imageUrl: normalizeImageUrl(s.imageUrl)
        }));
        setScenes(normalized);
      }

      const savedVoice = localStorage.getItem("saadhyam_video_voice");
      if (savedVoice) setVoice(JSON.parse(savedVoice));

      const savedCaptions = localStorage.getItem("saadhyam_video_captions");
      if (savedCaptions) setCaptions(JSON.parse(savedCaptions));

      const savedHistory = localStorage.getItem("saadhyam_video_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedMusic = localStorage.getItem("saadhyam_video_music");
      if (savedMusic) setMusic(JSON.parse(savedMusic));

      const savedMixedAudio = localStorage.getItem("saadhyam_video_mixed_audio");
      if (savedMixedAudio) setMixedAudioUrl(savedMixedAudio);

      const savedSubtitles = localStorage.getItem("saadhyam_video_subtitles");
      if (savedSubtitles) setSubtitleState(JSON.parse(savedSubtitles));

      const savedExtCaptions = localStorage.getItem("saadhyam_video_ext_captions");
      if (savedExtCaptions) setExtCaptions(JSON.parse(savedExtCaptions));

      const savedTimeline = localStorage.getItem("saadhyam_video_timeline");
      if (savedTimeline) {
        const parsed = JSON.parse(savedTimeline);
        if (parsed?.tracks?.scenes) {
          parsed.tracks.scenes = parsed.tracks.scenes.map((s: any) => ({
            ...s,
            imageUrl: normalizeImageUrl(s.imageUrl)
          }));
        }
        setTimelineTracks(parsed);
      }

      const savedOverlays = localStorage.getItem("saadhyam_video_overlays");
      if (savedOverlays) setOverlaysList(JSON.parse(savedOverlays));

      const savedAnimations = localStorage.getItem("saadhyam_video_animations");
      if (savedAnimations) setAnimationConfigs(JSON.parse(savedAnimations));

      const savedProject = localStorage.getItem("saadhyam_video_project");
      if (savedProject) {
        const parsed = JSON.parse(savedProject);
        if (parsed.renderedVideo) setRenderedVideo(parsed.renderedVideo);
        if (parsed.music) setMusic(parsed.music);
        if (parsed.mixedAudioUrl) setMixedAudioUrl(parsed.mixedAudioUrl);
      }
    } catch (e) {
      console.error("Local storage restoration failed", e);
    }
  }, []);

  // Save updates helpers
  const updateBrand = (key: keyof BrandSetup, val: string) => {
    setBrand((prev) => ({ ...prev, [key]: val }));
  };

  const updateConfigVal = (key: keyof VideoConfig, val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const saveBrandSetup = () => {
    if (!brand.businessName.trim()) {
      toast.error("Please enter a Business Name.");
      return;
    }
    localStorage.setItem("saadhyam_video_brand", JSON.stringify(brand));
    toast.success("Brand styling configured!");
    setCurrentStep(3);
  };

  const saveVideoConfig = () => {
    localStorage.setItem("saadhyam_video_config", JSON.stringify(config));
    toast.success("Video layout parameters configured!");
    setCurrentStep(4);
  };

  // Step 4 Script AI generator integration
  const handleGenerateScript = async () => {
    if (!scriptProduct.trim()) {
      toast.error("Please enter your Product or Service name.");
      return;
    }

    setIsScriptGenerating(true);
    try {
      const payload = {
        product: scriptProduct,
        industry: brand.industry || "Technology",
        targetAudience: config.targetAudience || "Young Entrepreneurs, Tech Enthusiasts",
        platform: config.platform || "Instagram",
        duration: config.duration || "30s",
        tone: brand.brandTone || "Professional",
        goal: scriptOffer || "Brand Awareness",
        callToAction: config.cta || "Learn More"
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/generate-script", 
        payload
      );

      if (response && response.success && response.data) {
        const responseData = response.data;
        const generated: GeneratedScript = {
          title: responseData.title || `Introducing ${scriptProduct}`,
          hook: responseData.hook || "",
          narration: responseData.description || "",
          cta: responseData.cta || "",
        };

        setScript(generated);
        localStorage.setItem("saadhyam_video_script", JSON.stringify(generated));

        // Map backend scenes to frontend StoryboardScene schema
        let mappedScenes: StoryboardScene[] = [];
        if (responseData.scenes && Array.isArray(responseData.scenes)) {
          mappedScenes = responseData.scenes.map((s: any) => ({
            id: `scene-${s.scene}`,
            title: s.title || `Scene ${s.scene}`,
            duration: Number(s.duration) || 5,
            visualDescription: s.visual || "A clean marketing visual.",
            cameraAngle: "Medium Shot",
            animation: "None",
            transition: "None",
            captionText: s.voiceover || "",
            imageUrl: "bg-gradient-to-tr from-purple-800 to-pink-700", 
          }));
          setScenes(mappedScenes);
          localStorage.setItem("saadhyam_video_storyboard", JSON.stringify(mappedScenes));
        }

        // Save project object
        const projectObj = {
          id: `project-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          brand,
          config,
          script: generated,
          scenes: mappedScenes,
          voice,
          captions,
          musicTrack,
        };
        localStorage.setItem("saadhyam_video_project", JSON.stringify(projectObj));

        // Update and save history
        const updatedHistory = [projectObj, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("saadhyam_video_history", JSON.stringify(updatedHistory));

        toast.success(response.message || "AI generated ad copy scripts successfully!");
      } else {
        throw new Error(response?.message || "Failed to generate script");
      }
    } catch (err: any) {
      console.error("AI Script generation failed:", err);
      toast.error(err.message || "Script generation failed.");
    } finally {
      setIsScriptGenerating(false);
    }
  };


  // Step 5 Storyboard Scenes modifiers
  const handleUpdateScene = (idx: number, key: keyof StoryboardScene, val: any) => {
    const updated = [...scenes];
    updated[idx] = { ...updated[idx], [key]: val };
    setScenes(updated);
  };

  const handleAddScene = () => {
    const newScene: StoryboardScene = {
      id: `scene-${Date.now()}`,
      title: `Scene ${scenes.length + 1}`,
      duration: 5,
      visualDescription: "Empty placeholder storyboard context details",
      cameraAngle: "Medium Shot",
      animation: "None",
      transition: "None",
      imageUrl: "bg-gradient-to-tr from-slate-900 to-slate-800",
      captionText: "Add captions subtitles here",
    };
    const updated = [...scenes, newScene];
    setScenes(updated);
    localStorage.setItem("saadhyam_video_storyboard", JSON.stringify(updated));
    toast.success("New storyboard scene added!");
  };

  const handleRemoveScene = (idx: number) => {
    if (scenes.length <= 1) {
      toast.warning("Your storyboard must contain at least one active scene.");
      return;
    }
    const updated = scenes.filter((_, i) => i !== idx);
    setScenes(updated);
    localStorage.setItem("saadhyam_video_storyboard", JSON.stringify(updated));
    toast.info("Scene removed.");
  };

  // Save updates helper for Step 6 Images
  const handleSaveStatesAfterImages = (updatedScenes: StoryboardScene[]) => {
    setScenes(updatedScenes);
    localStorage.setItem("saadhyam_video_storyboard", JSON.stringify(updatedScenes));
    
    const imageUrls = updatedScenes.map(s => s.imageUrl).filter(Boolean) as string[];
    localStorage.setItem("saadhyam_video_images", JSON.stringify(imageUrls));

    const projectObj = {
      id: `project-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      brand,
      config,
      script,
      scenes: updatedScenes,
      voice,
      captions,
      musicTrack,
    };
    localStorage.setItem("saadhyam_video_project", JSON.stringify(projectObj));

    const updatedHistory = [projectObj, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("saadhyam_video_history", JSON.stringify(updatedHistory));
  };

  const handleGenerateAllImages = async () => {
    setIsImagesGenerating(true);
    try {
      const payload = {
        projectTitle: script.title || "Video Ad Project",
        brand: brand.businessName || "Standard Brand",
        style: brand.brandTone || "Professional",
        aspectRatio: config.aspectRatio || "16:9",
        scenes: scenes.map((s, idx) => ({
          scene: idx + 1,
          title: s.title,
          visual: s.visualDescription,
          voiceover: s.captionText,
          duration: s.duration
        }))
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/generate-images",
        payload
      );

      if (response && response.success && Array.isArray(response.data)) {
        const updatedScenes = scenes.map((s, idx) => {
          const generated = response.data.find((item: any) => item.scene === idx + 1);
          return {
            ...s,
            imageUrl: generated?.imageUrl ? normalizeImageUrl(generated.imageUrl) : s.imageUrl
          };
        });
        handleSaveStatesAfterImages(updatedScenes);
        toast.success(response.message || "AI Storyboard images generated successfully!");
      } else {
        throw new Error(response?.message || "Failed to generate images");
      }
    } catch (err: any) {
      console.error("AI Image generation failed:", err);
      toast.error(err.message || "Image generation failed.");
    } finally {
      setIsImagesGenerating(false);
    }
  };

  // Step 6 AI Image Regenerator Action
  const handleRegenerateImage = async (idx: number) => {
    setGeneratingSceneIdx(idx);
    try {
      const payload = {
        projectTitle: script.title || "Video Ad Project",
        brand: brand.businessName || "Standard Brand",
        style: brand.brandTone || "Professional",
        aspectRatio: config.aspectRatio || "16:9",
        scenes: [
          {
            scene: idx + 1,
            title: scenes[idx].title,
            visual: scenes[idx].visualDescription,
            voiceover: scenes[idx].captionText,
            duration: scenes[idx].duration
          }
        ]
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/generate-images",
        payload
      );

      if (response && response.success && Array.isArray(response.data) && response.data[0]) {
        const updatedScenes = [...scenes];
        updatedScenes[idx] = {
          ...updatedScenes[idx],
          imageUrl: normalizeImageUrl(response.data[0].imageUrl)
        };
        handleSaveStatesAfterImages(updatedScenes);
        toast.success("AI Image regenerated successfully!");
      } else {
        throw new Error(response?.message || "Failed to regenerate image");
      }
    } catch (err: any) {
      console.error("AI Image regeneration failed:", err);
      toast.error(err.message || "Regeneration failed.");
    } finally {
      setGeneratingSceneIdx(null);
    }
  };

  const handleUploadCustomImage = async (idx: number, file: File) => {
    if (!file) return;
    setGeneratingSceneIdx(idx);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/upload-image",
        formData
      );

      if (response && response.success && response.imageUrl) {
        const updatedScenes = [...scenes];
        updatedScenes[idx] = {
          ...updatedScenes[idx],
          imageUrl: normalizeImageUrl(response.imageUrl)
        };
        handleSaveStatesAfterImages(updatedScenes);
        toast.success("Custom image uploaded successfully!");
      } else {
        throw new Error(response?.message || "Failed to upload image");
      }
    } catch (err: any) {
      console.error("Custom image upload failed:", err);
      toast.error(err.message || "Upload failed.");
    } finally {
      setGeneratingSceneIdx(null);
    }
  };

  const handleReplaceImage = (idx: number) => {
    const url = prompt("Paste direct image URL (starting with http/https or relative path):");
    if (url === null) return;
    if (!url.trim()) {
      toast.error("Invalid URL entered.");
      return;
    }
    const updatedScenes = [...scenes];
    updatedScenes[idx] = {
      ...updatedScenes[idx],
      imageUrl: normalizeImageUrl(url.trim())
    };
    handleSaveStatesAfterImages(updatedScenes);
    toast.success("Image URL updated!");
  };


  // Step 7 Audio Voice synthesizer action
  const handleGenerateVoiceover = async () => {
    setIsVoiceGenerating(true);
    try {
      const numericSpeed = parseFloat(voice.speed) || 1.0;
      
      const payload = {
        narration: script.narration || scenes.map(s => s.captionText).join(" ") || "No narration provided",
        voice: voice.gender === "Male" ? "onyx" : "shimmer",
        gender: voice.gender || "Female",
        language: config.language || "English",
        speed: numericSpeed,
        style: brand.brandTone || "Professional",
        emotion: "professional"
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/generate-voice",
        payload
      );

      if (response && response.audioUrl) {
        const updatedVoice = {
          ...voice,
          audioUrl: response.audioUrl,
          duration: response.duration,
          provider: response.provider,
          model: response.model,
          generationTime: response.generationTime,
          status: response.fallback ? "Fallback Active" : "Active"
        };
        
        setVoice(updatedVoice);
        localStorage.setItem("saadhyam_video_voice", JSON.stringify(updatedVoice));

        // Save project state
        const projectObj = {
          id: `project-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          brand,
          config,
          script,
          scenes,
          voice: updatedVoice,
          captions,
          musicTrack,
        };
        localStorage.setItem("saadhyam_video_project", JSON.stringify(projectObj));

        // Save to history
        const updatedHistory = [projectObj, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("saadhyam_video_history", JSON.stringify(updatedHistory));

        if (response.fallback) {
          toast.warning("AI provider unavailable. Using local voice generation.");
        } else {
          toast.success("AI voice narration synthesized successfully!");
        }
      } else {
        throw new Error(response?.message || "Invalid response format from TTS API");
      }
    } catch (err: any) {
      console.error("AI voice generation failed:", err);
      toast.error(err.message || "AI Voice synthesis failed.");
    } finally {
      setIsVoiceGenerating(false);
    }
  };

  // Video synthesis rendering engine action
  const handleRenderVideo = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatusText("Preparing Assets");

    // Progress bar simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 2;
      if (progress >= 98) {
        progress = 98;
        clearInterval(interval);
      }
      setRenderProgress(progress);

      // Status text updates
      if (progress < 15) {
        setRenderStatusText("Preparing Assets");
      } else if (progress < 35) {
        setRenderStatusText("Creating Timeline");
      } else if (progress < 55) {
        setRenderStatusText("Applying Transitions");
      } else if (progress < 75) {
        setRenderStatusText("Mixing Audio");
      } else if (progress < 90) {
        setRenderStatusText("Encoding Video");
      } else if (progress < 98) {
        setRenderStatusText("Generating Thumbnail");
      }
    }, 400);

    try {
      const payload = {
        projectTitle: script.title || "Video Ad",
        scenes: scenes,
        images: scenes.map((s) => s.imageUrl).filter(Boolean),
        voiceAudio: voice.audioUrl || "",
        captions: captions,
        aspectRatio: config.aspectRatio || "16:9",
        fps: 30,
        transitions: scenes.map((s) => s.transition || "None"),
        backgroundMusic: music.musicUrl || musicTrack || "",
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/render-video",
        payload
      );

      clearInterval(interval);

      if (response) {
        setRenderProgress(100);
        setRenderStatusText("Completed");

        const resultDetails: RenderedVideoDetails = {
          videoUrl: response.videoUrl,
          thumbnailUrl: response.thumbnailUrl,
          previewGif: response.previewGif,
          duration: response.duration,
          resolution: response.resolution,
          fps: response.fps || 30,
          renderTime: response.renderTime,
          status: response.status,
          outputSize: response.outputSize,
          message: response.message
        };

        setRenderedVideo(resultDetails);

        // Update local storage states
        const updatedProject = {
          id: `project-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          brand,
          config,
          script,
          scenes,
          voice,
          captions,
          musicTrack,
          renderedVideo: resultDetails,
          music,
          mixedAudioUrl
        };

        localStorage.setItem("saadhyam_video_project", JSON.stringify(updatedProject));

        const updatedHistory = [updatedProject, ...history.filter(h => h.id !== updatedProject.id)];
        setHistory(updatedHistory);
        localStorage.setItem("saadhyam_video_history", JSON.stringify(updatedHistory));

        if (response.status === "fallback") {
          toast.warning("Video rendering engine unavailable on server. Narration, images, and storyboard assets are ready.");
        } else {
          toast.success("Video rendered successfully!");
        }
      } else {
        throw new Error("Invalid response from video rendering service.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error("Video rendering failed:", err);
      toast.error(err.message || "Video rendering failed.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleGenerateMusic = async () => {
    setIsMusicGenerating(true);
    try {
      const payload = {
        mood: music.mood,
        genre: music.genre,
        duration: parseInt(music.duration) || 30,
        platform: config.platform || "Instagram",
        projectTitle: script.title || "Video Ad"
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/generate-music",
        payload
      );

      if (response && response.musicUrl) {
        const updatedMusic = {
          ...music,
          musicUrl: response.musicUrl,
          provider: response.provider || "Local Pad Synth",
          model: response.model || "PadSynth-v1",
          status: "Synthesized",
        };

        setMusic(updatedMusic);
        localStorage.setItem("saadhyam_video_music", JSON.stringify(updatedMusic));
        toast.success("AI Background Music generated successfully!");

        if (voice.audioUrl) {
          await handleMixAudio(voice.audioUrl, response.musicUrl, music.volume, music.loop);
        }
      } else {
        throw new Error(response?.message || "Invalid response format from Music API");
      }
    } catch (err: any) {
      console.error("AI music generation failed:", err);
      toast.error(err.message || "AI Music synthesis failed.");
    } finally {
      setIsMusicGenerating(false);
    }
  };

  const handleMixAudio = async (voicePath: string, musicPath: string, vol: number, loopOption: boolean) => {
    setIsMixing(true);
    try {
      const payload = {
        voiceAudio: voicePath,
        musicAudio: musicPath,
        volume: vol / 100.0,
        loop: loopOption
      };

      const response = await apiClient.post<any>(
        "/api/plugins/marketing_ai_video_generator/mix-audio",
        payload
      );

      if (response && response.mixedAudioUrl) {
        setMixedAudioUrl(response.mixedAudioUrl);
        localStorage.setItem("saadhyam_video_mixed_audio", response.mixedAudioUrl);

        const updatedProject = {
          id: `project-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          brand,
          config,
          script,
          scenes,
          voice,
          captions,
          musicTrack,
          music: {
            ...music,
            musicUrl: musicPath
          },
          mixedAudioUrl: response.mixedAudioUrl,
          renderedVideo
        };
        localStorage.setItem("saadhyam_video_project", JSON.stringify(updatedProject));
        
        toast.success("Narration and background tracks mixed successfully!");
      }
    } catch (err: any) {
      console.error("Audio mixing failed:", err);
      toast.error("Audio track mixing failed.");
    } finally {
      setIsMixing(false);
    }
  };

  const handleUploadCustomMusic = async (file: File) => {
    setIsMusicGenerating(true);
    try {
      const localUrl = URL.createObjectURL(file);
      const updatedMusic = {
        ...music,
        musicUrl: localUrl,
        provider: "Custom Upload",
        model: file.name,
        status: "Uploaded",
      };
      setMusic(updatedMusic);
      localStorage.setItem("saadhyam_video_music", JSON.stringify(updatedMusic));
      toast.success("Custom background audio track uploaded successfully!");
      
      if (voice.audioUrl) {
        await handleMixAudio(voice.audioUrl, localUrl, music.volume, music.loop);
      }
    } catch (err: any) {
      console.error("Custom audio upload failed:", err);
      toast.error("Audio track upload failed.");
    } finally {
      setIsMusicGenerating(false);
    }
  };

  const handleRemoveMusic = () => {
    const updatedMusic = {
      ...music,
      musicUrl: undefined,
      provider: undefined,
      model: undefined,
      status: undefined,
    };
    setMusic(updatedMusic);
    setMixedAudioUrl("");
    localStorage.removeItem("saadhyam_video_music");
    localStorage.removeItem("saadhyam_video_mixed_audio");
    toast.success("Background audio track removed.");
  };

  // Audio Playback simulation loops
  const startPlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    let currentIdx = activeSceneIdx;

    const playNextScene = () => {
      const activeScene = scenes[currentIdx];
      if (!activeScene) {
        stopPlayback();
        return;
      }

      setActiveSceneIdx(currentIdx);

      // Schedule next scene transition based on current scene duration
      playbackTimer.current = setTimeout(() => {
        if (currentIdx < scenes.length - 1) {
          currentIdx += 1;
          playNextScene();
        } else {
          stopPlayback();
        }
      }, activeScene.duration * 1000);
    };

    playNextScene();
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
    }
  };

  // Step 10 Project History log
  const handleSaveProject = () => {
    try {
      const project: SavedProject = {
        id: `project-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        brand,
        config,
        script,
        scenes,
        voice,
        captions,
        musicTrack,
      };
      const updatedHistory = [project, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("saadhyam_video_history", JSON.stringify(updatedHistory));
      toast.success("AI Video Project saved to history logs!");
    } catch (e) {
      toast.error("Failed to save project.");
    }
  };

  // Export functions
  const handleCopyScriptText = () => {
    const text = `Title: ${script.title}\nHook: ${script.hook}\nNarration: ${script.narration}\nCTA: ${script.cta}`;
    navigator.clipboard.writeText(text);
    toast.success("Script copied to clipboard!");
  };

  const handleDownloadTxt = () => {
    let content = `AI VIDEO GENERATOR PROJECT EXPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `=================================\n\n`;
    content += `SCRIPT DRAFT:\n`;
    content += `Title: ${script.title}\n`;
    content += `Hook: ${script.hook}\n`;
    content += `Narration: ${script.narration}\n`;
    content += `CTA: ${script.cta}\n\n`;
    content += `STORYBOARD TIMELINE:\n`;
    scenes.forEach((s, i) => {
      content += `Scene ${i + 1}: ${s.title} (${s.duration}s)\n`;
      content += `Visuals: ${s.visualDescription}\n`;
      content += `Angle: ${s.cameraAngle} | Animation: ${s.animation}\n`;
      content += `Subtitles: ${s.captionText}\n\n`;
    });

    const file = new Blob([content], { type: "text/plain" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `video-project-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("TXT exported!");
  };

  const handleDownloadCsv = () => {
    let csv = `Scene,Duration,Title,Visual Description,Camera Angle,Animation,Transition,Subtitle\n`;
    scenes.forEach((s, idx) => {
      csv += `"${idx + 1}","${s.duration}","${s.title}","${s.visualDescription}","${s.cameraAngle}","${s.animation}","${s.transition}","${s.captionText}"\n`;
    });

    const file = new Blob([csv], { type: "text/csv" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `storyboard-${Date.now()}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("CSV exported!");
  };

  return (
    <div className="dark bg-slate-950 text-slate-100 min-h-[calc(100vh-64px)] py-8 px-4 md:px-8 space-y-6 flex flex-col">
      {/* Header wrapper */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/plugins"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                AI Video Generator
              </h1>
              <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/50 font-semibold animate-pulse-slow">
                Interactive Wizard
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Create marketing and promotional video campaigns with AI script outlines and voice renders.
            </p>
          </div>
        </div>
      </div>

      {/* 10-Step Progress Grid */}
      <div className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shrink-0">
        <div className="flex items-center justify-between mb-3 text-xs md:text-sm">
          <span className="font-semibold text-purple-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping"></span>
            Step {currentStep} of 10: {
              currentStep === 1 ? "Welcome" :
                currentStep === 2 ? "Brand Styling" :
                  currentStep === 3 ? "Video Config" :
                    currentStep === 4 ? "Script Generator" :
                      currentStep === 5 ? "Storyboard Editor" :
                        currentStep === 6 ? "Image Generator" :
                          currentStep === 7 ? "Voice Synthesis" :
                            currentStep === 8 ? "Subtitles Captions" :
                              currentStep === 9 ? "Timeline Preview" :
                                "Exports Engine"
            }
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {Math.round((currentStep / 10) * 100)}% Complete
          </span>
        </div>

        {/* 10 Node Timeline */}
        <div className="relative flex items-center justify-between mt-2 max-w-3xl mx-auto">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 9) * 100}%` }}
          ></div>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;

            return (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold z-10 transition-all ${
                  isCompleted
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg"
                    : isActive
                      ? "bg-slate-950 border-pink-500 text-pink-400 scale-110 shadow-lg"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main wizard body */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        
        {/* STEP 1: WELCOME SCREEN */}
        {currentStep === 1 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900/40 text-purple-400 border border-purple-800/40 mb-3 text-3xl">
                🎥
              </div>
              <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-450 bg-clip-text text-transparent">
                AI Video Creator Hub
              </CardTitle>
              <CardDescription className="text-slate-400 text-base max-w-md mx-auto mt-1">
                Draft video outlines, generate automated narration copies, build scene storyboard timelines, and configure aspect ratios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Brand Identity Config", desc: "Integrate palette hex codes and font types to align styling." },
                  { title: "Multi-Platform Ratios", desc: "Shorts, Reels, Explainer video configurations." },
                  { title: "AI Audio Voice synthesis", desc: "Configure accents and voice parameters to preview timeline sound." },
                  { title: "CSV Storyboard Export", desc: "Export formatted storyboard layers directly to spreadsheet files." },
                ].map((cap, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{cap.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 rounded-xl flex items-center gap-2"
                >
                  Configure Brand Details <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: BRAND SETUP */}
        {currentStep === 2 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">🏢 Brand Styling Configuration</CardTitle>
              <CardDescription className="text-slate-400">Save brand hex parameters and logo textures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={brand.businessName}
                    onChange={(e) => updateBrand("businessName", e.target.value)}
                    placeholder="Acme Co"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    value={brand.website}
                    onChange={(e) => updateBrand("website", e.target.value)}
                    placeholder="https://acme.com"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={brand.industry} onValueChange={(val) => updateBrand("industry", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Technology">Technology & SaaS</SelectItem>
                      <SelectItem value="Finance">Finance & Investing</SelectItem>
                      <SelectItem value="Education">Education & Courses</SelectItem>
                      <SelectItem value="Healthcare">Healthcare & Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="logoText">Logo Label text</Label>
                  <Input
                    id="logoText"
                    value={brand.logoText}
                    onChange={(e) => updateBrand("logoText", e.target.value)}
                    placeholder="ACME"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Primary Hex Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brand.primaryColor}
                      onChange={(e) => updateBrand("primaryColor", e.target.value)}
                      className="w-12 h-10 p-0 bg-slate-950 border-slate-800"
                    />
                    <Input
                      value={brand.primaryColor}
                      onChange={(e) => updateBrand("primaryColor", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary Hex Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brand.secondaryColor}
                      onChange={(e) => updateBrand("secondaryColor", e.target.value)}
                      className="w-12 h-10 p-0 bg-slate-950 border-slate-800"
                    />
                    <Input
                      value={brand.secondaryColor}
                      onChange={(e) => updateBrand("secondaryColor", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Preferred Font Family</Label>
                  <Select value={brand.fontStyle} onValueChange={(val) => updateBrand("fontStyle", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Inter">Inter (Sans-Serif)</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Outfit">Outfit</SelectItem>
                      <SelectItem value="Playfair">Playfair Display (Serif)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Brand Tone</Label>
                  <Select value={brand.brandTone} onValueChange={(val) => updateBrand("brandTone", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly / Conversational</SelectItem>
                      <SelectItem value="Bold">Bold / Assertive</SelectItem>
                      <SelectItem value="Luxury">Luxury / Sophisticated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button onClick={saveBrandSetup} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: VIDEO CONFIGURATION */}
        {currentStep === 3 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>Video Configurations</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Specify platform destination aspect bounds and parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Target Social Platform</Label>
                  <Select value={config.platform} onValueChange={(val) => updateConfigVal("platform", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Instagram">Instagram (Reels/Stories)</SelectItem>
                      <SelectItem value="YouTube">YouTube Shorts / Videos</SelectItem>
                      <SelectItem value="TikTok">TikTok Feed</SelectItem>
                      <SelectItem value="Facebook">Facebook Video</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn Promo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Video Content Category</Label>
                  <Select value={config.videoType} onValueChange={(val) => updateConfigVal("videoType", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Reels/Shorts">Reels / Shorts Promo</SelectItem>
                      <SelectItem value="Video Ad">Social Media Video Ad</SelectItem>
                      <SelectItem value="Explainer">Explainer Video</SelectItem>
                      <SelectItem value="Product Demo">Product Demo Walkthrough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Duration (seconds)</Label>
                  <Select value={config.duration} onValueChange={(val) => updateConfigVal("duration", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="15s">15 seconds</SelectItem>
                      <SelectItem value="30s">30 seconds</SelectItem>
                      <SelectItem value="60s">60 seconds</SelectItem>
                      <SelectItem value="90s">90 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Aspect Ratio</Label>
                  <Select value={config.aspectRatio} onValueChange={(val) => updateConfigVal("aspectRatio", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="9:16 Vertical">9:16 Vertical (Mobile)</SelectItem>
                      <SelectItem value="16:9 Horizontal">16:9 Horizontal (Landscape)</SelectItem>
                      <SelectItem value="1:1 Square">1:1 Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Output Resolution</Label>
                  <Select value={config.resolution} onValueChange={(val) => updateConfigVal("resolution", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="1080p Full HD">1080p Full HD</SelectItem>
                      <SelectItem value="4K Ultra HD">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={config.targetAudience}
                    onChange={(e) => updateConfigVal("targetAudience", e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Call To Action</Label>
                  <Select value={config.cta} onValueChange={(val) => updateConfigVal("cta", val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Learn More">Learn More</SelectItem>
                      <SelectItem value="Sign Up">Sign Up Now</SelectItem>
                      <SelectItem value="Get Offer">Get Discount Offer</SelectItem>
                      <SelectItem value="Download">Download PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button onClick={saveVideoConfig} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: AI SCRIPT GENERATOR */}
        {currentStep === 4 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>AI Ad Script Generator</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Generate ad scripts including hooks and scene captions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="scriptProduct">Product or Service Name *</Label>
                  <Input
                    id="scriptProduct"
                    value={scriptProduct}
                    onChange={(e) => setScriptProduct(e.target.value)}
                    placeholder="e.g. Saadhyam AI Assistant"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scriptOffer">Promo Offer / Message</Label>
                  <Input
                    id="scriptOffer"
                    value={scriptOffer}
                    onChange={(e) => setScriptOffer(e.target.value)}
                    placeholder="e.g. 20% off for first 100 signups"
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scriptKeywords">Keywords (comma-separated)</Label>
                <Input
                  id="scriptKeywords"
                  value={scriptKeywords}
                  onChange={(e) => setScriptKeywords(e.target.value)}
                  placeholder="SaaS, automated sales, inbox helper"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-center py-2">
                <Button
                  onClick={handleGenerateScript}
                  disabled={isScriptGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-10 py-5 rounded-xl shadow-lg flex items-center gap-2"
                >
                  {isScriptGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Scripts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate AI Script Outline
                    </>
                  )}
                </Button>
              </div>

              {script.title !== "" && (
                <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Generated Output</span>
                    <Button size="icon" variant="ghost" onClick={handleCopyScriptText} className="text-slate-400 hover:text-white">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Video Title</Label>
                      <Input
                        value={script.title}
                        onChange={(e) => setScript((prev) => ({ ...prev, title: e.target.value }))}
                        className="bg-slate-900 border-slate-800 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Hook Sentence (0-5s)</Label>
                      <Textarea
                        value={script.hook}
                        onChange={(e) => setScript((prev) => ({ ...prev, hook: e.target.value }))}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Body Narration (5-25s)</Label>
                      <Textarea
                        value={script.narration}
                        onChange={(e) => setScript((prev) => ({ ...prev, narration: e.target.value }))}
                        className="bg-slate-900 border-slate-800 text-xs min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">CTA (25-30s)</Label>
                      <Input
                        value={script.cta}
                        onChange={(e) => setScript((prev) => ({ ...prev, cta: e.target.value }))}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        localStorage.setItem("saadhyam_video_script", JSON.stringify(script));
                        setCurrentStep(5);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                    >
                      Configure Storyboard
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: STORYBOARD BUILDER */}
        {currentStep === 5 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">🎬 Storyboard Scene Editor</CardTitle>
                <CardDescription className="text-slate-400">Rearrange visual instructions, timing markers, and camera motions.</CardDescription>
              </div>
              <Button onClick={handleAddScene} variant="outline" size="sm" className="border-slate-800 hover:bg-slate-850 text-slate-200">
                <Plus className="w-4 h-4 mr-1" /> Add Scene
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 max-h-[360px] overflow-y-auto pr-1">
                {scenes.map((scene, idx) => (
                  <div key={scene.id} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="bg-purple-950 border border-purple-900 text-purple-300 text-xs px-2.5 py-0.5 rounded font-mono font-bold">
                        Scene {idx + 1} ({scene.duration}s)
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveScene(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Scene Title</Label>
                        <Input
                          value={scene.title}
                          onChange={(e) => handleUpdateScene(idx, "title", e.target.value)}
                          className="bg-slate-900 border-slate-800 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Duration (sec)</Label>
                        <Input
                          type="number"
                          value={scene.duration}
                          onChange={(e) => handleUpdateScene(idx, "duration", Number(e.target.value))}
                          className="bg-slate-900 border-slate-800 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Camera Angle</Label>
                        <Select value={scene.cameraAngle} onValueChange={(val) => handleUpdateScene(idx, "cameraAngle", val)}>
                          <SelectTrigger className="bg-slate-900 border-slate-850 text-xs text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <SelectItem value="Wide Angle">Wide Angle</SelectItem>
                            <SelectItem value="Medium Shot">Medium Shot</SelectItem>
                            <SelectItem value="Close-up">Close-up</SelectItem>
                            <SelectItem value="Zoom In">Zoom In</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Visual Action Description</Label>
                      <Input
                        value={scene.visualDescription}
                        onChange={(e) => handleUpdateScene(idx, "visualDescription", e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(4)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem("saadhyam_video_storyboard", JSON.stringify(scenes));
                    setCurrentStep(6);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                >
                  Configure Visuals
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: AI IMAGE GENERATOR */}
        {currentStep === 6 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <span>AI Storyboard Image Generator</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Generate storyboard visual slides or drop layout assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Batch generator action header */}
              <div className="flex justify-between items-center bg-slate-950/45 p-4 rounded-xl border border-slate-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200">Batch Generate Storyboard</h4>
                  <p className="text-[10px] text-slate-500">Generate visual slides for all scenes in one click.</p>
                </div>
                <Button
                  onClick={handleGenerateAllImages}
                  disabled={isImagesGenerating || generatingSceneIdx !== null}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold h-9 rounded-lg"
                >
                  {isImagesGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Generate All Images
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 max-h-[360px] overflow-y-auto pr-1">
                {scenes.map((scene, idx) => {
                  const isRealImageUrl = scene.imageUrl && (scene.imageUrl.startsWith("http") || scene.imageUrl.startsWith("/"));
                  
                  return (
                    <div key={scene.id} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-400">Scene {idx + 1} Visual</span>
                        <span className="text-[10px] text-slate-500 font-mono">{scene.cameraAngle}</span>
                      </div>

                      {/* Image Preview Block */}
                      <div className={`w-full h-32 rounded-lg flex flex-col items-center justify-center relative border border-slate-800 overflow-hidden ${!isRealImageUrl ? (scene.imageUrl || 'bg-slate-900') : ''}`}>
                        {isRealImageUrl ? (
                          <img src={scene.imageUrl} alt={scene.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : null}
                        
                        {(!isRealImageUrl || generatingSceneIdx === idx) && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                            {generatingSceneIdx === idx ? (
                              <>
                                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-1" />
                                <p className="text-[10px] text-purple-300 font-bold">Regenerating...</p>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-6 h-6 text-purple-300 mb-1" />
                                <p className="text-[11px] font-semibold text-slate-200 truncate max-w-xs">{scene.title}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{scene.visualDescription}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isImagesGenerating || generatingSceneIdx !== null}
                          onClick={() => handleRegenerateImage(idx)}
                          className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[10px] h-8 flex items-center gap-1.5 text-slate-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isImagesGenerating || generatingSceneIdx !== null}
                          onClick={() => handleReplaceImage(idx)}
                          className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[10px] h-8 flex items-center gap-1.5 text-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Replace URL
                        </Button>

                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadCustomImage(idx, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={isImagesGenerating || generatingSceneIdx !== null}
                          />
                          <span className={`w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[10px] h-8 flex items-center justify-center gap-1.5 rounded-md cursor-pointer text-slate-200 ${isImagesGenerating || generatingSceneIdx !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Plus className="w-3.5 h-3.5" /> Upload File
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(5)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem("saadhyam_video_images", JSON.stringify(scenes.map(s => s.imageUrl)));
                    setCurrentStep(7);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                >
                  Configure Audio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7: VOICE GENERATOR */}
        {currentStep === 7 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-400" />
                <span>AI Voice Synthesis</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Configure parameters, select accents, and synthesize narration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={voice.gender} onValueChange={(val) => setVoice((prev) => ({ ...prev, gender: val }))}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Female">Female Voice</SelectItem>
                      <SelectItem value="Male">Male Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Voice Accent</Label>
                  <Select value={voice.accent} onValueChange={(val) => setVoice((prev) => ({ ...prev, accent: val }))}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="US English">US English Accent</SelectItem>
                      <SelectItem value="UK English">UK English Accent</SelectItem>
                      <SelectItem value="Indian English">Indian English</SelectItem>
                      <SelectItem value="Spanish Accent">Spanish Accent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Voice Speed</Label>
                  <Select value={voice.speed} onValueChange={(val) => setVoice((prev) => ({ ...prev, speed: val }))}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="0.8x">0.8x (Slower)</SelectItem>
                      <SelectItem value="1.0x">1.0x (Standard)</SelectItem>
                      <SelectItem value="1.2x">1.2x (Faster)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center py-4">
                <Button
                  onClick={handleGenerateVoiceover}
                  disabled={isVoiceGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-10 py-5 rounded-xl shadow-lg flex items-center gap-2"
                >
                  {isVoiceGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Audio Tracks...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" /> Synthesize Narration Tracks
                    </>
                  )}
                </Button>
              </div>

              {/* Real Audio Preview Control Deck & Status Info Card */}
              {voice.audioUrl ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-400 text-center">Audio Controller Preview Deck</p>
                    
                    <audio
                      src={voice.audioUrl}
                      controls
                      className="w-full"
                      onPlay={() => setPlayingAudio(true)}
                      onPause={() => setPlayingAudio(false)}
                      onEnded={() => setPlayingAudio(false)}
                    />
                    
                    <Button
                      onClick={handleGenerateVoiceover}
                      disabled={isVoiceGenerating}
                      className="w-full bg-slate-900 border border-slate-800 text-xs h-9 flex items-center justify-center gap-1.5 hover:bg-slate-850 text-slate-200 font-semibold"
                    >
                      {isVoiceGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate Voice Only
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">Voice Synthesis Metadata</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div>
                        <span className="text-slate-500">Provider:</span>
                        <p className="font-semibold text-slate-200">{voice.provider || "ElevenLabs"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Model:</span>
                        <p className="font-mono font-semibold text-slate-200">{voice.model || "eleven_multilingual_v2"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration:</span>
                        <p className="font-semibold text-slate-200">{voice.duration ? `${voice.duration.toFixed(2)}s` : "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${voice.status?.includes("Fallback") ? "bg-amber-950 text-amber-300 border border-amber-900" : "bg-emerald-950 text-emerald-300 border border-emerald-900"}`}>
                            {voice.status || "Active"}
                          </span>
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Generation Time:</span>
                        <p className="font-semibold text-slate-200">{voice.generationTime ? `${voice.generationTime} ms` : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 p-6 border border-slate-850 border-dashed rounded-xl text-center max-w-md mx-auto text-xs text-slate-500">
                  <Volume2 className="w-8 h-8 text-slate-650 mx-auto mb-2" />
                  No narration tracks synthesized yet. Configure parameters and click the button above to generate speech!
                </div>
              )}

              {/* Background Music Configuration Block */}
              <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-slate-200">AI Background Music</h3>
                </div>
                <p className="text-xs text-slate-400">Select audio themes, generate scores, adjust volume, and loop tracks.</p>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Music Mood</Label>
                    <Select value={music.mood} onValueChange={(val) => setMusic((prev) => ({ ...prev, mood: val }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                        <SelectItem value="Happy">Happy</SelectItem>
                        <SelectItem value="Motivational">Motivational</SelectItem>
                        <SelectItem value="Emotional">Emotional</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Cinematic">Cinematic</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                        <SelectItem value="Minimal">Minimal</SelectItem>
                        <SelectItem value="Energetic">Energetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Music Genre</Label>
                    <Select value={music.genre} onValueChange={(val) => setMusic((prev) => ({ ...prev, genre: val }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                        <SelectItem value="Pop">Pop</SelectItem>
                        <SelectItem value="Ambient">Ambient</SelectItem>
                        <SelectItem value="Electronic">Electronic</SelectItem>
                        <SelectItem value="Piano">Piano</SelectItem>
                        <SelectItem value="Acoustic">Acoustic</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Cinematic">Cinematic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Target Duration</Label>
                    <Select value={music.duration} onValueChange={(val) => setMusic((prev) => ({ ...prev, duration: val }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                        <SelectItem value="15s">15 Seconds</SelectItem>
                        <SelectItem value="30s">30 Seconds</SelectItem>
                        <SelectItem value="60s">60 Seconds</SelectItem>
                        <SelectItem value="90s">90 Seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex justify-between text-xs">
                      <span>Music Volume</span>
                      <span className="text-purple-400 font-bold">{music.volume}%</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={music.volume}
                      onChange={(e) => {
                        const newVol = parseInt(e.target.value);
                        setMusic((prev) => ({ ...prev, volume: newVol }));
                        if (voice.audioUrl && music.musicUrl) {
                          handleMixAudio(voice.audioUrl, music.musicUrl, newVol, music.loop);
                        }
                      }}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center pt-2">
                  <Button
                    onClick={handleGenerateMusic}
                    disabled={isMusicGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold h-9 px-6 rounded-lg text-xs flex items-center gap-1.5"
                  >
                    {isMusicGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Music...
                      </>
                    ) : (
                      <>
                        <Music className="w-3.5 h-3.5" /> Generate Music Track
                      </>
                    )}
                  </Button>

                  <label className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 h-9 px-4 rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadCustomMusic(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <Plus className="w-3.5 h-3.5" /> Upload File
                  </label>

                  {music.musicUrl && (
                    <Button
                      variant="destructive"
                      onClick={handleRemoveMusic}
                      className="h-9 px-4 rounded-lg text-xs flex items-center gap-1.5 bg-red-950 text-red-300 border border-red-900"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Music
                    </Button>
                  )}
                </div>

                {music.musicUrl ? (
                  <div className="grid gap-4 md:grid-cols-2 pt-2">
                    {/* Music Player */}
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-slate-400 text-center">Background Music Preview</p>
                      <audio src={music.musicUrl} controls className="w-full" />
                    </div>

                    {/* Metadata details */}
                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">Music Specifications</p>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
                        <div>
                          <span className="text-slate-500">Provider:</span>
                          <p className="font-semibold text-slate-200">{music.provider}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Model:</span>
                          <p className="font-semibold text-slate-200 truncate">{music.model}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Mood / Genre:</span>
                          <p className="font-semibold text-slate-200">{music.mood} / {music.genre}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Status:</span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-900 font-mono">
                            {music.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-4 border border-slate-850 border-dashed rounded-xl text-center text-xs text-slate-500">
                    No background score generated. Choose mood and click Generate above!
                  </div>
                )}
              </div>

              {/* Master Audio Track Mixing & Multi-Track Preview Selection */}
              {voice.audioUrl && music.musicUrl && (
                <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-slate-200">Audio Track Mixing Deck</h3>
                  </div>
                  <p className="text-xs text-slate-400">Select preview track modes and execute cross-mixing overlays before final preview.</p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Preview Modality Playback</Label>
                      <Select value={previewMode} onValueChange={(val: any) => setPreviewMode(val)}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                          <SelectItem value="voice">Voice Narration Only</SelectItem>
                          <SelectItem value="music">Background Music Only</SelectItem>
                          <SelectItem value="mixed">Voice + Music Mixed Sound Track</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => handleMixAudio(voice.audioUrl || "", music.musicUrl || "", music.volume, music.loop)}
                        disabled={isMixing}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-slate-100 font-bold h-9 text-xs flex items-center justify-center gap-1.5"
                      >
                        {isMixing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mixing Audio Tracks...
                          </>
                        ) : (
                          <>
                            <Sliders className="w-3.5 h-3.5" /> Re-Mix Narration & Music
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-400 text-center">
                      Active Playback Mode: {previewMode === "voice" ? "Narration Only" : previewMode === "music" ? "Music Only" : "Mixed Score"}
                    </p>
                    <audio
                      src={previewMode === "voice" ? voice.audioUrl : previewMode === "music" ? music.musicUrl : mixedAudioUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(6)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem("saadhyam_video_voice", JSON.stringify(voice));
                    localStorage.setItem("saadhyam_video_music", JSON.stringify(music));
                    if (mixedAudioUrl) localStorage.setItem("saadhyam_video_mixed_audio", mixedAudioUrl);
                    setCurrentStep(8);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                >
                  Configure Captions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 8: AI SUBTITLE GENERATOR (v3.6) */}
        {currentStep === 8 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Type className="w-6 h-6 text-violet-400" />
                <span>AI Subtitle Generation & Animated Captions</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Generate word-level subtitles, apply animated caption presets, edit the timeline, and export SRT / VTT / ASS / TXT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* ── SECTION 1: Generation Controls ─────────────────────────── */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-bold text-violet-300">AI Subtitle Generator</p>
                  {subtitleState.provider && (
                    <span className="ml-auto text-[10px] bg-violet-900/50 border border-violet-700 text-violet-300 px-2 py-0.5 rounded-full font-mono">
                      {subtitleState.provider}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source Language</Label>
                    <Select value={subtitleState.language} onValueChange={(val) => setSubtitleState(p => ({ ...p, language: val }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                        <SelectItem value="te">Telugu</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                        <SelectItem value="kn">Kannada</SelectItem>
                        <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="fr">🇫🇷 French</SelectItem>
                        <SelectItem value="de">🇩🇪 German</SelectItem>
                        <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quality</Label>
                    <Select value={subtitleState.quality} onValueChange={(val) => setSubtitleState(p => ({ ...p, quality: val as any }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="fast">⚡ Fast (Whisper Tiny)</SelectItem>
                        <SelectItem value="balanced">⚖️ Balanced (Whisper Base)</SelectItem>
                        <SelectItem value="accurate">🎯 Accurate (Whisper Small)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button
                      id="generate-subtitles-btn"
                      disabled={isSubtitleGenerating || !script.narration.trim()}
                      onClick={async () => {
                        setIsSubtitleGenerating(true);
                        try {
                          const res = await apiClient.post("/plugins/marketing_ai_video_generator/generate-subtitles", {
                            narration: script.narration,
                            audioUrl: voice.audioUrl || "",
                            projectTitle: script.title || brand.businessName || "video",
                            language: subtitleState.language,
                            quality: subtitleState.quality,
                            outputFormats: ["srt", "vtt", "ass", "txt"],
                            captionStyle: extCaptions,
                          });
                          const data = (res as any).data || res;
                          const newState: SubtitleState = {
                            ...subtitleState,
                            segments: data.segments || [],
                            srtUrl: data.srtUrl,
                            vttUrl: data.vttUrl,
                            assUrl: data.assUrl,
                            txtUrl: data.txtUrl,
                            provider: data.provider,
                            model: data.model,
                          };
                          setSubtitleState(newState);
                          localStorage.setItem("saadhyam_video_subtitles", JSON.stringify(newState));
                          toast.success(`✅ ${data.segments?.length || 0} subtitle segments generated via ${data.provider}`);
                        } catch (err: any) {
                          toast.error(err?.message || "Subtitle generation failed");
                        } finally {
                          setIsSubtitleGenerating(false);
                        }
                      }}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold h-9"
                    >
                      {isSubtitleGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4 mr-2" />Generate AI Subtitles</>}
                    </Button>
                  </div>
                </div>
                {subtitleState.segments.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span>📝 <b className="text-slate-200">{subtitleState.segments.length}</b> segments</span>
                    <span>⏱ <b className="text-slate-200">{subtitleState.segments[subtitleState.segments.length - 1]?.end?.toFixed(1)}s</b> duration</span>
                    <span>🔤 <b className="text-slate-200">{subtitleState.segments.reduce((a, s) => a + s.text.split(' ').length, 0)}</b> words</span>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => {
                        const snap = [...(subtitleState.history || []), subtitleState.segments];
                        const newState = { ...subtitleState, history: snap.slice(-10) };
                        setSubtitleState(newState);
                        localStorage.setItem("saadhyam_video_subtitles", JSON.stringify(newState));
                        localStorage.setItem("saadhyam_video_subtitle_history", JSON.stringify(snap));
                        toast.success("Snapshot saved");
                      }}
                      className="ml-auto text-violet-400 hover:text-violet-300 text-xs"
                    >
                      <Save className="w-3 h-3 mr-1" />Save Snapshot
                    </Button>
                    {(subtitleState.history?.length ?? 0) > 0 && (
                      <Select
                        value=""
                        onValueChange={(idx) => {
                          const snap = subtitleState.history[parseInt(idx)];
                          if (snap) { setSubtitleState(p => ({ ...p, segments: snap })); toast.success("Snapshot restored"); }
                        }}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-7 text-xs w-36">
                          <RotateCcw className="w-3 h-3 mr-1" /><span>Restore</span>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                          {subtitleState.history.map((_, i) => (
                            <SelectItem key={i} value={String(i)}>Snapshot {i + 1} ({subtitleState.history[i].length} segs)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION 2: Caption Presets ──────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Caption Style Presets</p>
                <div className="grid grid-cols-4 gap-2">
                  {BUILT_IN_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      id={`preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setExtCaptions({
                          fontFamily: preset.fontFamily,
                          fontSize: preset.fontSize,
                          fontWeight: preset.fontWeight,
                          color: preset.color,
                          strokeColor: preset.strokeColor,
                          strokeWidth: preset.strokeWidth,
                          bgBox: preset.bgBox,
                          shadow: preset.shadow,
                          opacity: preset.opacity,
                          animation: preset.animation,
                          position: preset.position,
                        });
                        setSelectedPresetName(preset.name);
                        localStorage.setItem("saadhyam_video_ext_captions", JSON.stringify(preset));
                        toast.success(`Applied "${preset.name}" preset`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                        selectedPresetName === preset.name
                          ? "border-violet-500 bg-violet-900/30 shadow-violet-500/20 shadow-md"
                          : "border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{PRESET_EMOJI[preset.name] || "✨"}</div>
                      <div className="text-[11px] font-semibold text-slate-200 leading-tight">{preset.name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{preset.animation}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── SECTION 3: Extended Styling Panel ──────────────────────── */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <p className="text-xs font-bold text-pink-400 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" />Custom Styling</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Font Family</Label>
                    <Select value={extCaptions.fontFamily} onValueChange={(v) => setExtCaptions(p => ({ ...p, fontFamily: v }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {["Inter","Impact","Arial","Roboto","Times New Roman","Courier New","Georgia"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Size: {extCaptions.fontSize}px</Label>
                    <input type="range" min={14} max={56} value={extCaptions.fontSize}
                      onChange={(e) => setExtCaptions(p => ({ ...p, fontSize: Number(e.target.value) }))}
                      className="w-full accent-violet-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Font Weight</Label>
                    <Select value={extCaptions.fontWeight} onValueChange={(v) => setExtCaptions(p => ({ ...p, fontWeight: v }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {["300","400","600","700","900"].map(w => <SelectItem key={w} value={w}>{w === "300" ? "Light" : w === "400" ? "Regular" : w === "600" ? "SemiBold" : w === "700" ? "Bold" : "Black"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Position</Label>
                    <Select value={extCaptions.position} onValueChange={(v) => setExtCaptions(p => ({ ...p, position: v }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Bottom Center">Bottom Center</SelectItem>
                        <SelectItem value="Top Center">Top Center</SelectItem>
                        <SelectItem value="Middle Center">Middle Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Text Color</Label>
                    <div className="flex gap-1.5">
                      <input type="color" value={extCaptions.color}
                        onChange={(e) => setExtCaptions(p => ({ ...p, color: e.target.value }))}
                        className="w-10 h-8 p-0 rounded border border-slate-700 bg-slate-900 cursor-pointer" />
                      <Input value={extCaptions.color}
                        onChange={(e) => setExtCaptions(p => ({ ...p, color: e.target.value }))}
                        className="bg-slate-900 border-slate-800 text-slate-100 font-mono h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Stroke Color</Label>
                    <div className="flex gap-1.5">
                      <input type="color" value={extCaptions.strokeColor}
                        onChange={(e) => setExtCaptions(p => ({ ...p, strokeColor: e.target.value }))}
                        className="w-10 h-8 p-0 rounded border border-slate-700 bg-slate-900 cursor-pointer" />
                      <Input value={extCaptions.strokeColor}
                        onChange={(e) => setExtCaptions(p => ({ ...p, strokeColor: e.target.value }))}
                        className="bg-slate-900 border-slate-800 text-slate-100 font-mono h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Stroke Width: {extCaptions.strokeWidth}px</Label>
                    <input type="range" min={0} max={6} value={extCaptions.strokeWidth}
                      onChange={(e) => setExtCaptions(p => ({ ...p, strokeWidth: Number(e.target.value) }))}
                      className="w-full accent-pink-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Opacity: {Math.round(extCaptions.opacity * 100)}%</Label>
                    <input type="range" min={0.3} max={1} step={0.05} value={extCaptions.opacity}
                      onChange={(e) => setExtCaptions(p => ({ ...p, opacity: Number(e.target.value) }))}
                      className="w-full accent-purple-500" />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Animation</Label>
                    <Select value={extCaptions.animation} onValueChange={(v) => setExtCaptions(p => ({ ...p, animation: v }))}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {["Fade","Slide Up","Slide Down","Typewriter","Bounce","Karaoke","Zoom","Pop","Word-by-word","None"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={extCaptions.bgBox}
                        onChange={(e) => setExtCaptions(p => ({ ...p, bgBox: e.target.checked }))}
                        className="rounded accent-violet-500" />
                      Background Box
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={extCaptions.shadow}
                        onChange={(e) => setExtCaptions(p => ({ ...p, shadow: e.target.checked }))}
                        className="rounded accent-violet-500" />
                      Shadow
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={showSafeArea}
                        onChange={(e) => setShowSafeArea(e.target.checked)}
                        className="rounded accent-green-500" />
                      Safe Area Guides
                    </label>
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: Live Caption Preview ────────────────────────── */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5"><Play className="w-3.5 h-3.5" />Live Caption Preview</p>
                <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "9/5", maxHeight: 220 }}>
                  {/* Safe Area Guide Overlays */}
                  {showSafeArea && (
                    <>
                      <div className="absolute inset-[8%] border-2 border-dashed border-yellow-400/40 rounded pointer-events-none z-10">
                        <span className="absolute top-1 left-2 text-[9px] text-yellow-400/70 font-mono">TikTok Safe Area</span>
                      </div>
                      <div className="absolute inset-[5%] border border-dashed border-pink-400/30 rounded pointer-events-none z-10">
                        <span className="absolute top-1 right-2 text-[9px] text-pink-400/70 font-mono">Instagram</span>
                      </div>
                    </>
                  )}
                  {/* Preview background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Film className="w-16 h-16 text-slate-500" />
                  </div>
                  {/* Caption overlay */}
                  {(() => {
                    const previewText = subtitleState.segments[0]?.text || scenes[0]?.captionText || "Your caption appears here";
                    const posStyle: React.CSSProperties = extCaptions.position === "Top Center"
                      ? { top: "10%", left: "50%", transform: "translateX(-50%)" }
                      : extCaptions.position === "Middle Center"
                      ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
                      : { bottom: "12%", left: "50%", transform: "translateX(-50%)" };
                    return (
                      <div
                        style={{
                          position: "absolute", ...posStyle,
                          textAlign: "center", zIndex: 20,
                          fontFamily: `'${extCaptions.fontFamily}', sans-serif`,
                          fontSize: extCaptions.fontSize * 0.55,
                          fontWeight: extCaptions.fontWeight,
                          color: extCaptions.color,
                          opacity: extCaptions.opacity,
                          textShadow: extCaptions.shadow ? `1px 1px 3px ${extCaptions.strokeColor}` : "none",
                          background: extCaptions.bgBox ? "rgba(0,0,0,0.65)" : "transparent",
                          padding: extCaptions.bgBox ? "3px 10px" : "0",
                          borderRadius: 4,
                          WebkitTextStroke: extCaptions.strokeWidth > 0 ? `${extCaptions.strokeWidth * 0.5}px ${extCaptions.strokeColor}` : undefined,
                          whiteSpace: "pre-wrap", maxWidth: "80%",
                        }}
                      >
                        {previewText}
                      </div>
                    );
                  })()}
                  <div className="absolute bottom-2 right-3 text-[9px] text-slate-500 font-mono">{extCaptions.animation} · {extCaptions.position}</div>
                </div>
              </div>

              {/* ── SECTION 5: Segment Timeline Editor ─────────────────────── */}
              {subtitleState.segments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" />Subtitle Timeline Editor</p>
                    <div className="ml-auto flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        placeholder="Search subtitles…"
                        value={subtitleSearch}
                        onChange={(e) => setSubtitleSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500 w-36"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-0 text-[10px] font-mono text-slate-500 px-3 py-2 border-b border-slate-800 bg-slate-900/50">
                      <span className="col-span-1">#</span>
                      <span className="col-span-2">Start</span>
                      <span className="col-span-2">End</span>
                      <span className="col-span-6">Text</span>
                      <span className="col-span-1"></span>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/50">
                      {subtitleState.segments
                        .filter(s => !subtitleSearch || s.text.toLowerCase().includes(subtitleSearch.toLowerCase()))
                        .map((seg, idx) => (
                          <div key={seg.id} className="grid grid-cols-12 gap-1 px-3 py-1.5 items-center hover:bg-slate-900/50 transition-colors">
                            <span className="col-span-1 text-[10px] text-slate-500 font-mono">{seg.id}</span>
                            <input
                              type="number" step="0.1" value={seg.start}
                              onChange={(e) => {
                                const updated = [...subtitleState.segments];
                                updated[idx] = { ...updated[idx], start: Number(e.target.value) };
                                setSubtitleState(p => ({ ...p, segments: updated }));
                              }}
                              className="col-span-2 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 outline-none focus:border-violet-500"
                            />
                            <input
                              type="number" step="0.1" value={seg.end}
                              onChange={(e) => {
                                const updated = [...subtitleState.segments];
                                updated[idx] = { ...updated[idx], end: Number(e.target.value) };
                                setSubtitleState(p => ({ ...p, segments: updated }));
                              }}
                              className="col-span-2 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 outline-none focus:border-violet-500"
                            />
                            <input
                              value={seg.text}
                              onChange={(e) => {
                                const updated = [...subtitleState.segments];
                                updated[idx] = { ...updated[idx], text: e.target.value };
                                setSubtitleState(p => ({ ...p, segments: updated }));
                              }}
                              className="col-span-6 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 outline-none focus:border-violet-500"
                            />
                            <button
                              onClick={() => {
                                const updated = subtitleState.segments.filter((_, i) => i !== idx);
                                setSubtitleState(p => ({ ...p, segments: updated }));
                              }}
                              className="col-span-1 text-slate-600 hover:text-red-400 transition-colors flex justify-center"
                            ><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                    </div>
                    <div className="px-3 py-2 border-t border-slate-800 flex gap-2">
                      <Button size="sm" variant="ghost"
                        onClick={() => {
                          const last = subtitleState.segments[subtitleState.segments.length - 1];
                          const newSeg: SubtitleSegment = { id: (last?.id || 0) + 1, start: last?.end || 0, end: (last?.end || 0) + 2, text: "New subtitle line", words: [] };
                          setSubtitleState(p => ({ ...p, segments: [...p.segments, newSeg] }));
                        }}
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        <Plus className="w-3 h-3 mr-1" />Add Row
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => {
                          localStorage.setItem("saadhyam_video_subtitles", JSON.stringify(subtitleState));
                          toast.success("Subtitles saved");
                        }}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        <Save className="w-3 h-3 mr-1" />Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECTION 6: Translation Panel ────────────────────────────── */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Multi-Language Translation</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: "hi", label: "🇮🇳 Hindi" }, { code: "te", label: "Telugu" }, { code: "ta", label: "Tamil" },
                    { code: "kn", label: "Kannada" }, { code: "es", label: "🇪🇸 Spanish" }, { code: "fr", label: "🇫🇷 French" },
                    { code: "de", label: "🇩🇪 German" }, { code: "ja", label: "🇯🇵 Japanese" },
                  ].map(({ code, label }) => (
                    <button
                      key={code}
                      id={`translate-lang-${code}`}
                      onClick={() => {
                        setSubtitleState(p => ({
                          ...p,
                          targetLanguages: p.targetLanguages.includes(code)
                            ? p.targetLanguages.filter(l => l !== code)
                            : [...p.targetLanguages, code]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                        subtitleState.targetLanguages.includes(code)
                          ? "border-emerald-500 bg-emerald-900/30 text-emerald-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >{label}</button>
                  ))}
                </div>
                <Button
                  id="translate-subtitles-btn"
                  disabled={isTranslating || subtitleState.segments.length === 0 || subtitleState.targetLanguages.length === 0}
                  onClick={async () => {
                    setIsTranslating(true);
                    try {
                      const res = await apiClient.post("/plugins/marketing_ai_video_generator/translate-subtitles", {
                        segments: subtitleState.segments,
                        targetLanguages: subtitleState.targetLanguages,
                        projectTitle: script.title || brand.businessName || "video",
                      });
                      const data = (res as any).data || res;
                      setSubtitleState(p => ({ ...p, translations: data.translations || {}, translationFiles: data.files || {} }));
                      setActiveTranslationLang(subtitleState.targetLanguages[0] || "en");
                      toast.success(`✅ Translated to ${Object.keys(data.translations || {}).length} languages`);
                    } catch (err: any) {
                      toast.error(err?.message || "Translation failed");
                    } finally {
                      setIsTranslating(false);
                    }
                  }}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs"
                >
                  {isTranslating ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Translating…</> : <><Globe className="w-3 h-3 mr-1" />Translate to Selected Languages</>}
                </Button>
                {/* Translation tabs */}
                {Object.keys(subtitleState.translations).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setActiveTranslationLang("en")}
                        className={`px-2.5 py-1 rounded text-xs border transition-all ${activeTranslationLang === "en" ? "border-violet-500 bg-violet-900/30 text-violet-300" : "border-slate-700 text-slate-400"}`}
                      >🇬🇧 Source</button>
                      {Object.keys(subtitleState.translations).map(lang => (
                        <button key={lang} onClick={() => setActiveTranslationLang(lang)}
                          className={`px-2.5 py-1 rounded text-xs border transition-all ${activeTranslationLang === lang ? "border-violet-500 bg-violet-900/30 text-violet-300" : "border-slate-700 text-slate-400"}`}
                        >{lang.toUpperCase()}</button>
                      ))}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                      {(activeTranslationLang === "en" ? subtitleState.segments : subtitleState.translations[activeTranslationLang] || []).map((seg) => (
                        <div key={seg.id} className="flex gap-2 text-xs">
                          <span className="text-slate-600 font-mono w-8 shrink-0">{seg.id}</span>
                          <span className="text-slate-300">{seg.text}</span>
                        </div>
                      ))}
                    </div>
                    {/* Per-language download buttons */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(subtitleState.translationFiles).map(([lang, files]) => (
                        <div key={lang} className="flex gap-1">
                          <a href={`http://localhost:8000${files.srtUrl}`} download target="_blank" rel="noreferrer"
                            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors">
                            {lang.toUpperCase()} SRT
                          </a>
                          <a href={`http://localhost:8000${files.vttUrl}`} download target="_blank" rel="noreferrer"
                            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors">
                            {lang.toUpperCase()} VTT
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 7: Export & Upload Controls ─────────────────────── */}
              <div className="grid gap-3 md:grid-cols-2">
                {/* Export buttons */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-sky-400 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export Subtitles</p>
                  <div className="flex flex-wrap gap-2">
                    {(["srt", "vtt", "ass", "txt"] as const).map(fmt => (
                      <a
                        key={fmt}
                        id={`export-subtitle-${fmt}`}
                        href={subtitleState[`${fmt}Url` as keyof SubtitleState] ? `http://localhost:8000${subtitleState[`${fmt}Url` as keyof SubtitleState]}` : undefined}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                          subtitleState[`${fmt}Url` as keyof SubtitleState]
                            ? "border-sky-600 bg-sky-900/30 text-sky-300 hover:bg-sky-800/40"
                            : "border-slate-700 text-slate-600 cursor-not-allowed"
                        }`}
                        onClick={e => { if (!subtitleState[`${fmt}Url` as keyof SubtitleState]) e.preventDefault(); }}
                      >
                        .{fmt.toUpperCase()}
                      </a>
                    ))}
                  </div>
                </div>
                {/* Upload custom subtitles */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-orange-400 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Upload Subtitle File</p>
                  <div className="flex gap-2 items-center">
                    <input
                      ref={subtitleFileRef}
                      type="file"
                      accept=".srt,.vtt"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        const fmt = file.name.endsWith(".vtt") ? "vtt" : "srt";
                        try {
                          const res = await apiClient.post("/plugins/marketing_ai_video_generator/upload-subtitles", { content: text, format: fmt });
                          const data = (res as any).data || res;
                          setSubtitleState(p => ({ ...p, segments: data.segments || [] }));
                          toast.success(`✅ Loaded ${data.count} subtitle segments from ${file.name}`);
                        } catch (err: any) {
                          setUploadError(err?.message || "Upload failed");
                        }
                      }}
                    />
                    <Button
                      id="upload-subtitle-file-btn"
                      size="sm" variant="outline"
                      onClick={() => subtitleFileRef.current?.click()}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />Choose .srt or .vtt
                    </Button>
                    {uploadError && <span className="text-[10px] text-red-400">{uploadError}</span>}
                  </div>
                </div>
              </div>

              {/* ── Navigation ─────────────────────────────────────────────── */}
              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <Button variant="outline" onClick={() => setCurrentStep(7)} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
        {/* STEP 9: PROFESSIONAL TIMELINE EDITOR (v3.7) */}
        {currentStep === 9 && (() => {
          // Lazy init timeline tracks if not loaded
          if (!timelineTracks) {
            let cursor = 0.0;
            const sceneBlocks = scenes.map((s, idx) => {
              const start = cursor;
              const end = cursor + (s.duration || 5);
              cursor = end;
              return {
                id: s.id || `scene-${idx + 1}`,
                label: s.title || `Scene ${idx + 1}`,
                start,
                end,
                duration: s.duration || 5,
                animation: s.animation || "Fade",
                transition: s.transition || "CrossFade",
                imageUrl: s.imageUrl || "",
                locked: false,
                hidden: false,
              };
            });

            const total = cursor;
            const defaultTracks = {
              scenes: sceneBlocks,
              voice: [{
                id: "voice-1",
                label: `Voiceover (${voice.voice || "Rachel"})`,
                start: 0,
                end: total,
                duration: total,
                locked: false,
                hidden: false,
              }],
              music: [{
                id: "music-1",
                label: `Music (${musicTrack})`,
                start: 0,
                end: total,
                duration: total,
                locked: false,
                hidden: false,
              }],
              subtitles: subtitleState.segments.map((seg, idx) => ({
                id: `sub-${idx + 1}`,
                label: seg.text || `Sub ${idx + 1}`,
                start: seg.start,
                end: seg.end,
                duration: seg.end - seg.start,
                locked: false,
                hidden: false,
              })),
              overlays: overlaysList.map((ov, idx) => ({
                id: ov.overlayId || `overlay-${idx + 1}`,
                label: ov.label || `${ov.type} Overlay`,
                start: ov.startTime || 0,
                end: ov.endTime || total,
                duration: (ov.endTime || total) - (ov.startTime || 0),
                type: ov.type,
                url: ov.url,
                x: ov.x,
                y: ov.y,
                width: ov.width,
                height: ov.height,
                opacity: ov.opacity,
                zIndex: ov.zIndex,
                locked: false,
                hidden: false,
              }))
            };

            setTimelineTracks(defaultTracks);
            localStorage.setItem("saadhyam_video_timeline", JSON.stringify(defaultTracks));
          }

          const tracks = timelineTracks || { scenes: [], voice: [], music: [], subtitles: [], overlays: [] };

          // Save timeline helper with undo stack
          const pushToHistory = (newTracks: any) => {
            setUndoStack(prev => [...prev.slice(-20), timelineTracks]);
            setRedoStack([]);
            setTimelineTracks(newTracks);
            localStorage.setItem("saadhyam_video_timeline", JSON.stringify(newTracks));
          };

          const handleUndo = () => {
            if (undoStack.length === 0) return;
            const prev = undoStack[undoStack.length - 1];
            setRedoStack(r => [...r, timelineTracks]);
            setUndoStack(u => u.slice(0, -1));
            setTimelineTracks(prev);
            localStorage.setItem("saadhyam_video_timeline", JSON.stringify(prev));
            toast.success("Undo successful");
          };

          const handleRedo = () => {
            if (redoStack.length === 0) return;
            const next = redoStack[redoStack.length - 1];
            setUndoStack(u => [...u, timelineTracks]);
            setRedoStack(r => r.slice(0, -1));
            setTimelineTracks(next);
            localStorage.setItem("saadhyam_video_timeline", JSON.stringify(next));
            toast.success("Redo successful");
          };

          // Keyboard Shortcuts listener
          const handleKeyDown = (e: KeyboardEvent) => {
            if (currentStep !== 9) return;
            // Ignore if user typing in input/textarea
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

            if (e.ctrlKey && e.key.toLowerCase() === "z") {
              e.preventDefault();
              handleUndo();
            } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
              e.preventDefault();
              handleRedo();
            } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
              e.preventDefault();
              if (selectedBlock) {
                const trackList = tracks[selectedBlock.track] || [];
                const block = trackList.find((b: any) => b.id === selectedBlock.id);
                if (block) {
                  setClipboard({ track: selectedBlock.track, block });
                  toast.success(`Copied ${selectedBlock.track} block`);
                }
              }
            } else if (e.ctrlKey && e.key.toLowerCase() === "v") {
              e.preventDefault();
              if (clipboard) {
                const newBlock = {
                  ...clipboard.block,
                  id: `${clipboard.block.id}-copy-${Date.now()}`,
                  label: `${clipboard.block.label} (Copy)`,
                  start: clipboard.block.start + 1,
                  end: clipboard.block.end + 1,
                };
                const updatedTracks = {
                  ...tracks,
                  [clipboard.track]: [...tracks[clipboard.track], newBlock]
                };
                pushToHistory(updatedTracks);
                setSelectedBlock({ track: clipboard.track, id: newBlock.id });
                toast.success(`Pasted block into ${clipboard.track}`);
              }
            } else if (e.key === "Delete" || e.key === "Backspace") {
              if (selectedBlock) {
                const updated = {
                  ...tracks,
                  [selectedBlock.track]: (tracks[selectedBlock.track] || []).filter((b: any) => b.id !== selectedBlock.id)
                };
                pushToHistory(updated);
                setSelectedBlock(null);
                toast.success("Deleted selected block");
              }
            } else if (e.key === " ") {
              e.preventDefault();
              if (isPlaying) {
                stopPlayback();
              } else {
                startPlayback();
              }
            }
          };

          // Wire up event listeners
          useEffect(() => {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
          }, [timelineTracks, selectedBlock, clipboard, undoStack, redoStack]);

          // Swap scene positions (Reorder)
          const swapScenes = (indexA: number, indexB: number) => {
            if (indexA < 0 || indexA >= tracks.scenes.length || indexB < 0 || indexB >= tracks.scenes.length) return;
            const updated = [...tracks.scenes];
            const temp = updated[indexA];
            updated[indexA] = updated[indexB];
            updated[indexB] = temp;

            // Recalculate timeline bounds based on duration
            let cursor = 0.0;
            const revised = updated.map((scene) => {
              const start = cursor;
              const end = cursor + scene.duration;
              cursor = end;
              return { ...scene, start, end };
            });

            pushToHistory({ ...tracks, scenes: revised });
            toast.success("Reordered scenes");
          };

          // Nudge timeline duration
          const nudgeDuration = (trackKey: string, blockId: string, amount: number) => {
            const updatedList = (tracks[trackKey] || []).map((b: any) => {
              if (b.id === blockId) {
                if (b.locked) return b;
                const newDuration = Math.max(0.5, b.duration + amount);
                return {
                  ...b,
                  duration: newDuration,
                  end: b.start + newDuration
                };
              }
              return b;
            });
            pushToHistory({ ...tracks, [trackKey]: updatedList });
          };

          // Lock / Hide Toggle
          const toggleLock = (trackKey: string, blockId: string) => {
            const updated = (tracks[trackKey] || []).map((b: any) => {
              if (b.id === blockId) return { ...b, locked: !b.locked };
              return b;
            });
            pushToHistory({ ...tracks, [trackKey]: updated });
          };

          const toggleHide = (trackKey: string, blockId: string) => {
            const updated = (tracks[trackKey] || []).map((b: any) => {
              if (b.id === blockId) return { ...b, hidden: !b.hidden };
              return b;
            });
            pushToHistory({ ...tracks, [trackKey]: updated });
          };

          // Split block
          const handleSplitBlock = (trackKey: string, blockId: string) => {
            const list = tracks[trackKey] || [];
            const blockIndex = list.findIndex((b: any) => b.id === blockId);
            if (blockIndex === -1) return;
            const block = list[blockIndex];
            if (block.locked) {
              toast.error("Locked blocks cannot be split");
              return;
            }
            const mid = block.start + (block.duration / 2);
            const firstHalf = {
              ...block,
              id: `${block.id}-split-1`,
              label: `${block.label} (Part 1)`,
              end: mid,
              duration: block.duration / 2
            };
            const secondHalf = {
              ...block,
              id: `${block.id}-split-2`,
              label: `${block.label} (Part 2)`,
              start: mid,
              duration: block.duration / 2
            };
            const revised = [...list];
            revised.splice(blockIndex, 1, firstHalf, secondHalf);
            pushToHistory({ ...tracks, [trackKey]: revised });
            toast.success("Block split in half");
          };

          // Merge adjacent blocks
          const handleMergeBlocks = (trackKey: string) => {
            const list = tracks[trackKey] || [];
            if (list.length < 2) {
              toast.error("Need at least 2 blocks to merge");
              return;
            }
            // Merge last two
            const last = list[list.length - 1];
            const prev = list[list.length - 2];
            const merged = {
              ...prev,
              label: `${prev.label} + ${last.label}`,
              end: last.end,
              duration: last.end - prev.start
            };
            const revised = [...list.slice(0, -2), merged];
            pushToHistory({ ...tracks, [trackKey]: revised });
            toast.success("Merged adjacent blocks");
          };

          // Preset lists
          const animationsList = [
            "Fade", "CrossFade", "Zoom In", "Zoom Out",
            "Pan Left", "Pan Right", "Slide Left", "Slide Right",
            "Slide Up", "Slide Down", "Ken Burns", "Rotate", "Blur",
            "Flash", "Glitch"
          ];

          const transitionsList = [
            "None", "Fade", "CrossFade", "Wipe Left", "Wipe Right",
            "Wipe Up", "Wipe Down", "Zoom", "Slide", "Dissolve", "Flash"
          ];

          // Set overlay handler
          const handleAddOverlay = async (type: string, details?: any) => {
            try {
              const res = await apiClient.post("/plugins/marketing_ai_video_generator/overlay", {
                type,
                label: details?.label || type,
                x: details?.x || 5.0,
                y: details?.y || 5.0,
                width: details?.width || 25.0,
                height: details?.height || 12.0,
                opacity: 1.0,
                zIndex: 10,
                startTime: 0,
                endTime: tracks.scenes.reduce((sum: number, s: any) => sum + s.duration, 0) || 15,
                text: details?.text || ""
              });
              const newOverlay = (res as any).data || (res as any);
              const dataBlock = {
                id: newOverlay.overlayId,
                label: newOverlay.label,
                start: newOverlay.startTime,
                end: newOverlay.endTime,
                duration: newOverlay.endTime - newOverlay.startTime,
                type: newOverlay.type,
                url: newOverlay.url,
                x: newOverlay.x,
                y: newOverlay.y,
                width: newOverlay.width,
                height: newOverlay.height,
                opacity: newOverlay.opacity,
                zIndex: newOverlay.zIndex,
                locked: false,
                hidden: false,
              };

              const newOverlaysList = [...overlaysList, newOverlay];
              setOverlaysList(newOverlaysList);
              localStorage.setItem("saadhyam_video_overlays", JSON.stringify(newOverlaysList));

              const updatedTracks = {
                ...tracks,
                overlays: [...(tracks.overlays || []), dataBlock]
              };
              pushToHistory(updatedTracks);
              toast.success(`Added ${type} overlay`);
            } catch (err: any) {
              toast.error(err?.message || "Failed to configure overlay");
            }
          };

          return (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
              <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes zoomOut { from { transform: scale(1.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes panLeft { from { transform: translateX(45px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes panRight { from { transform: translateX(-45px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
                @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.15) translate(-1%, -1%); } }
                @keyframes rotate { from { transform: rotate(-8deg); opacity: 0; } to { transform: rotate(0); opacity: 1; } }
                @keyframes unblur { from { filter: blur(6px); } to { filter: blur(0); } }
                @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
                @keyframes glitch {
                  0% { clip-path: inset(30% 0 40% 0); transform: skew(0.5deg); }
                  20% { clip-path: inset(80% 0 5% 0); transform: skew(-0.5deg); }
                  40% { clip-path: inset(10% 0 75% 0); transform: skew(0.3deg); }
                  60% { clip-path: inset(60% 0 10% 0); transform: skew(-0.2deg); }
                  80% { clip-path: inset(5% 0 85% 0); transform: skew(0.4deg); }
                  100% { clip-path: inset(0 0 0 0); transform: skew(0); }
                }
              `}</style>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Film className="w-6 h-6 text-purple-400" />
                    <div>
                      <CardTitle className="text-xl font-bold">Professional Timeline Editor</CardTitle>
                      <CardDescription className="text-slate-400">Canva & CapCut style track controls with multi-layer overlays and previews.</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Safe Area Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Guides:</span>
                      <Select value={safeAreaType} onValueChange={setSafeAreaType}>
                        <SelectTrigger className="h-7 text-[10px] bg-slate-900 border-slate-800 text-slate-300 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-850 text-slate-100 text-xs">
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="TikTok">TikTok (9:16)</SelectItem>
                          <SelectItem value="Instagram">Instagram Reels</SelectItem>
                          <SelectItem value="YouTube Shorts">YouTube Shorts</SelectItem>
                          <SelectItem value="Facebook">Facebook Story</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timeline Zoom */}
                    <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Zoom:</span>
                      {[25, 50, 100, 200].map(z => (
                        <button
                          key={z}
                          onClick={() => setTimelineZoom(z)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${timelineZoom === z ? "bg-purple-900 text-purple-200" : "text-slate-500 hover:text-slate-300"}`}
                        >{z}%</button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-0">
                <div className="grid grid-cols-12 divide-x divide-slate-800">
                  
                  {/* ── LEFT & CENTER: Preview Screen & Subtitle Track ──────── */}
                  <div className="col-span-8 p-6 space-y-6">
                    <div className="grid grid-cols-12 gap-6 items-start">
                      
                      {/* Interactive Video Player Monitor */}
                      <div className="col-span-7 flex justify-center">
                        <div className="w-[200px] h-[356px] bg-black border-4 border-slate-950 rounded-[28px] relative overflow-hidden shadow-2xl flex flex-col justify-between p-4 group">
                          {/* Safe Area Guide Overlays */}
                          {safeAreaType !== "None" && (
                            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/25 pointer-events-none z-30">
                              <div className="absolute inset-x-0 bottom-16 border-t border-dashed border-red-500/35 flex justify-center">
                                <span className="text-[8px] bg-red-950/80 text-red-400 px-1 rounded -translate-y-1/2">{safeAreaType} Safe Area</span>
                              </div>
                              <div className="absolute inset-x-0 top-12 border-b border-dashed border-red-500/35" />
                            </div>
                          )}

                          {/* Active Scene Video / Visual Background */}
                          {(() => {
                            const activeIdx = activeSceneIdx < tracks.scenes.length ? activeSceneIdx : 0;
                            const activeScene = tracks.scenes[activeIdx];
                            const animStyle = activePreviewAnimation ? { animation: `${activePreviewAnimation.replace(" ", "")} 1.5s ease-in-out forwards` } : {};
                            
                            return (
                              <div className="absolute inset-0 z-0">
                                {activeScene?.imageUrl ? (
                                  <img
                                    src={activeScene.imageUrl}
                                    alt="Storyboard Preview"
                                    className="w-full h-full object-cover transition-transform"
                                    style={activePreviewAnimation === "Ken Burns" ? { animation: "kenBurns 6s ease-in-out infinite alternate" } : animStyle}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-800 font-mono text-xs">No media</div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Top Header Label */}
                          <div className="relative z-10 flex justify-between items-center text-[9px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded">
                            <span className="font-semibold text-slate-200">Monitor Preview</span>
                            <span>{safeAreaType !== "None" ? safeAreaType : "Free"}</span>
                          </div>

                          {/* Live interactive overlays burn layer */}
                          <div className="absolute inset-0 pointer-events-none z-10">
                            {tracks.overlays.map((ov: any) => {
                              if (ov.hidden) return null;
                              return (
                                <div
                                  key={ov.id}
                                  style={{
                                    position: "absolute",
                                    left: `${ov.x}%`,
                                    top: `${ov.y}%`,
                                    width: `${ov.width}%`,
                                    height: `${ov.height}%`,
                                    opacity: ov.opacity,
                                    zIndex: ov.zIndex,
                                    background: ov.type === "CTA Button" ? "#ec4899" : ov.type === "Badge" ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                                    border: "1px dashed rgba(255,255,255,0.3)",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: "9px",
                                    fontWeight: "bold",
                                    padding: "2px",
                                    textAlign: "center"
                                  }}
                                >
                                  {ov.type === "Emoji" ? "✨" : ov.type === "Sticker" ? "⭐" : ov.label}
                                </div>
                              );
                            })}
                          </div>

                          {/* Active Caption burned in */}
                          <div className="relative z-20 w-full text-center pb-2">
                            <p
                              className="text-[10px] font-bold inline-block bg-black/75 px-3 py-1.5 rounded-lg border border-slate-800 text-white"
                              style={{ fontFamily: extCaptions.fontFamily }}
                            >
                              {subtitleState.segments[activeSceneIdx]?.text || scenes[activeSceneIdx]?.captionText || "No captions active"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Video compiling metadata & tools */}
                      <div className="col-span-5 space-y-4">
                        <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Compilation Monitor</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                            <div>Total duration:</div>
                            <div className="text-right text-slate-200">{tracks.scenes.reduce((sum: number, s: any) => sum + s.duration, 0).toFixed(1)}s</div>
                            <div>FPS:</div>
                            <div className="text-right text-slate-200">{config.fps || 30} fps</div>
                            <div>Resolution:</div>
                            <div className="text-right text-slate-200">{config.aspectRatio === "9:16" ? "720x1280" : "1280x720"}</div>
                            <div>Subtitles:</div>
                            <div className="text-right text-slate-200">{subtitleState.segments.length} segments</div>
                          </div>
                          
                          <Button
                            id="timeline-render-btn"
                            onClick={handleRenderVideo}
                            disabled={isRendering}
                            className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold h-9 text-xs rounded-xl flex items-center justify-center gap-1.5"
                          >
                            {isRendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                            Compile & Render Video
                          </Button>

                          {isRendering && (
                            <div className="space-y-1.5">
                              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full" style={{ width: `${renderProgress}%` }} />
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>{renderStatusText}</span>
                                <span>{renderProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Audio track source details */}
                        <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl text-[10px] space-y-2">
                          <p className="font-bold text-slate-400">Timeline Audio Mix</p>
                          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 rounded px-2.5 py-1.5 text-slate-300">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="truncate">Voice: {voice.voice} ({voice.gender})</span>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 rounded px-2.5 py-1.5 text-slate-300">
                            <Music className="w-3.5 h-3.5 text-blue-400" />
                            <span className="truncate">Music: {musicTrack} ({music.volume}% vol)</span>
                          </div>
                        </div>

                        {/* Short guidelines list */}
                        <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl space-y-1 text-[9px] text-slate-500 leading-relaxed font-mono">
                          <p className="font-bold text-slate-400 uppercase tracking-widest mb-1.5">Shortcuts</p>
                          <p>Space: Play/Pause monitor preview</p>
                          <p>Delete: Remove selected block</p>
                          <p>Ctrl + C/V: Copy/Paste selected block</p>
                          <p>Ctrl + Z/Y: Undo/Redo edits</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT PANEL: Sidebars (Animations / Overlays) ─────────── */}
                  <div className="col-span-4 p-5 space-y-6">
                    
                    {/* Scene Animations Configuration Panel */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" /> Block Animation Panel
                      </h4>
                      
                      {selectedBlock && selectedBlock.track === "scenes" ? (() => {
                        const blockId = selectedBlock.id;
                        const block = tracks.scenes.find((s: any) => s.id === blockId);
                        if (!block) return <p className="text-[10px] text-slate-500">Scene not found</p>;
                        
                        return (
                          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                            <p className="text-[11px] font-bold text-purple-300">Editing: {block.label}</p>
                            
                            <div className="space-y-1">
                              <Label className="text-[10px]">Animation</Label>
                              <Select
                                value={block.animation}
                                onValueChange={(val) => {
                                  const revised = tracks.scenes.map((s: any) => s.id === blockId ? { ...s, animation: val } : s);
                                  pushToHistory({ ...tracks, scenes: revised });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-850 text-slate-100 text-xs">
                                  {animationsList.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px]">Transition</Label>
                              <Select
                                value={block.transition}
                                onValueChange={(val) => {
                                  const revised = tracks.scenes.map((s: any) => s.id === blockId ? { ...s, transition: val } : s);
                                  pushToHistory({ ...tracks, scenes: revised });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-850 text-slate-100 text-xs">
                                  {transitionsList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] flex justify-between">
                                <span>Duration</span>
                                <span className="font-bold font-mono text-purple-400">{block.duration.toFixed(1)}s</span>
                              </Label>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => nudgeDuration("scenes", blockId, -0.5)} className="h-7 text-xs bg-slate-900">-0.5s</Button>
                                <Button size="sm" variant="outline" onClick={() => nudgeDuration("scenes", blockId, 0.5)} className="h-7 text-xs bg-slate-900">+0.5s</Button>
                              </div>
                            </div>

                            <Button
                              onClick={() => {
                                setActivePreviewAnimation(block.animation);
                                setTimeout(() => setActivePreviewAnimation(""), 1600);
                              }}
                              className="w-full h-8 text-xs bg-purple-900 hover:bg-purple-800 text-purple-200 mt-2"
                            >
                              Preview Animation
                            </Button>
                          </div>
                        );
                      })() : (
                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-center text-slate-500 py-6 text-[10px]">
                          Click a block on the <strong className="text-slate-400">Scenes</strong> track below to edit its transitions & animations.
                        </div>
                      )}
                    </div>

                    {/* Multi-layer Overlays Panel */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Media Overlays
                      </h4>
                      
                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Built-in quick buttons */}
                          <Button size="sm" variant="outline" onClick={() => handleAddOverlay("Logo", { label: "Brand Logo" })} className="bg-slate-900 border-slate-800 text-[10px]">
                            + Logo
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAddOverlay("Watermark", { label: "CONFIDENTIAL" })} className="bg-slate-900 border-slate-800 text-[10px]">
                            + Watermark
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAddOverlay("CTA Button", { label: "Click Link", text: "Buy Now" })} className="bg-slate-900 border-slate-800 text-[10px]">
                            + CTA Button
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAddOverlay("Sticker", { label: "Sales Sticker" })} className="bg-slate-900 border-slate-800 text-[10px]">
                            + Sticker
                          </Button>
                        </div>

                        {/* Upload Logo/Watermark files */}
                        <div className="space-y-2 border-t border-slate-800 pt-3">
                          <Label className="text-[10px] text-slate-400">Upload custom PNG/SVG logo</Label>
                          <input
                            type="file"
                            accept=".png,.svg"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const ext = file.name.endsWith(".svg") ? "svg" : "png";
                              
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = async () => {
                                const base64 = (reader.result as string).split(",")[1];
                                await handleAddOverlay(ext === "svg" ? "SVG Overlay" : "PNG Overlay", {
                                  label: file.name,
                                  fileData: base64,
                                  fileExt: ext
                                });
                              };
                            }}
                            className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-2 py-1 outline-none text-slate-400 file:mr-2 file:bg-purple-950 file:border-none file:text-[9px] file:text-purple-300 file:px-2 file:py-0.5 file:rounded"
                          />
                        </div>

                        {/* Emoji & Stickers Quick Library */}
                        <div className="space-y-1.5 border-t border-slate-800 pt-3">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Quick Emoji Add</p>
                          <div className="flex gap-1.5">
                            {["🔥", "🚀", "⚡", "😍", "🎉", "💡"].map(em => (
                              <button
                                key={em}
                                onClick={() => handleAddOverlay("Emoji", { label: em, text: em })}
                                className="w-7 h-7 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center text-xs"
                              >{em}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* ── TIMELINE TRACK SYSTEM ─────────────────────────────────── */}
                <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-b border-slate-900 pb-2">
                    <span className="font-bold uppercase text-slate-400">Timeline Editor tracks</span>
                    <div className="flex items-center gap-3">
                      <span>Total Time: {tracks.scenes.reduce((sum: number, s: any) => sum + s.duration, 0).toFixed(1)}s</span>
                      <Button size="sm" variant="ghost" onClick={handleUndo} disabled={undoStack.length === 0} className="h-6 text-[10px] text-slate-400 hover:text-slate-200">Undo</Button>
                      <Button size="sm" variant="ghost" onClick={handleRedo} disabled={redoStack.length === 0} className="h-6 text-[10px] text-slate-400 hover:text-slate-200">Redo</Button>
                    </div>
                  </div>

                  <div className="space-y-3 pr-1 overflow-x-auto">
                    {/* 1. SCENES TRACK */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-right text-[10px] font-bold text-purple-400 font-mono uppercase">Scenes</div>
                      <div className="flex-1 flex gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-900 overflow-x-auto min-w-[500px]">
                        {tracks.scenes.map((s: any, idx: number) => {
                          const isSelected = selectedBlock?.track === "scenes" && selectedBlock.id === s.id;
                          return (
                            <div
                              key={s.id}
                              style={{ width: `${s.duration * (timelineZoom * 0.12)}px` }}
                              onClick={() => {
                                setSelectedBlock({ track: "scenes", id: s.id });
                                setActiveSceneIdx(idx);
                              }}
                              className={`h-16 rounded-lg relative cursor-pointer border select-none shrink-0 transition-all ${
                                isSelected ? "border-purple-500 bg-purple-950/40" : "border-slate-800 bg-slate-950 hover:bg-slate-900"
                              } ${s.hidden ? "opacity-30" : "opacity-100"}`}
                            >
                              <div className="absolute top-1.5 left-2 right-2 flex justify-between text-[9px] font-bold truncate text-slate-200">
                                <span>S{idx + 1} ({s.duration.toFixed(1)}s)</span>
                                <div className="flex gap-1">
                                  {s.locked && <span className="text-red-400">🔒</span>}
                                  {s.hidden && <span className="text-slate-400">👁️</span>}
                                </div>
                              </div>
                              
                              {/* Scene label/title text */}
                              <div className="absolute bottom-1.5 left-2 right-2 text-[9px] text-slate-500 truncate">{s.label}</div>

                              {/* Rearrange triggers */}
                              <div className="absolute bottom-1 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); swapScenes(idx, idx - 1); }} className="w-4 h-4 bg-slate-800 rounded text-[9px] hover:bg-slate-700">←</button>
                                <button onClick={(e) => { e.stopPropagation(); swapScenes(idx, idx + 1); }} className="w-4 h-4 bg-slate-800 rounded text-[9px] hover:bg-slate-700">→</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. SUBTITLES TRACK */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-right text-[10px] font-bold text-pink-400 font-mono uppercase">Subtitles</div>
                      <div className="flex-1 flex gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-900 overflow-x-auto min-w-[500px]">
                        {tracks.subtitles.map((sub: any) => {
                          const isSelected = selectedBlock?.track === "subtitles" && selectedBlock.id === sub.id;
                          return (
                            <div
                              key={sub.id}
                              style={{ width: `${sub.duration * (timelineZoom * 0.12)}px` }}
                              onClick={() => setSelectedBlock({ track: "subtitles", id: sub.id })}
                              className={`h-8 rounded-lg relative cursor-pointer border select-none shrink-0 transition-all ${
                                isSelected ? "border-pink-500 bg-pink-950/40" : "border-slate-850 bg-slate-950 hover:bg-slate-900"
                              } ${sub.hidden ? "opacity-35" : "opacity-100"}`}
                            >
                              <div className="absolute inset-x-2 inset-y-1.5 flex justify-between items-center text-[9px] font-semibold text-slate-300">
                                <span className="truncate">{sub.label}</span>
                                <span className="text-[8px] text-slate-500 shrink-0 font-mono">{sub.duration.toFixed(1)}s</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. VOICEOVER TRACK */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-right text-[10px] font-bold text-emerald-400 font-mono uppercase">Voiceover</div>
                      <div className="flex-1 flex gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-900 overflow-x-auto min-w-[500px]">
                        {tracks.voice.map((v: any) => {
                          const isSelected = selectedBlock?.track === "voice" && selectedBlock.id === v.id;
                          return (
                            <div
                              key={v.id}
                              style={{ width: `${v.duration * (timelineZoom * 0.12)}px` }}
                              onClick={() => setSelectedBlock({ track: "voice", id: v.id })}
                              className={`h-8 rounded-lg relative cursor-pointer border select-none shrink-0 transition-all ${
                                isSelected ? "border-emerald-500 bg-emerald-950/40" : "border-slate-850 bg-slate-950 hover:bg-slate-900"
                              } ${v.hidden ? "opacity-35" : "opacity-100"}`}
                            >
                              <div className="absolute inset-x-2 inset-y-1.5 flex justify-between items-center text-[9px] font-semibold text-slate-300">
                                <span className="truncate">🎙️ {v.label}</span>
                                <span className="text-[8px] text-slate-500 shrink-0 font-mono">{v.duration.toFixed(1)}s</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. MUSIC TRACK */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-right text-[10px] font-bold text-blue-400 font-mono uppercase">Music</div>
                      <div className="flex-1 flex gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-900 overflow-x-auto min-w-[500px]">
                        {tracks.music.map((m: any) => {
                          const isSelected = selectedBlock?.track === "music" && selectedBlock.id === m.id;
                          return (
                            <div
                              key={m.id}
                              style={{ width: `${m.duration * (timelineZoom * 0.12)}px` }}
                              onClick={() => setSelectedBlock({ track: "music", id: m.id })}
                              className={`h-8 rounded-lg relative cursor-pointer border select-none shrink-0 transition-all ${
                                isSelected ? "border-blue-500 bg-blue-950/40" : "border-slate-850 bg-slate-950 hover:bg-slate-900"
                              } ${m.hidden ? "opacity-35" : "opacity-100"}`}
                            >
                              <div className="absolute inset-x-2 inset-y-1.5 flex justify-between items-center text-[9px] font-semibold text-slate-300">
                                <span className="truncate">🎵 {m.label}</span>
                                <span className="text-[8px] text-slate-500 shrink-0 font-mono">{m.duration.toFixed(1)}s</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. OVERLAYS TRACK */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-right text-[10px] font-bold text-pink-500 font-mono uppercase">Overlays</div>
                      <div className="flex-1 flex gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-900 overflow-x-auto min-w-[500px]">
                        {tracks.overlays.length > 0 ? (
                          tracks.overlays.map((ov: any) => {
                            const isSelected = selectedBlock?.track === "overlays" && selectedBlock.id === ov.id;
                            return (
                              <div
                                key={ov.id}
                                style={{ width: `${ov.duration * (timelineZoom * 0.12)}px` }}
                                onClick={() => setSelectedBlock({ track: "overlays", id: ov.id })}
                                className={`h-8 rounded-lg relative cursor-pointer border select-none shrink-0 transition-all ${
                                  isSelected ? "border-pink-500 bg-pink-950/40" : "border-slate-850 bg-slate-950 hover:bg-slate-900"
                                } ${ov.hidden ? "opacity-35" : "opacity-100"}`}
                              >
                                <div className="absolute inset-x-2 inset-y-1.5 flex justify-between items-center text-[9px] font-semibold text-slate-300">
                                  <span className="truncate">📍 {ov.label}</span>
                                  <span className="text-[8px] text-slate-500 shrink-0 font-mono">{ov.duration.toFixed(1)}s</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="h-8 rounded-lg bg-slate-900/40 flex-1 flex items-center justify-center text-[9px] text-slate-600 font-mono">
                            No active overlays loaded. Use the overlays panel above to add Logo or emojis.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary track actions bar */}
                  {selectedBlock && (
                    <div className="flex gap-2 items-center bg-slate-900/80 p-2.5 rounded-xl border border-slate-850 text-xs text-slate-300">
                      <span className="font-bold text-purple-400 uppercase text-[9px] font-mono mr-2">Track Editor:</span>
                      <Button size="sm" variant="outline" onClick={() => toggleLock(selectedBlock.track, selectedBlock.id)} className="h-7 text-[10px] bg-slate-950 border-slate-800">
                        Lock / Unlock
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleHide(selectedBlock.track, selectedBlock.id)} className="h-7 text-[10px] bg-slate-950 border-slate-800">
                        Hide / Show
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSplitBlock(selectedBlock.track, selectedBlock.id)} className="h-7 text-[10px] bg-slate-950 border-slate-800">
                        Split Block
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleMergeBlocks(selectedBlock.track)} className="h-7 text-[10px] bg-slate-950 border-slate-800">
                        Merge Adjacent
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => {
                          const list = tracks[selectedBlock.track] || [];
                          const item = list.find((b: any) => b.id === selectedBlock.id);
                          if (item) {
                            const cloned = { ...item, id: `${item.id}-dup-${Date.now()}`, label: `${item.label} (Copy)` };
                            pushToHistory({ ...tracks, [selectedBlock.track]: [...list, cloned] });
                            toast.success("Duplicated block");
                          }
                        }}
                        className="h-7 text-[10px] bg-slate-950 border-slate-800"
                      >
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => {
                          const updated = {
                            ...tracks,
                            [selectedBlock.track]: (tracks[selectedBlock.track] || []).filter((b: any) => b.id !== selectedBlock.id)
                          };
                          pushToHistory(updated);
                          setSelectedBlock(null);
                          toast.success("Deleted block");
                        }}
                        className="h-7 text-[10px] hover:bg-red-950 hover:text-red-300 border-slate-850"
                      >
                        Delete
                      </Button>
                    </div>
                  )}

                </div>
              </CardContent>

              {/* Step Navigation footer */}
              <div className="flex justify-between p-4 border-t border-slate-800/40 bg-slate-950/60">
                <Button variant="outline" onClick={() => { stopPlayback(); setCurrentStep(8); }} className="bg-slate-900 border-slate-800">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    stopPlayback();
                    localStorage.setItem("saadhyam_video_project", JSON.stringify({
                      brand, config, script, scenes, voice, captions, musicTrack, renderedVideo, music, mixedAudioUrl
                    }));
                    setCurrentStep(10);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold"
                >
                  Go to Exports
                </Button>
              </div>
            </Card>
          );
        })()}
                <Button
                  onClick={() => {
                    stopPlayback();
                    localStorage.setItem("saadhyam_video_project", JSON.stringify({
                      brand, config, script, scenes, voice, captions, musicTrack, renderedVideo, music, mixedAudioUrl
                    }));
                    setCurrentStep(10);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                >
                  Go to Exports
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 10: EXPORT & HISTORIES */}
        {currentStep === 10 && (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <span>📂 Exporter & Project Logs</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Export video script copies, download storyboards, and view logs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Download Assets</h4>
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    onClick={handleCopyScriptText}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4 text-purple-400" />
                    Copy Scripts
                  </Button>
                  <Button
                    onClick={handleDownloadTxt}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    Download TXT
                  </Button>
                  <Button
                    onClick={handleDownloadCsv}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-purple-400" />
                    Download CSV
                  </Button>
                  <Button
                    onClick={handleSaveProject}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 px-6"
                  >
                    <Save className="w-4 h-4 text-pink-400" />
                    Save Project
                  </Button>
                </div>
              </div>

              {/* History panel */}
              <div className="space-y-3 border-t border-slate-800/65 pt-6">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Saved Project Logs ({history.length})
                </div>

                {history.length > 0 ? (
                  <div className="grid gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {history.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => {
                          setBrand(project.brand);
                          setConfig(project.config);
                          setScript(project.script);
                          const normalized = (project.scenes || []).map((s: any) => ({
                            ...s,
                            imageUrl: normalizeImageUrl(s.imageUrl)
                          }));
                          setScenes(normalized);
                          setVoice(project.voice);
                          setCaptions(project.captions);
                          setMusicTrack(project.musicTrack);
                          toast.success("Project loaded successfully!");
                        }}
                        className="bg-slate-950 border border-slate-800 hover:border-purple-900/50 hover:bg-slate-900/50 p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 group"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold bg-purple-950/60 border border-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                              {project.config.platform} - {project.config.videoType}
                            </span>
                            <span className="text-[10px] text-slate-500">{project.timestamp}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400 truncate">
                            Company: {project.brand.businessName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate font-mono">
                            Script Title: {project.script.title || "No Title"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500">
                    <p className="text-xs">No saved project histories found. Save projects to accumulate records.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-slate-800/50 pt-4 mt-2">
                <Button variant="outline" onClick={() => setCurrentStep(9)} className="bg-slate-900 border-slate-800">
                  Back to Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

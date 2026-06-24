import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  User,
  Sparkles,
  Volume2,
  Settings,
  AlertCircle,
  TrendingUp,
  Loader2,
  Plus,
  Trash,
  Upload,
  Check,
  X,
  Calendar,
  Layers,
  FileText,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  HelpCircle,
} from "lucide-react";
import { env } from "@/config/env";
import voiceAgentCss from "./voice-agent.css?url";

type RazorpayResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => { open: () => void };
};

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

const WIZARD_PRESETS = [
  {
    label: "Admissions Counselor",
    role: "Admission Counsellor",
    name: "Swetha",
    languages: "te,en",
    voice_id: "hpp4J3VqNfWAUOO0d1Us",
    whatsapp_threshold: 70,
    prompt: "You are Swetha, a 23-year-old admissions counsellor at Mentneo Coaching. Keep your tone polite and friendly. Answer in conversational Telugu and English, mixing them naturally (Code-switching). Your goal is to understand the student's background, explain our AI Video Creation and Digital Marketing packages, answer their questions, and send them the course brochure on WhatsApp."
  },
  {
    label: "Sales Rep (Hinglish)",
    role: "Sales Representative",
    name: "Rahul",
    languages: "hi,en",
    voice_id: "uavKGt8JpB2lo1bcty9J",
    whatsapp_threshold: 65,
    prompt: "You are Rahul, a friendly and energetic sales representative for Mentneo. Speak in conversational Hindi and English (Hinglish), mixing them naturally. Answer their questions warmly, gauge their interest, and offer to send them our business brochure on WhatsApp."
  },
  {
    label: "Customer Support",
    role: "Customer Support Agent",
    name: "Sneha",
    languages: "en",
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    whatsapp_threshold: 80,
    prompt: "You are Sneha, a highly professional customer support representative. Keep your tone polite, patient, and direct. Answer questions clearly in English. Resolve customer concerns, log their feedback, and trigger the support document brochure on WhatsApp if requested."
  }
];

const VOICE_PRESETS = [
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella (Multilingual)",
    gender: "Female",
    desc: "Warm & Professional",
    url: "https://storage.googleapis.com/eleven-public-prod/previews/EXAVITQu4vr4xnSDxMaL.mp3"
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel (US Accent)",
    gender: "Female",
    desc: "Conversational & Bright",
    url: "https://storage.googleapis.com/eleven-public-prod/previews/21m00Tcm4TlvDq8ikWAM.mp3"
  },
  {
    id: "uavKGt8JpB2lo1bcty9J",
    name: "Rahul (Indian Accent)",
    gender: "Male",
    desc: "Warm & Energetic",
    url: "https://storage.googleapis.com/eleven-public-prod/previews/uavKGt8JpB2lo1bcty9J.mp3"
  },
  {
    id: "pNInz6obpg7j8jsG4bU3",
    name: "Arnold (Ad Voice)",
    gender: "Male",
    desc: "Deep & Narrative",
    url: "https://storage.googleapis.com/eleven-public-prod/previews/pNInz6obpg7j8jsG4bU3.mp3"
  }
];

const LANGUAGE_OPTIONS = [
  { code: "te", label: "Telugu" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
];

export const Route = createFileRoute("/dashboard/voice-agent/")({
  head: () => ({
    meta: [{ title: "AI Voice Agent — Saadhyam AI" }],
    links: [{ rel: "stylesheet", href: voiceAgentCss }],
  }),
  component: VoiceAgentDashboard,
});

function VoiceAgentDashboard() {
  const loadRazorpayScript = async () => {
    if ((window as RazorpayWindow).Razorpay) return true;

    return await new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // ================= STATE MODULES =================
  const [agents, setAgents] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    total_calls: 0,
    connected_calls: 0,
    answered_calls: 0,
    hot_leads: 0,
    warm_leads: 0,
    nurture_leads: 0,
    cold_leads: 0,
    conversion_rate: 0,
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isFallbackData, setIsFallbackData] = useState(false);

  // Forms / Modals
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "",
    prompt: "",
    voice_id: "hpp4J3VqNfWAUOO0d1Us",
    languages: "te,en",
    whatsapp_threshold: 70,
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [customVoiceEnabled, setCustomVoiceEnabled] = useState(false);

  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    objective: "",
    agent_id: "",
    status: "active",
  });
  const [campaignFilter, setCampaignFilter] = useState<
    "all" | "active" | "paused" | "completed" | "draft" | "archived" | "trash"
  >("all");
  const [trashedCampaigns, setTrashedCampaigns] = useState<any[]>([]);
  const [archivedCampaigns, setArchivedCampaigns] = useState<any[]>([]);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    language: "te",
    campaign_id: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedCallLog, setSelectedCallLog] = useState<any | null>(null);

  // ================= VOICE CALL OVERLAY STATE =================
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [chatLog, setChatLog] = useState<any[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [activeCallLead, setActiveCallLead] = useState<any | null>(null);
  const [activeCallCampaign, setActiveCallCampaign] = useState<any | null>(null);
  const [postCallReport, setPostCallReport] = useState<any | null>(null);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isUploadingLeads, setIsUploadingLeads] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [actionCampaignId, setActionCampaignId] = useState<number | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);

  // ================= SAAS BILLING & WALLET STATE =================
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [areaCode, setAreaCode] = useState("");
  const [searchingNumbers, setSearchingNumbers] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [recharging, setRecharging] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("500.00");
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);

  const handleSearchNumbers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchingNumbers(true);
    try {
      const url = areaCode
        ? `${env.apiBaseUrl}/api/voice-agent/billing/numbers/search?area_code=${areaCode}`
        : `${env.apiBaseUrl}/api/voice-agent/billing/numbers/search`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableNumbers(data);
        if (data.length === 0) {
          showToast("info", "No available phone numbers found for this area code.");
        }
      } else {
        showToast("error", "Failed to search phone numbers.");
      }
    } catch {
      showToast("error", "Error connecting to number search API.");
    } finally {
      setSearchingNumbers(false);
    }
  };

  const handleBuyNumber = async (phoneNumber: string) => {
    if (!confirm(`Are you sure you want to lease/purchase ${phoneNumber} for ₹250.00?`)) return;
    setBuyingNumber(phoneNumber);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/billing/numbers/buy`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message || `Successfully leased ${phoneNumber}!`);
        fetchAllOnce();
        setAvailableNumbers([]);
      } else {
        showToast("error", data.detail || "Failed to purchase number.");
      }
    } catch {
      showToast("error", "Error connecting to purchase API.");
    } finally {
      setBuyingNumber(null);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("error", "Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      showToast("error", "Razorpay key is missing from the environment.");
      return;
    }

    setRecharging(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("error", "Unable to load Razorpay checkout script.");
        setRecharging(false);
        return;
      }

      const RazorpayCtor = (window as RazorpayWindow).Razorpay;
      if (!RazorpayCtor) {
        showToast("error", "Razorpay checkout is not available.");
        setRecharging(false);
        return;
      }

      const razorpay = new RazorpayCtor({
        key: RAZORPAY_KEY_ID,
        amount: amt * 100, // Razorpay amount in paise/cents
        currency: "INR",
        name: "Saadhyam AI",
        description: `Wallet top-up of ₹${amt.toFixed(2)}`,
        prefill: {
          name: currentUser?.name || "Saadhyam Customer",
          email: currentUser?.email || "customer@example.com",
        },
        theme: {
          color: "#7c3aed",
        },
        handler: (response) => {
          void (async () => {
            try {
              const paymentId = response.razorpay_payment_id || response.razorpay_order_id || `razorpay-${Date.now()}`;
              const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/billing/topup`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ amount: amt, payment_id: paymentId }),
              });
              const data = await res.json();
              if (res.ok) {
                showToast("success", data.message || `Successfully charged ₹${amt.toFixed(2)}!`);
                fetchAllOnce();
                setRechargeAmount("");
              } else {
                showToast("error", data.detail || "Failed to recharge wallet.");
              }
            } catch {
              showToast("error", "Error connecting to top-up API.");
            } finally {
              setRecharging(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setRecharging(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      showToast("error", "Unable to start Razorpay payment.");
      setRecharging(false);
    }
  };

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const autoListenTimeoutRef = useRef<any>(null);
  const callDurationRef = useRef<any>(null);
  const audioSafetyTimeoutRef = useRef<any>(null);

  const sessionActiveRef = useRef(false);
  const isPlayingAudioRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isFetchingRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<any[]>([]);
  const micProcessorRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // ================= LIFECYCLE & FETCHING =================
  useEffect(() => {
    console.log("🧩 Voice Agent Studio Mounted");
    fetchAllOnce();
    const interval = setInterval(() => {
      console.log("🧩 Polling fetchAllOnce interval triggered");
      fetchAllOnce();
    }, 5000);
    return () => {
      console.log("🧩 Voice Agent Studio Unmounted");
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog, isProcessing]);

  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (autoListenTimeoutRef.current) clearTimeout(autoListenTimeoutRef.current);
      if (callDurationRef.current) clearInterval(callDurationRef.current);
    };
  }, []);

  // Headers helpers for Auth
  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("saadhyam_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const getAuthHeadersOnly = (): HeadersInit => {
    const token = localStorage.getItem("saadhyam_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const LOCALSTORAGE_KEY = "voice_agent_dashboard_last_good";

  const fetchAllOnce = async (showLoader = false) => {
    if (isFetchingRef.current) {
      console.log("🧩 fetchAllOnce blocked - already fetching");
      return;
    }
    isFetchingRef.current = true;
    console.log("🧩 fetchAllOnce starting... showLoader:", showLoader, "isLoadingDashboard:", isLoadingDashboard);
    if (showLoader) {
      setIsLoadingDashboard(true);
    }
    setIsFallbackData(false);
    try {
      const headers = getHeaders();
      const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/dashboard/overview`, { headers });
      if (!res.ok) throw new Error(`dashboard overview failed: ${res.status}`);
      const payload = await res.json();

      setAnalytics(payload.analytics || {});
      setAgents(payload.agents || []);
      setCampaigns(payload.campaigns || []);
      setTrashedCampaigns(payload.trashed_campaigns || []);
      setArchivedCampaigns(payload.archived_campaigns || []);
      setLeads(payload.leads || []);
      setCallLogs(payload.sessions || []);
      setCurrentUser(payload.user || null);

      console.log("🧩 fetchAllOnce successfully retrieved payload:", payload);

      // persist last-known-good snapshot
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to persist dashboard snapshot", e);
      }

      setIsLoadingDashboard(false);
      setIsFallbackData(false);
    } catch (err) {
      console.error("🧩 fetchAllOnce failed with error:", err);
      // try to use last-known-good
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_KEY);
        if (raw) {
          const snap = JSON.parse(raw);
          setAnalytics(snap.analytics || {});
          setAgents(snap.agents || []);
          setCampaigns(snap.campaigns || []);
          setTrashedCampaigns(snap.trashed_campaigns || []);
          setArchivedCampaigns(snap.archived_campaigns || []);
          setLeads(snap.leads || []);
          setCallLogs(snap.sessions || []);
          setCurrentUser(snap.user || null);
          setIsFallbackData(true);
          console.log("🧩 fetchAllOnce loaded fallback data from localStorage");
        }
      } catch (e) {
        console.warn("Failed to load fallback snapshot", e);
      }
      setIsLoadingDashboard(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const showToast = (type: "success" | "error" | "info", msg: string) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else if (type === "info") {
      setInfoMsg(msg);
      setTimeout(() => setInfoMsg(""), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  // API Call Helpers
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/analytics/overview`, {
        headers: getHeaders(),
      });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/agents`, {
        headers: getHeaders(),
      });
      if (res.ok) setAgents(await res.json());
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      // Fetch active+paused+draft+completed (non-deleted, non-archived)
      const [mainRes, trashRes, archRes] = await Promise.all([
        fetch(`${env.apiBaseUrl}/api/campaigns`, { headers: getHeaders() }),
        fetch(`${env.apiBaseUrl}/api/campaigns?view=trash`, { headers: getHeaders() }),
        fetch(`${env.apiBaseUrl}/api/campaigns?status=archived`, { headers: getHeaders() }),
      ]);
      if (mainRes.ok) setCampaigns(await mainRes.json());
      if (trashRes.ok) setTrashedCampaigns(await trashRes.json());
      if (archRes.ok) setArchivedCampaigns(await archRes.json());
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  const patchCampaignStatus = async (id: number, status: string) => {
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast("success", `Campaign ${status === "active" ? "resumed" : status}`);
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to update campaign status");
    } finally {
      setActionCampaignId(null);
    }
  };

  const archiveCampaign = async (id: number) => {
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}/archive`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Campaign archived");
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to archive campaign");
    } finally {
      setActionCampaignId(null);
    }
  };

  const duplicateCampaign = async (id: number) => {
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}/duplicate`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Campaign duplicated!");
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to duplicate campaign");
    } finally {
      setActionCampaignId(null);
    }
  };

  const softDeleteCampaign = async (id: number) => {
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("info", "Campaign moved to Trash");
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to delete campaign");
    } finally {
      setActionCampaignId(null);
    }
  };

  const permanentDeleteCampaign = async (id: number) => {
    if (!confirm("Permanently delete this campaign? This cannot be undone.")) return;
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}?permanent=true`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Campaign permanently deleted");
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to permanently delete");
    } finally {
      setActionCampaignId(null);
    }
  };

  const restoreCampaign = async (id: number) => {
    setActionCampaignId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns/${id}/restore`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Campaign restored!");
        await fetchCampaigns();
      }
    } catch {
      showToast("error", "Failed to restore campaign");
    } finally {
      setActionCampaignId(null);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leads`, {
        headers: getHeaders(),
      });
      if (res.ok) setLeads(await res.json());
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/sessions`, {
        headers: getHeaders(),
      });
      if (res.ok) setCallLogs(await res.json());
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  // CRUD Actions
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.role || !newAgent.prompt) {
      showToast("error", "Please fill in Name, Role and Prompt.");
      return;
    }
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/agents`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newAgent),
      });
      if (res.ok) {
        showToast("success", "AI Agent created successfully.");
        setNewAgent({
          name: "",
          role: "",
          prompt: "",
          voice_id: "hpp4J3VqNfWAUOO0d1Us",
          languages: "te,en",
          whatsapp_threshold: 70,
        });
        setWizardStep(1);
        setCustomVoiceEnabled(false);
        if (audioPlayer) {
          audioPlayer.pause();
          setPlayingVoiceId(null);
        }
        fetchAgents();
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    }
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this AI Agent?")) return;
    setDeletingAgentId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/agents/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Agent deleted.");
        await fetchAgents();
      }
    } catch (err) {
      showToast("error", "Error deleting agent.");
    } finally {
      setDeletingAgentId(null);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingCampaign) return;
    if (!newCampaign.name || !newCampaign.agent_id) {
      showToast("error", "Campaign Name and AI Agent are required.");
      return;
    }
    setIsCreatingCampaign(true);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        showToast("success", "Campaign created.");
        setNewCampaign({ name: "", objective: "", agent_id: "", status: "active" });
        fetchCampaigns();
      } else {
        showToast("error", "Failed to create campaign.");
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingLead) return;
    if (!newLead.name || !newLead.phone) {
      showToast("error", "Name and Phone Number are required.");
      return;
    }
    setIsCreatingLead(true);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leads`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newLead),
      });
      if (res.ok) {
        showToast("success", "Lead created successfully.");
        setNewLead({ name: "", phone: "", language: "te", campaign_id: "" });
        fetchLeads();
        fetchAnalytics();
      } else {
        showToast("error", "Failed to create lead.");
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setDeletingLeadId(id);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leads/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Lead deleted.");
        await fetchLeads();
        await fetchAnalytics();
      }
    } catch (err) {
      showToast("error", "Error deleting lead.");
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingLeads) return;
    if (!csvFile || !selectedCampaignId) {
      showToast("error", "Select a Campaign and choose a CSV file.");
      return;
    }
    setIsUploadingLeads(true);
    const formData = new FormData();
    formData.append("campaign_id", selectedCampaignId);
    formData.append("file", csvFile);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leads/upload`, {
        method: "POST",
        headers: getAuthHeadersOnly(),
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        showToast("success", data.message || "Leads imported.");
        setCsvFile(null);
        fetchLeads();
        fetchAnalytics();
      } else {
        const err = await res.json();
        showToast("error", err.detail || "Failed to parse CSV.");
      }
    } catch (err) {
      showToast("error", "Error uploading CSV.");
    } finally {
      setIsUploadingLeads(false);
    }
  };

  // ================= BROWSER TELECALLING ENGINE =================
  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioSafetyTimeoutRef.current) {
      clearTimeout(audioSafetyTimeoutRef.current);
      audioSafetyTimeoutRef.current = null;
    }
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
    interruptAssistantPlayback();
  };

  const interruptAssistantPlayback = () => {
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
  };

  const playPCMChunk = (base64Data: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) {
      nextPlayTimeRef.current = now;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;

    scheduledSourcesRef.current.push(source);
    source.onended = () => {
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source);
      if (scheduledSourcesRef.current.length === 0) {
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
      }
    };

    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;
  };

  const browserSpeak = (text: string, onEndCallback: (() => void) | null = null) => {
    if (!window.speechSynthesis || !text) {
      if (onEndCallback) onEndCallback();
      return;
    }

    stopAudio();
    const utterance = new SpeechSynthesisUtterance(text);

    // Dynamically assign voice dialect based on lead language configuration
    const leadLang = activeCallLead?.language || "te";
    if (leadLang === "te") {
      utterance.lang = "te-IN";
    } else if (leadLang === "hi") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.05; // Calm but natural upbeat rate
    utterance.pitch = 1.3; // Elevated high pitch
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()),
    );
    if (matchVoice) utterance.voice = matchVoice;

    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;

    let callbackCalled = false;
    const triggerEnd = () => {
      if (callbackCalled) return;
      callbackCalled = true;
      if (audioSafetyTimeoutRef.current) {
        clearTimeout(audioSafetyTimeoutRef.current);
        audioSafetyTimeoutRef.current = null;
      }
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      if (onEndCallback) onEndCallback();
    };

    utterance.onend = () => {
      triggerEnd();
    };
    utterance.onerror = () => {
      triggerEnd();
    };

    // Safety timeout: Chrome's Web Speech API sometimes hangs and doesn't fire onend.
    const safetyDuration = Math.max(5000, text.length * 150 + 4000);
    audioSafetyTimeoutRef.current = setTimeout(() => {
      console.warn("SpeechSynthesis safety timeout triggered - forcing end callback");
      window.speechSynthesis.cancel();
      triggerEnd();
    }, safetyDuration);

    window.speechSynthesis.speak(utterance);
  };

  const playAudio = (
    url: string,
    onEndCallback: (() => void) | null = null,
    fallbackText: string = "",
  ) => {
    stopAudio();
    if (!sessionActiveRef.current) {
      if (onEndCallback) onEndCallback();
      return;
    }

    if (!url) {
      if (fallbackText) {
        browserSpeak(fallbackText, onEndCallback);
      } else {
        if (onEndCallback) onEndCallback();
      }
      return;
    }

    const audio = new Audio(`${env.apiBaseUrl}${url}`);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;

    let callbackCalled = false;
    const triggerEnd = () => {
      if (callbackCalled) return;
      callbackCalled = true;
      if (audioSafetyTimeoutRef.current) {
        clearTimeout(audioSafetyTimeoutRef.current);
        audioSafetyTimeoutRef.current = null;
      }
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      audioRef.current = null;
      if (onEndCallback) onEndCallback();
    };

    audio.play().catch((err) => {
      console.error("Audio playback error, falling back to Web Speech Synthesis:", err);
      // Reset playing state from the failed Audio element before browserSpeak sets its own
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
      audioRef.current = null;
      if (fallbackText) {
        browserSpeak(fallbackText, onEndCallback);
      } else {
        triggerEnd();
      }
    });

    audio.onended = () => {
      triggerEnd();
    };

    // Safety timeout to release audio player lock if onended doesn't fire.
    const safetyTextLength = fallbackText ? fallbackText.length : 100;
    const safetyDuration = Math.max(8000, safetyTextLength * 150 + 5000);
    audioSafetyTimeoutRef.current = setTimeout(() => {
      console.warn("Audio playback safety timeout triggered - forcing end callback");
      try {
        audio.pause();
      } catch (e) {}
      triggerEnd();
    }, safetyDuration);
  };

  const handleStartBrowserCall = async (lead: any) => {
    const currentBalance = currentUser?.wallet_balance !== undefined ? currentUser.wallet_balance : 0;
    if (currentBalance < 100.00) {
      showToast("error", `Insufficient Balance. A minimum balance of ₹100.00 is required to place or simulate calls. Current balance: ₹${currentBalance.toFixed(2)}.`);
      setActiveTab("billing");
      return;
    }

    let campaign = null;
    if (lead.campaign_id) {
      campaign = campaigns.find((c) => c.id === lead.campaign_id);
    }

    setActiveCallLead(lead);
    setActiveCallCampaign(campaign);
    setPostCallReport(null);
    setChatLog([]);
    setCallDuration(0);
    setTranscriptExpanded(false);

    setIsProcessing(true);
    isProcessingRef.current = true;
    setSessionActive(true);
    sessionActiveRef.current = true;

    callDurationRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    try {
      const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/start`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          customer_name: lead.name,
          lead_id: lead.id,
          campaign_id: lead.campaign_id || null,
        }),
      });
      if (!sessionActiveRef.current) return;

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = lead.language === "hi" ? "hi-IN" : lead.language === "en" ? "en-US" : "te-IN";

          rec.onresult = (e: any) => {
            const result = e.results[e.results.length - 1];
            const text = result[0].transcript.trim();
            if (result.isFinal && text) {
              setChatLog((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "user") {
                  return [...prev.slice(0, -1), { role: "user", text }];
                } else {
                  return [...prev, { role: "user", text }];
                }
              });
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "user_transcript", text }));
              }
            }
          };
          rec.start();
          recognitionRef.current = rec;
        }

        const wsUrl = `${env.apiBaseUrl.replace("http", "ws")}/api/voice-agent/live?session_id=${data.session_id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Gemini Live WebSocket opened");
          startRecording();

          const helloText =
            lead.language === "hi" ? "नमस्ते" : lead.language === "en" ? "Hello" : "హలో";
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  text: `User joined the call. Please introduce yourself and start the call as Swetha from ${campaign?.name || "our company"}.`,
                }),
              );
            }
          }, 800);
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === "text") {
            setChatLog((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", text: last.text + msg.text }];
              } else {
                return [...prev, { role: "assistant", text: msg.text }];
              }
            });
          } else if (msg.type === "user_text") {
            setChatLog((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "user") {
                return [...prev.slice(0, -1), { role: "user", text: last.text + msg.text }];
              } else {
                return [...prev, { role: "user", text: msg.text }];
              }
            });
          } else if (msg.type === "audio") {
            playPCMChunk(msg.data);
          } else if (msg.type === "turnComplete") {
            // Handled
          } else if (msg.type === "interrupted") {
            interruptAssistantPlayback();
          } else if (msg.error) {
            showToast("error", msg.error);
          }
        };

        ws.onclose = () => {
          console.log("Gemini Live WebSocket closed");
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
        };
      } else {
        showToast("error", "Failed to start browser voice session.");
        setSessionActive(false);
        sessionActiveRef.current = false;
        if (callDurationRef.current) clearInterval(callDurationRef.current);
      }
    } catch (err) {
      showToast("error", "Error connecting to dialer service.");
      setSessionActive(false);
      sessionActiveRef.current = false;
      if (callDurationRef.current) clearInterval(callDurationRef.current);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleStartRealCall = async (lead: any) => {
    const currentBalance = currentUser?.wallet_balance !== undefined ? currentUser.wallet_balance : 0;
    if (currentBalance < 100.00) {
      showToast("error", `Insufficient Balance. A minimum balance of ₹100.00 is required to place or simulate calls. Current balance: ₹${currentBalance.toFixed(2)}.`);
      setActiveTab("billing");
      return;
    }

    try {
      showToast("info", `Initiating real outbound call to ${lead.name} (${lead.phone})...`);
      const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/leads/${lead.id}/call-real`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Real call successfully triggered! Call SID: ${data.call_sid}`);
      } else {
        showToast("error", data.detail || data.message || "Failed to trigger real call.");
      }
    } catch (err: any) {
      console.error("Error triggering real call:", err);
      showToast("error", "Error connecting to backend API.");
    }
  };

  const handleEndBrowserCall = async () => {
    const activeSessionId = sessionId;

    setSessionActive(false);
    sessionActiveRef.current = false;
    setSessionId(null);
    if (callDurationRef.current) clearInterval(callDurationRef.current);

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: "end_call" }));
      } catch (e) {}
      wsRef.current.close();
      wsRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    stopAudio();
    stopRecording();
    if (autoListenTimeoutRef.current) clearTimeout(autoListenTimeoutRef.current);

    if (!activeSessionId) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const formData = new FormData();
      formData.append("session_id", activeSessionId);
      const res = await fetch(`${env.apiBaseUrl}/api/voice-agent/end`, {
        method: "POST",
        headers: getAuthHeadersOnly(),
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPostCallReport(data);
        fetchAllOnce();
      }
    } catch (err) {
      showToast("error", "Error parsing and finalizing call metrics.");
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const startRecording = async () => {
    if (!sessionActiveRef.current || isRecordingRef.current || isProcessingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const recordCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const source = recordCtx.createMediaStreamSource(stream);
      const processor = recordCtx.createScriptProcessor(2048, 1, 1);

      source.connect(processor);
      processor.connect(recordCtx.destination);

      const startTimestamp = Date.now();

      processor.onaudioprocess = (e) => {
        if (!sessionActiveRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avgVolume = sum / inputData.length;

        if (Date.now() - startTimestamp > 500 && avgVolume > 0.06) {
          if (isPlayingAudioRef.current) {
            console.log("User speaking detected, interrupting assistant.");
            interruptAssistantPlayback();
          }
        }

        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcm16.buffer);
        }
      };

      micProcessorRef.current = { context: recordCtx, processor, source };
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access failed:", err);
      showToast("error", "Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (micProcessorRef.current) {
      try {
        const { processor, source, context } = micProcessorRef.current;
        source.disconnect();
        processor.disconnect();
        context.close();
      } catch (err) {
        console.warn("Failed to clean up mic processor:", err);
      }
      micProcessorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (isPlayingAudio) {
        stopAudio();
      }
      startRecording();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getAvatarState = () => {
    if (isProcessing) return "processing";
    if (isPlayingAudio) return "speaking";
    if (isRecording) return "recording";
    return "idle";
  };

  const getStatusText = () => {
    if (isProcessing) return "AI is thinking...";
    if (isPlayingAudio) return "AI is speaking...";
    if (isRecording) return `Listening... ${formatTime(recordingTime)}`;
    return "Silent - Tap Mic to Speak";
  };

  // ================= RENDERING MODULES =================
  const renderCampaignsSkeleton = () => {
    return (
      <div className="tab-pane animate-fade-in flex flex-col flex-1">
        <div className="tab-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
          <div>
            <div className="h-8 w-64 bg-white/5 rounded-lg mb-2" />
            <div className="h-4 w-96 bg-white/5 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-white/5 rounded" />
                  <div className="h-5 w-16 bg-white/5 rounded-full" />
                </div>
                <div className="h-3 w-48 bg-white/5 rounded" />
                <div className="border-t border-white/5 pt-3 flex justify-between">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-3 w-12 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card p-6 lg:col-span-1 h-fit animate-pulse space-y-4">
            <div className="h-5 w-36 bg-white/5 rounded" />
            <div className="space-y-4 mt-4">
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCRMSkeleton = () => {
    return (
      <div className="tab-pane animate-fade-in flex flex-col flex-1">
        <div className="tab-header animate-pulse">
          <div>
            <div className="h-8 w-64 bg-white/5 rounded-lg mb-2" />
            <div className="h-4 w-96 bg-white/5 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 flex-1">
          <div className="glass-card p-6 lg:col-span-1 h-fit animate-pulse space-y-4">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="space-y-4 mt-4">
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
            </div>
          </div>
          <div className="glass-card p-6 lg:col-span-3 space-y-4 animate-pulse flex-1">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-white/5 rounded" />
              <div className="h-8 w-36 bg-white/5 rounded" />
            </div>
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/5 rounded" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-white/5 rounded" />
                  <div className="h-6 w-16 bg-white/5 rounded" />
                  <div className="h-6 w-8 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallLogsSkeleton = () => {
    return (
      <div className="tab-pane animate-fade-in flex flex-col flex-1">
        <div className="tab-header animate-pulse">
          <div>
            <div className="h-8 w-64 bg-white/5 rounded-lg mb-2" />
            <div className="h-4 w-96 bg-white/5 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
          <div className="glass-card p-6 lg:col-span-2 space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-white/5 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-white/5 rounded" />
                  <div className="h-4 w-16 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6 lg:col-span-1 space-y-4 animate-pulse">
            <div className="h-5 w-24 bg-white/5 rounded" />
            <div className="h-32 bg-white/5 rounded mt-4" />
            <div className="space-y-2 mt-4">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-5/6 bg-white/5 rounded" />
              <div className="h-3 w-4/5 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentsSkeleton = () => {
    return (
      <div className="tab-pane animate-fade-in flex flex-col flex-1">
        <div className="tab-header animate-pulse">
          <div>
            <div className="h-8 w-64 bg-white/5 rounded-lg mb-2" />
            <div className="h-4 w-96 bg-white/5 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
          <div className="glass-card p-6 lg:col-span-1 h-fit animate-pulse space-y-4">
            <div className="h-5 w-36 bg-white/5 rounded" />
            <div className="space-y-4 mt-4">
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-24 bg-white/5 rounded" />
            </div>
          </div>
          <div className="glass-card p-6 lg:col-span-2 space-y-4 animate-pulse">
            <div className="h-5 w-48 bg-white/5 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-white/5 rounded" />
                    <div className="h-4 w-12 bg-white/5 rounded" />
                  </div>
                  <div className="h-16 bg-white/5 rounded" />
                  <div className="h-4 w-20 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBilling = () => {
    return (
      <div className="tab-pane animate-fade-in flex flex-col gap-6">
        <div className="tab-header flex justify-between items-center mb-4">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Billing & SaaS Wallet</h1>
            <p className="text-secondary text-sm">
              Manage your call credits, top up your wallet, and lease dialer caller ID phone numbers.
            </p>
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => fetchAllOnce(true)}>
            <Sparkles size={14} />
            <span>Refresh Balance</span>
          </button>
        </div>

        {currentUser?.wallet_balance !== undefined && currentUser.wallet_balance < 100.00 && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/30 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="text-accent-red mt-0.5" size={16} />
            <div>
              <h4 className="text-xs font-bold text-primary">Low Account Balance Warning</h4>
              <p className="text-[11px] text-secondary leading-normal mt-0.5">
                Your current balance is ₹{currentUser.wallet_balance.toFixed(2)}. A minimum balance of ₹100.00 is required to initiate calling campaigns and run browser simulation calls. Please top up your wallet credits below to restore services.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Wallet Status Card & Quick Top-Up */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Balance Widget Card */}
            <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]" style={{
              background: "linear-gradient(135deg, rgba(74, 158, 255, 0.15) 0%, rgba(179, 136, 255, 0.15) 100%)",
              border: "1px solid rgba(74, 158, 255, 0.3)"
            }}>
              <div>
                <span className="text-secondary text-xs uppercase font-semibold tracking-wider">Total Wallet Credits</span>
                <h2 className="gradient-text text-5xl font-black mt-2">
                  ₹{currentUser?.wallet_balance !== undefined ? currentUser.wallet_balance.toFixed(2) : "0.00"}
                </h2>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary">Active Number:</span>
                  <span className="font-semibold text-primary">{currentUser?.leased_phone_number || "None Leased"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Calling Rate:</span>
                  <span className="text-accent font-semibold">₹8.00 / minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Number Rental:</span>
                  <span className="text-accent-purple font-semibold">₹250.00 / month</span>
                </div>
              </div>
            </div>

            {/* Top Up / Recharge Card */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <span>Recharge Wallet</span>
              </h3>
              
              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["100.00", "500.00", "1000.00"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRechargeAmount(val)}
                    className={`btn text-xs font-semibold py-2 px-3 ${
                      rechargeAmount === val
                        ? "bg-accent/15 text-accent border border-accent/40"
                        : "bg-white/5 text-secondary hover:bg-white/10"
                    }`}
                  >
                    +₹{parseInt(val)}
                  </button>
                ))}
              </div>

              {/* Form Input */}
              <form onSubmit={handleTopup} className="flex flex-col gap-3 mt-2">
                <div className="form-group mb-0">
                  <label className="form-label">Top-Up Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="form-input w-full"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={recharging}
                  className="btn btn-primary w-full mt-2"
                >
                  {recharging ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Processing Recharge...</span>
                    </>
                  ) : (
                    <span>Add Credits</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Twilio Phone Number Search & Purchase (Lease) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-6 flex flex-col gap-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                    <Phone size={16} className="text-accent-purple" />
                    <span>Lease Dialer Numbers</span>
                  </h3>
                  <p className="text-secondary text-xs mt-1">
                    Search and acquire numbers in real-time. Purchased numbers are automatically configured as your Caller ID.
                  </p>
                </div>
                {currentUser?.leased_phone_number && (
                  <div className="bg-accent-green/10 text-accent-green border border-accent-green/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <Check size={12} />
                    <span>Number Active</span>
                  </div>
                )}
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchNumbers} className="flex gap-3 mt-2 items-end">
                <div className="form-group mb-0 flex-1">
                  <label className="form-label">US Area Code (Optional)</label>
                  <input
                    type="text"
                    maxLength={3}
                    pattern="[0-9]*"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ""))}
                    className="form-input w-full"
                    placeholder="e.g. 650, 415, 212"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingNumbers}
                  className="btn btn-secondary flex items-center gap-2 h-[42px] px-6"
                >
                  {searchingNumbers ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Phone size={16} />
                  )}
                  <span>Search Inventory</span>
                </button>
              </form>

              {/* Number Results */}
              <div className="flex-1 flex flex-col justify-center mt-4">
                {searchingNumbers ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 size={36} className="animate-spin text-accent-purple" />
                    <span className="text-secondary text-xs">Querying Twilio Available Inventory...</span>
                  </div>
                ) : availableNumbers.length > 0 ? (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-2">
                    {availableNumbers.map((num) => (
                      <div
                        key={num.phone_number}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-primary">{num.friendly_name}</span>
                          <span className="text-secondary text-[10px] uppercase tracking-wider font-semibold">
                            {num.region}, {num.iso_country} &bull; Local Outbound
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={buyingNumber !== null}
                          onClick={() => handleBuyNumber(num.phone_number)}
                          className="btn btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5"
                          style={{
                            background: "linear-gradient(135deg, var(--accent-purple) 0%, #7C3AED 100%)",
                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                          }}
                        >
                          {buyingNumber === num.phone_number ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Leasing...</span>
                            </>
                          ) : (
                            <span>Lease Number (₹250.00)</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <PhoneOff size={32} className="text-muted mb-3" />
                    <h4 className="text-secondary text-sm font-semibold">No Phone Numbers Loaded</h4>
                    <p className="text-muted text-xs max-w-sm mt-1">
                      Enter an area code and click Search to check live dialer number options.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (isLoadingDashboard) {
      return (
        <div className="tab-pane animate-fade-in flex flex-col flex-1">
          {/* Overview Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 flex flex-col justify-between min-h-[140px] animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-4 w-24 bg-white/5 rounded" />
                  <div className="h-5 w-5 bg-white/5 rounded-full" />
                </div>
                <div className="mt-6 space-y-2">
                  <div className="h-8 w-16 bg-white/5 rounded-lg" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline & Integrations Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
            {/* Lead Pipeline Skeleton */}
            <div className="glass-card p-6 lg:col-span-2 space-y-6 animate-pulse">
              <div className="h-5 w-48 bg-white/5 rounded" />
              <div className="space-y-5 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-36 bg-white/5 rounded" />
                      <div className="h-4 w-8 bg-white/5 rounded" />
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations Skeleton */}
            <div className="glass-card p-6 space-y-4 animate-pulse">
              <div className="h-5 w-40 bg-white/5 rounded" />
              <div className="space-y-3 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-5 w-16 bg-white/10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-secondary text-sm">
              Real-time telecalling metrics and campaign tracking
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => fetchAllOnce(true)}>
            <Sparkles size={16} />
            <span>Sync Data</span>
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start text-secondary">
              <span className="text-sm font-semibold">Total Calls</span>
              <Layers size={18} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary">{analytics.total_calls}</span>
              <p className="text-xs text-muted mt-1">Overall dialed sessions</p>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start text-accent">
              <span className="text-sm font-semibold">Answered Calls</span>
              <Volume2 size={18} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary">{analytics.connected_calls}</span>
              <p className="text-xs text-muted mt-1">Interactive conversations</p>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start text-accent-green">
              <span className="text-sm font-semibold">Hot Leads</span>
              <TrendingUp size={18} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-accent-green">{analytics.hot_leads}</span>
              <p className="text-xs text-muted mt-1">Lead Score &gt;= 90%</p>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start text-accent-purple">
              <span className="text-sm font-semibold">Conversion Rate</span>
              <Zap size={18} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-accent-purple">
                {analytics.conversion_rate}%
              </span>
              <p className="text-xs text-muted mt-1">Hot leads ratio</p>
            </div>
          </div>
        </div>

        {/* pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Lead Pipeline */}
          <div className="glass-card p-6 lg:col-span-3">
            <h3 className="text-lg font-bold text-primary mb-4">Lead Qualification Pipeline</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-accent-green font-semibold">Hot Leads (Score 90-100)</span>
                  <span className="text-primary font-bold">{analytics.hot_leads}</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent-green h-full rounded-full"
                    style={{ width: `${(analytics.hot_leads / (leads.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-accent font-semibold">Warm Leads (Score 70-89)</span>
                  <span className="text-primary font-bold">{analytics.warm_leads}</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${(analytics.warm_leads / (leads.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-accent-purple font-semibold">
                    Nurture Leads (Score 40-69)
                  </span>
                  <span className="text-primary font-bold">{analytics.nurture_leads}</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent-purple h-full rounded-full"
                    style={{ width: `${(analytics.nurture_leads / (leads.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary font-semibold">Cold Leads (Score 0-39)</span>
                  <span className="text-primary font-bold">{analytics.cold_leads}</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-muted h-full rounded-full"
                    style={{ width: `${(analytics.cold_leads / (leads.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCampaigns = () => {
    // Status badge config
    const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "● Active" },
      paused: { bg: "bg-orange-500/20", text: "text-orange-400", label: "⏸ Paused" },
      completed: { bg: "bg-sky-500/20", text: "text-sky-400", label: "✓ Done" },
      draft: { bg: "bg-purple-500/20", text: "text-purple-400", label: "◦ Draft" },
      archived: { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "🗃 Archived" },
      deleted: { bg: "bg-red-500/20", text: "text-red-400", label: "🗑 Trash" },
    };

    const tabs: { key: typeof campaignFilter; label: string }[] = [
      { key: "all", label: "All" },
      { key: "active", label: "Active" },
      { key: "paused", label: "Paused" },
      { key: "completed", label: "Completed" },
      { key: "draft", label: "Draft" },
      { key: "archived", label: "Archived" },
      { key: "trash", label: "🗑 Trash" },
    ];

    // Pick dataset based on active tab
    let displayCampaigns: any[] = [];
    if (campaignFilter === "trash") {
      displayCampaigns = trashedCampaigns;
    } else if (campaignFilter === "archived") {
      displayCampaigns = archivedCampaigns;
    } else if (campaignFilter === "all") {
      displayCampaigns = campaigns;
    } else {
      displayCampaigns = campaigns.filter((c) => c.status === campaignFilter);
    }

    const renderCampaignCard = (c: any) => {
      const isTrash = c.is_deleted;
      const isArchived = c.is_archived && !c.is_deleted;
      const badge = isTrash
        ? statusBadge.deleted
        : isArchived
          ? statusBadge.archived
          : (statusBadge[c.status] ?? statusBadge.draft);
      return (
        <div key={c.id} className="p-4 bg-surface rounded-xl border border-border-color flex flex-col gap-2 hover:border-primary/40 transition-all">
          {/* Header row */}
          <div className="flex justify-between items-start">
            <span className="font-bold text-primary text-sm leading-tight">{c.name}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
          </div>

          {/* Objective */}
          {c.objective && <p className="text-secondary text-xs line-clamp-2">{c.objective}</p>}

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-muted border-t border-border-color pt-2">
            <span>Agent: {c.agent_name ?? "—"}</span>
            <span>{leads.filter((l) => l.campaign_id === c.id).length} leads</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1 min-h-[28px] items-center">
            {actionCampaignId === c.id ? (
              <div className="flex items-center gap-1.5 text-xs text-muted font-medium py-0.5">
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                <span>Processing...</span>
              </div>
            ) : isTrash ? (
              <>
                <button
                  onClick={() => restoreCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  ♻ Restore
                </button>
                <button
                  onClick={() => permanentDeleteCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  ✕ Delete Forever
                </button>
              </>
            ) : isArchived ? (
              <>
                <button
                  onClick={() => archiveCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  ♻ Unarchive
                </button>
                <button
                  onClick={() => softDeleteCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  🗑 Delete
                </button>
              </>
            ) : (
              <>
                {/* Pause / Resume toggle */}
                {c.status === "active" || c.status === "completed" ? (
                  <button
                    onClick={() => patchCampaignStatus(c.id, "paused")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/30 transition-colors"
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    onClick={() => patchCampaignStatus(c.id, "active")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    ▶ Resume
                  </button>
                )}

                {/* Duplicate */}
                <button
                  onClick={() => duplicateCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/30 transition-colors"
                >
                  📋 Copy
                </button>

                {/* Archive */}
                <button
                  onClick={() => archiveCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25 transition-colors"
                >
                  🗃 Archive
                </button>

                {/* Soft delete */}
                <button
                  onClick={() => softDeleteCampaign(c.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Campaigns Control</h1>
            <p className="text-secondary text-sm">
              Create telecalling targets and import CSV contact sheets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
          {/* Left Column: Create & Import (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Campaign */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Create New Campaign</h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Campaign Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. EdTech Telugu Enrollment"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    disabled={isCreatingCampaign}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Call Objective / Description</label>
                  <textarea
                    className="form-textarea h-24"
                    placeholder="Introduce program benefits, qualify budget, schedule counseling callbacks."
                    value={newCampaign.objective}
                    onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                    disabled={isCreatingCampaign}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign AI Calling Agent</label>
                  <select
                    className="form-input bg-surface"
                    value={newCampaign.agent_id}
                    onChange={(e) => setNewCampaign({ ...newCampaign, agent_id: e.target.value })}
                    disabled={isCreatingCampaign}
                  >
                    <option value="">Select AI Agent</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2"
                  disabled={isCreatingCampaign}
                >
                  {isCreatingCampaign ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Add Campaign</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Import leads */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Import Leads CSV</h3>
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Target Campaign</label>
                  <select
                    className="form-input bg-surface"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    disabled={isUploadingLeads}
                  >
                    <option value="">Select Campaign</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Choose CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    className="form-input bg-surface border border-dashed border-muted p-4 h-auto cursor-pointer"
                    onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                    disabled={isUploadingLeads}
                  />
                  <p className="text-xs text-muted mt-1">
                    Requires headers containing 'name' &amp; 'phone'
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary w-full mt-2"
                  disabled={isUploadingLeads}
                >
                  {isUploadingLeads ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload Leads</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Campaigns List (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 mb-5">
                {tabs.map((t) => {
                  const count =
                    t.key === "trash"
                      ? trashedCampaigns.length
                      : t.key === "archived"
                        ? archivedCampaigns.length
                        : t.key === "all"
                          ? campaigns.length
                          : campaigns.filter((c) => c.status === t.key).length;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setCampaignFilter(t.key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        campaignFilter === t.key
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface text-secondary border border-border-color hover:border-primary/40"
                      }`}
                    >
                      {t.label}
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                          campaignFilter === t.key ? "bg-white/20" : "bg-muted/20"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Campaign cards grid */}
              {displayCampaigns.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <p className="text-4xl mb-3">{campaignFilter === "trash" ? "🗑" : "📋"}</p>
                  <p className="text-sm">
                    {campaignFilter === "trash"
                      ? "Trash is empty"
                      : campaignFilter === "archived"
                        ? "No archived campaigns"
                        : "No campaigns yet — create your first one above"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayCampaigns.map((c) => renderCampaignCard(c))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCRM = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">CRM Leads & Telecalling</h1>
            <p className="text-secondary text-sm">
              Dial leads directly in the browser and review urgency scoring metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Manual Add Lead */}
          <div className="glass-card p-6 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-primary mb-4">Add Single Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kiran Kumar"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  disabled={isCreatingLead}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  disabled={isCreatingLead}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Language</label>
                <select
                  className="form-input bg-surface"
                  value={newLead.language}
                  onChange={(e) => setNewLead({ ...newLead, language: e.target.value })}
                  disabled={isCreatingLead}
                >
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Link Campaign</label>
                <select
                  className="form-input bg-surface"
                  value={newLead.campaign_id}
                  onChange={(e) => setNewLead({ ...newLead, campaign_id: e.target.value })}
                  disabled={isCreatingLead}
                >
                  <option value="">No Campaign</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={isCreatingLead}
              >
                {isCreatingLead ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    <span>Creating Lead...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Contact</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CRM Leads Table */}
          <div className="glass-card p-6 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">Prospect Pipeline</h3>
              <span className="text-muted text-xs">{leads.length} leads registered</span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="crm-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-color text-secondary text-xs uppercase font-bold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        No leads available. Try importing a CSV or adding manually.
                      </td>
                    </tr>
                  ) : (
                    leads.map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-border-color/30 hover:bg-surface/20"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{l.name}</div>
                          <div className="text-xs text-muted mt-0.5">{l.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-secondary">
                          {l.language === "te"
                            ? "Telugu"
                            : l.language === "hi"
                              ? "Hindi"
                              : "English"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              l.interest_level === "Hot"
                                ? "bg-accent-green/20 text-accent-green"
                                : l.interest_level === "Warm"
                                  ? "bg-accent/20 text-accent"
                                  : l.interest_level === "Nurture"
                                    ? "bg-accent-purple/20 text-accent-purple"
                                    : "bg-muted/20 text-secondary"
                            }`}
                          >
                            {l.interest_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-primary">{l.urgency_score}%</td>
                        <td className="py-3 px-4">
                          <span
                            className={`capitalize text-xs font-medium ${
                              l.status === "called"
                                ? "text-accent"
                                : l.status === "callback"
                                  ? "text-accent-purple"
                                  : "text-muted"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              className="btn btn-secondary p-2 rounded-full h-auto text-accent-green hover:bg-accent-green/20"
                              onClick={() => handleStartBrowserCall(l)}
                              title="Call in Browser"
                              disabled={deletingLeadId !== null}
                            >
                              <Phone size={14} />
                            </button>
                            <button
                              className="btn btn-secondary p-2 rounded-full h-auto text-accent-purple hover:bg-accent-purple/20"
                              onClick={() => handleStartRealCall(l)}
                              title="Real Outbound Call"
                              disabled={deletingLeadId !== null}
                            >
                              <Zap size={14} />
                            </button>
                            <button
                              className="btn btn-secondary p-2 rounded-full h-auto text-accent-red hover:bg-accent-red/20"
                              onClick={() => handleDeleteLead(l.id)}
                              disabled={deletingLeadId !== null}
                              title="Delete Lead"
                            >
                              {deletingLeadId === l.id ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Trash size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallLogs = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Call History & Transcripts</h1>
            <p className="text-secondary text-sm">
              Review call recordings, objection mappings, and full conversation transcripts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Logs Table */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-primary mb-4">Completed Calls</h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="crm-table w-full text-left">
                <thead>
                  <tr className="border-b border-border-color text-secondary text-xs uppercase">
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Objections</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {callLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted">
                        No completed calls logged yet.
                      </td>
                    </tr>
                  ) : (
                    callLogs.map((l) => (
                      <tr
                        key={l.session_id}
                        className={`border-b border-border-color/30 hover:bg-surface/20 cursor-pointer ${selectedCallLog?.session_id === l.session_id ? "bg-surface/40" : ""}`}
                        onClick={() => setSelectedCallLog(l)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{l.lead_name}</div>
                          <div className="text-xs text-muted mt-0.5">{l.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              l.lead_category === "Hot"
                                ? "bg-accent-green/20 text-accent-green"
                                : l.lead_category === "Warm"
                                  ? "bg-accent/20 text-accent"
                                  : l.lead_category === "Nurture"
                                    ? "bg-accent-purple/20 text-accent-purple"
                                    : "bg-muted/20 text-secondary"
                            }`}
                          >
                            {l.lead_category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-primary">
                          {l.interest_score}%
                        </td>
                        <td className="py-3 px-4 text-xs text-secondary max-w-[120px] truncate">
                          {l.objections || "None"}
                        </td>
                        <td className="py-3 px-4">
                          <button className="btn btn-secondary text-xs py-1 px-2 h-auto">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Pane */}
          <div className="glass-card p-6 lg:col-span-1">
            {selectedCallLog ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-border-color pb-3">
                  <div>
                    <h3 className="font-bold text-primary text-lg">{selectedCallLog.lead_name}</h3>
                    <p className="text-xs text-muted">{selectedCallLog.phone}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      selectedCallLog.lead_category === "Hot"
                        ? "bg-accent-green/20 text-accent-green"
                        : selectedCallLog.lead_category === "Warm"
                          ? "bg-accent/20 text-accent"
                          : selectedCallLog.lead_category === "Nurture"
                            ? "bg-accent-purple/20 text-accent-purple"
                            : "bg-muted/20 text-secondary"
                    }`}
                  >
                    {selectedCallLog.lead_category}
                  </span>
                </div>

                {/* Interest Score Progress Bar — primary CRM signal */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted font-semibold">Interest Score</span>
                    <span className={`text-sm font-bold ${
                      (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 75
                        ? "text-accent-green"
                        : (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 50
                        ? "text-accent"
                        : (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 25
                        ? "text-accent-purple"
                        : "text-secondary"
                    }`}>
                      {selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-3 overflow-hidden" style={{border: "1px solid var(--border-color)"}}>
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out ${
                        (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 75
                          ? "bg-accent-green"
                          : (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 50
                          ? "bg-accent"
                          : (selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0) >= 25
                          ? "bg-accent-purple"
                          : "bg-secondary"
                      }`}
                      style={{ width: `${selectedCallLog.interest_score ?? selectedCallLog.buying_intent ?? 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted">Cold</span>
                    <span className="text-[10px] text-muted">Nurture</span>
                    <span className="text-[10px] text-muted">Warm</span>
                    <span className="text-[10px] text-muted">Hot</span>
                  </div>
                </div>

                {/* Score Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface rounded-lg">
                    <span className="text-xs text-muted block">Buying Intent</span>
                    <span className="text-lg font-bold text-primary">
                      {selectedCallLog.buying_intent ?? 0}%
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-lg">
                    <span className="text-xs text-muted block">WhatsApp Follow-up</span>
                    <span
                      className={`text-sm font-bold block mt-1 ${selectedCallLog.whatsapp_sent ? "text-accent-green" : "text-secondary"}`}
                    >
                      {selectedCallLog.whatsapp_sent ? "Brochure Sent" : "No"}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <span className="text-xs text-muted font-semibold block mb-1">Call Summary</span>
                  <div className="p-3 bg-surface rounded-lg text-secondary text-xs leading-relaxed">
                    {selectedCallLog.summary || "No summary compiled."}
                  </div>
                </div>

                {/* Objections */}
                <div>
                  <span className="text-xs text-muted font-semibold block mb-1">
                    Customer Objections
                  </span>
                  <div className="p-3 bg-surface rounded-lg text-secondary text-xs">
                    {selectedCallLog.objections || "None identified during call."}
                  </div>
                </div>

                {/* Conversation Transcript */}
                <div>
                  <span className="text-xs text-muted font-semibold block mb-1">
                    Conversation Transcript
                  </span>
                  <div className="p-3 bg-surface rounded-lg text-secondary text-xs max-h-48 overflow-y-auto whitespace-pre-wrap font-mono border border-border-color/30 scrollbar-thin">
                    {selectedCallLog.transcript ? (
                      selectedCallLog.transcript.trim()
                    ) : (
                      <span className="text-muted italic">No transcript recorded for this session.</span>
                    )}
                  </div>
                </div>

                {/* Callback Time */}
                {selectedCallLog.callback_time && (
                  <div>
                    <span className="text-xs text-muted font-semibold block mb-1">
                      Requested Callback
                    </span>
                    <div className="p-3 bg-accent-purple/10 border border-accent-purple/30 rounded-lg text-accent-purple text-xs font-bold flex items-center gap-2">
                      <Calendar size={12} />
                      <span>{selectedCallLog.callback_time}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted space-y-2">
                <FileText size={40} className="text-muted" />
                <p className="text-sm">
                  Select a call log to view detailed transcripts and post-call analyses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const playVoicePreview = (voiceId: string, previewUrl: string) => {
    if (playingVoiceId === voiceId) {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    const audio = new Audio(previewUrl);
    audio.play().catch(e => console.error("Audio playback error:", e));
    setAudioPlayer(audio);
    setPlayingVoiceId(voiceId);

    audio.onended = () => {
      setPlayingVoiceId(null);
    };
  };

  const enhancePromptWithAI = async () => {
    if (!newAgent.role || !newAgent.name) {
      showToast("error", "Please set Agent Name and Role Description first.");
      return;
    }
    setIsEnhancing(true);
    try {
      const bulletPoints = newAgent.prompt || "An admissions counselor who helps students and shares courses.";
      const promptToOptimize = `Optimize this AI voice agent's system prompt instructions.
Agent Name: ${newAgent.name}
Role Description: ${newAgent.role}
Languages: ${newAgent.languages || "te,en"}
Bullet points or draft of instructions: ${bulletPoints}

Provide a concise, professional, instruction-oriented system prompt in English. Keep it directly action-oriented, conversational, and tailored to a phone call. Focus on the tone (polite, helpful) and objective (introducing options, answering queries, suggesting brochure). Respond ONLY with the system prompt text, nothing else.`;

      const res = await fetch(`${env.apiBaseUrl}/ai/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          prompt: promptToOptimize,
          max_new_tokens: 256,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.generated_text) {
          setNewAgent(prev => ({ ...prev, prompt: data.generated_text.trim() }));
          showToast("success", "AI Agent prompt enhanced successfully!");
        } else {
          showToast("error", "Failed to enhance prompt with AI.");
        }
      } else {
        showToast("error", "Failed to contact AI generator.");
      }
    } catch (err) {
      showToast("error", "Error connecting to AI helper.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const renderAgents = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">AI Agents Workspace</h1>
            <p className="text-secondary text-sm">
              Configure speech instructions, assigned voice IDs, and automation rules
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Configure Prompt Wizard Form */}
          <div className="glass-card p-6 lg:col-span-1 h-fit flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Create AI Agent</h3>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted font-mono">
                  Step {wizardStep} of 3
                </span>
              </div>

              {/* Step Progress Indicator */}
              <div className="flex items-center justify-between mb-6 px-1">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          wizardStep === step
                            ? "bg-accent text-white shadow-lg shadow-accent/20"
                            : wizardStep > step
                            ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                            : "bg-white/5 text-secondary border border-white/10"
                        }`}
                      >
                        {wizardStep > step ? <Check size={10} /> : step}
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          wizardStep === step ? "text-primary" : "text-muted"
                        }`}
                      >
                        {step === 1 ? "Identity" : step === 2 ? "Voice" : "Actions"}
                      </span>
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                          wizardStep > step ? "bg-accent-green/30" : "bg-white/10"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Agent Role & Presets */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="form-group">
                    <label className="form-label text-[11px]">Select Role Preset (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {WIZARD_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="p-2 rounded bg-surface border border-border-color hover:border-accent/40 text-left transition-all flex flex-col justify-between h-20 text-[10px]"
                          onClick={() => {
                            setNewAgent({
                              name: preset.name,
                              role: preset.role,
                              prompt: preset.prompt,
                              voice_id: preset.voice_id,
                              languages: preset.languages,
                              whatsapp_threshold: preset.whatsapp_threshold,
                            });
                            showToast("success", `Loaded preset: ${preset.label}`);
                          }}
                        >
                          <span className="font-bold text-primary leading-tight line-clamp-2">{preset.label}</span>
                          <span className="text-[8px] text-muted capitalize">{preset.role.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-[11px]">Agent Name</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g. Swetha"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-[11px]">Agent Role Description</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g. Admission Counsellor"
                      value={newAgent.role}
                      onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label text-[11px] mb-0">System Instruction Prompts</label>
                      <button
                        type="button"
                        className="btn btn-secondary h-auto py-0.5 px-2 text-[9px] flex items-center gap-1 text-accent border border-accent/20 hover:bg-accent/10 rounded"
                        disabled={isEnhancing}
                        onClick={enhancePromptWithAI}
                      >
                        {isEnhancing ? (
                          <>
                            <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full" />
                            <span>Enhancing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={10} />
                            <span>Enhance Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      className="form-textarea h-28 text-[11px] leading-relaxed font-sans"
                      placeholder="Enter base details or draft instructions. Click Enhance Prompt to optimize them automatically using AI."
                      value={newAgent.prompt}
                      onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Language & Voice Selection */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="form-group">
                    <label className="form-label text-[11px]">Primary Languages</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGE_OPTIONS.map((lang) => {
                        const list = newAgent.languages ? newAgent.languages.split(",").map(c => c.trim()).filter(Boolean) : [];
                        const isSelected = list.includes(lang.code);
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                              isSelected
                                ? "bg-accent/15 text-accent border-accent/30 shadow-sm"
                                : "bg-white/5 text-secondary border-transparent hover:bg-white/10"
                            }`}
                            onClick={() => {
                              let newList;
                              if (isSelected) {
                                newList = list.filter(c => c !== lang.code);
                              } else {
                                newList = [...list, lang.code];
                              }
                              setNewAgent(prev => ({ ...prev, languages: newList.join(",") }));
                            }}
                          >
                            {lang.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label text-[11px] mb-0">Select Voice Profile</label>
                      <button
                        type="button"
                        className="text-[10px] text-accent hover:underline flex items-center gap-1"
                        onClick={() => {
                          setCustomVoiceEnabled(!customVoiceEnabled);
                          if (customVoiceEnabled) {
                            setNewAgent(prev => ({ ...prev, voice_id: "hpp4J3VqNfWAUOO0d1Us" }));
                          }
                        }}
                      >
                        {customVoiceEnabled ? "Choose Preset Voice" : "Use Custom Voice ID"}
                      </button>
                    </div>

                    {customVoiceEnabled ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Paste ElevenLabs Voice ID hash"
                          value={newAgent.voice_id}
                          onChange={(e) => setNewAgent({ ...newAgent, voice_id: e.target.value })}
                        />
                        <p className="text-[9px] text-muted leading-tight">
                          Provide any valid custom Voice ID from ElevenLabs Voice Library.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {VOICE_PRESETS.map((voice) => {
                          const isSelected = newAgent.voice_id === voice.id;
                          const isPlaying = playingVoiceId === voice.id;
                          return (
                            <div
                              key={voice.id}
                              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-accent/10 border-accent/40 shadow-sm"
                                  : "bg-surface border-border-color hover:border-white/10"
                              }`}
                              onClick={() => setNewAgent({ ...newAgent, voice_id: voice.id })}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  voice.gender === "Female" ? "bg-accent-purple/20 text-accent-purple" : "bg-accent/20 text-accent"
                                }`}>
                                  {voice.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-primary leading-tight">{voice.name}</p>
                                  <p className="text-[9px] text-muted">{voice.gender} • {voice.desc}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  isPlaying
                                    ? "bg-accent-green/20 text-accent-green"
                                    : "bg-white/5 text-primary hover:bg-white/10"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playVoicePreview(voice.id, voice.url);
                                }}
                              >
                                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Trigger Rules & Actions */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-surface rounded-lg border border-border-color flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-primary">WhatsApp Integration</h4>
                      <p className="text-[9px] text-muted leading-tight">Send course brochure PDF automatically during call</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newAgent.whatsapp_threshold > 0}
                        onChange={(e) => {
                          const val = e.target.checked ? 70 : 0;
                          setNewAgent({ ...newAgent, whatsapp_threshold: val });
                        }}
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-green"></div>
                    </label>
                  </div>

                  {newAgent.whatsapp_threshold > 0 && (
                    <div className="form-group space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <label className="form-label text-[11px] mb-0">Brochure Trigger Threshold</label>
                        <span className="text-xs font-mono font-bold text-accent-green">
                          {newAgent.whatsapp_threshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="95"
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                        value={newAgent.whatsapp_threshold}
                        onChange={(e) =>
                          setNewAgent({ ...newAgent, whatsapp_threshold: parseInt(e.target.value) || 0 })
                        }
                      />
                      <div className="p-2.5 bg-surface border border-border-color rounded text-[10px] text-secondary leading-normal">
                        {newAgent.whatsapp_threshold < 40 && (
                          <span className="text-accent-red font-medium">⚠️ Lenient: Send brochure to almost everyone, even if they show minimal interest.</span>
                        )}
                        {newAgent.whatsapp_threshold >= 40 && newAgent.whatsapp_threshold < 70 && (
                          <span className="text-warning font-medium">Warm: Send brochure to customers showing moderate curiosity or query-asking.</span>
                        )}
                        {newAgent.whatsapp_threshold >= 70 && newAgent.whatsapp_threshold < 85 && (
                          <span className="text-accent-green font-medium">✅ Recommended: Send only if the customer asks relevant questions or shows clear interest.</span>
                        )}
                        {newAgent.whatsapp_threshold >= 85 && (
                          <span className="text-primary font-medium">🔥 Strict: Send brochure only to highly motivated hot leads.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-6 border-t border-border-color/30 mt-6 font-sans">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1 border border-border-color"
                  onClick={() => setWizardStep(prev => prev - 1)}
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
              ) : null}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1"
                  onClick={() => {
                    if (wizardStep === 1 && (!newAgent.name || !newAgent.role || !newAgent.prompt)) {
                      showToast("error", "Please set Agent Name, Role and Prompt first.");
                      return;
                    }
                    setWizardStep(prev => prev + 1);
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1 bg-accent-green hover:bg-accent-green/80 text-white border-none shadow-lg shadow-accent-green/10"
                  onClick={handleCreateAgent}
                >
                  <Plus size={14} />
                  <span>Save Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Agents List */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-primary mb-4">Configured Agents Workspace</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.length === 0 ? (
                <p className="text-muted text-sm text-center py-20 col-span-2">
                  No agents created yet. Add an agent using the configuration workspace.
                </p>
              ) : (
                agents.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-surface rounded-lg border border-border-color flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-primary text-sm">{a.name}</span>
                        <span className="status-pill bg-accent/20 text-accent px-2 py-0.5 text-xs rounded">
                          {a.role}
                        </span>
                      </div>
                      <p className="text-xs text-secondary line-clamp-3 mb-4 leading-relaxed font-mono">
                        {a.prompt}
                      </p>
                    </div>
                    <div className="border-t border-border-color pt-3 flex items-center justify-between text-xs text-muted">
                      <span>WA Threshold: {a.whatsapp_threshold}%</span>
                      <button
                        className="btn btn-secondary text-accent-red p-1 h-auto hover:bg-accent-red/20 rounded"
                        onClick={() => handleDeleteAgent(a.id)}
                        disabled={deletingAgentId !== null}
                      >
                        {deletingAgentId === a.id ? (
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Trash size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= CALLING MONITOR OVERLAY (MODAL) =================
  const renderCallOverlay = () => {
    if (!sessionActive && !postCallReport) return null;

    const avatarState = getAvatarState();
    const statusText = getStatusText();

    return (
      <div className="call-overlay">
        {sessionActive ? (
          <div className="w-full max-w-2xl bg-surface border border-border-color rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 min-h-[380px] items-center">
            {/* Left Column: Call Control Screen */}
            <div className="flex-1 flex flex-col justify-between min-h-[320px] w-full">
              {/* Top Bar */}
              <div className="flex items-center justify-between text-sm pb-2 border-b border-border-color/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-accent-green rounded-full animate-ping"></span>
                  <span className="text-accent-green font-bold uppercase tracking-wider text-[10px]">
                    Live Call
                  </span>
                </div>
                <span className="font-mono text-primary bg-surface/50 px-2 py-0.5 rounded-full border border-border-color text-[10px]">
                  {formatTime(callDuration)}
                </span>
              </div>

              {/* Central Visualizer */}
              <div className="flex flex-col items-center justify-center my-3">
                <div
                  className={`avatar-ring w-24 h-24 rounded-full flex items-center justify-center relative ${avatarState}`}
                >
                  <div className="pulse-1"></div>
                  <div className="pulse-2"></div>
                  <div className="pulse-3"></div>
                  {isProcessing && <div className="circular-loader"></div>}

                  <div className="avatar-inner flex flex-col items-center justify-center text-primary z-10">
                    <span className="text-2xl font-bold">{activeCallLead?.name.charAt(0)}</span>
                    <span className="text-[9px] text-muted mt-0.5 uppercase font-semibold">
                      {activeCallLead?.language}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-primary mt-3">{activeCallLead?.name}</h2>
                <p className="text-[11px] text-muted mt-0.5">{activeCallLead?.phone}</p>
                <p className="text-[11px] text-secondary mt-2 font-mono font-medium">
                  {statusText}
                </p>

                {isPlayingAudio && (
                  <div className="wave-container mt-3">
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="flex justify-center items-center gap-4 mt-2">
                <button
                  className={`btn p-3 rounded-full h-auto ${isRecording ? "bg-accent-red/20 text-accent-red border border-accent-red/40" : "bg-surface text-primary border border-border-color"}`}
                  onClick={handleMicToggle}
                  title={isRecording ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <button
                  className="btn bg-accent-red hover:bg-accent-red/80 text-white p-4 rounded-full h-auto shadow-lg hover:shadow-accent-red/20 transition-all border-none"
                  onClick={handleEndBrowserCall}
                  title="End Conversation & Compile Analytics"
                >
                  <PhoneOff size={20} />
                </button>

                <button
                  className={`btn p-3 rounded-full h-auto ${autoListen ? "bg-accent-green/20 text-accent-green border border-accent-green/40" : "bg-surface text-secondary border border-border-color"}`}
                  onClick={() => setAutoListen(!autoListen)}
                  title="Toggle Hands-free Auto-Listen Mode"
                >
                  <Sparkles size={16} />
                </button>
              </div>
            </div>

            {/* Right Column: Air floating transcript panel */}
            <div className="w-full md:w-[280px] border-t md:border-t-0 md:border-l border-border-color/30 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between self-stretch">
              <div className="flex flex-col h-full justify-start">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-accent mb-3">
                  Live Response
                </h3>
                <div className="flex-1 space-y-3 overflow-hidden flex flex-col justify-center">
                  {chatLog.length === 0 ? (
                    <p className="text-muted text-[11px] text-center py-4">
                      Waiting for conversation...
                    </p>
                  ) : (
                    chatLog.slice(-2).map((chat, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"} animate-fade-in`}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted mb-0.5">
                          {chat.role === "user" ? "You" : "Agent"}
                        </span>
                        <div
                          className={`p-0 bg-transparent text-xs leading-relaxed ${chat.role === "user" ? "text-accent text-right font-medium" : "text-primary text-left"}`}
                          style={{ textShadow: "0 0 1px rgba(255,255,255,0.1)" }}
                        >
                          {chat.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Post Call Analysis Review Modal
          <div className="w-full max-w-xl bg-surface border border-border-color rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative animate-fade-in">
            <div className="flex justify-between items-start border-b border-border-color pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary">Sales Evaluation & Summary</h2>
                <p className="text-xs text-muted mt-0.5">
                  Automated lead categorization and scoring
                </p>
              </div>
              <button
                className="btn btn-secondary p-1 h-auto rounded"
                onClick={() => setPostCallReport(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-surface rounded-lg text-center">
                  <span className="text-xs text-muted block">Lead Score</span>
                  <span className="text-2xl font-bold text-primary">
                    {postCallReport.interest_score}%
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-lg text-center">
                  <span className="text-xs text-muted block">Category</span>
                  <span
                    className={`text-base font-bold block mt-2 ${
                      postCallReport.lead_category === "Hot"
                        ? "text-accent-green"
                        : postCallReport.lead_category === "Warm"
                          ? "text-accent"
                          : postCallReport.lead_category === "Nurture"
                            ? "text-accent-purple"
                            : "text-secondary"
                    }`}
                  >
                    {postCallReport.lead_category}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-lg text-center">
                  <span className="text-xs text-muted block">WhatsApp Brochure</span>
                  <span
                    className={`text-sm font-bold block mt-2 ${postCallReport.whatsapp_sent ? "text-accent-green" : "text-secondary"}`}
                  >
                    {postCallReport.whatsapp_sent ? "Dispatched" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted font-bold block mb-1">AI Call Summary</span>
                <div className="p-3 bg-surface rounded-lg text-secondary text-xs leading-relaxed">
                  {postCallReport.summary || "None compiled."}
                </div>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setPostCallReport(null)}>
              <span>Close Report & Continue</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="voice-agent-studio flex-1 flex flex-col min-h-full w-full text-primary bg-bg-main relative">
      {/* Toast Alerts */}
      {errorMsg && (
        <div className="toast toast-error fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent-red/20 border border-accent-red/40 px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg">
          <AlertCircle size={14} className="text-accent-red" />
          <span className="text-primary">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="toast toast-success fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent-green/20 border border-accent-green/40 px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg">
          <Check size={14} className="text-accent-green" />
          <span className="text-primary">{successMsg}</span>
        </div>
      )}
      {infoMsg && (
        <div className="toast toast-info fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent/20 border border-accent/40 px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg">
          <Info size={14} className="text-accent" />
          <span className="text-primary">{infoMsg}</span>
        </div>
      )}

      {/* Top horizontal tab navigation bar */}
      <div className="voice-agent-top-nav flex flex-col md:flex-row md:items-center px-8 py-4 border-b border-border-color bg-bg-surface sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-sm font-semibold tracking-wider text-accent uppercase flex items-center gap-2">
            <Mic className="h-4 w-4 text-accent" />
            <span>Voice Agent Studio</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={14} />
              <span>Overview</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "campaigns"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("campaigns")}
            >
              <Layers size={14} />
              <span>Campaigns</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "crm"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("crm")}
            >
              <User size={14} />
              <span>CRM Leads</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "calls"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("calls")}
            >
              <FileText size={14} />
              <span>Call Logs</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "billing"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("billing")}
            >
              <Zap size={14} />
              <span>Billing & Wallet</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "agents"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-secondary hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => setActiveTab("agents")}
            >
              <Settings size={14} />
              <span>Configure Agents</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main content pane */}
      <main className="flex-1 p-8 flex flex-col">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "campaigns" && (isLoadingDashboard ? renderCampaignsSkeleton() : renderCampaigns())}
        {activeTab === "crm" && (isLoadingDashboard ? renderCRMSkeleton() : renderCRM())}
        {activeTab === "calls" && (isLoadingDashboard ? renderCallLogsSkeleton() : renderCallLogs())}
        {activeTab === "billing" && renderBilling()}
        {activeTab === "agents" && (isLoadingDashboard ? renderAgentsSkeleton() : renderAgents())}
      </main>

      {/* Dialer monitor overlay */}
      {renderCallOverlay()}
    </div>
  );
}

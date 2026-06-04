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
} from "lucide-react";
import { env } from "@/config/env";
import voiceAgentCss from "./voice-agent.css?url";

export const Route = createFileRoute("/dashboard/voice-agent/")({
  head: () => ({
    meta: [{ title: "AI Voice Agent — Saadhyam AI" }],
    links: [{ rel: "stylesheet", href: voiceAgentCss }],
  }),
  component: VoiceAgentDashboard,
});

function VoiceAgentDashboard() {
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

  // Forms / Modals
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "",
    prompt: "",
    voice_id: "hpp4J3VqNfWAUOO0d1Us",
    languages: "te,en",
    whatsapp_threshold: 70,
  });
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    objective: "",
    agent_id: "",
    status: "active",
  });
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

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<any[]>([]);
  const micProcessorRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // ================= LIFECYCLE & FETCHING =================
  useEffect(() => {
    fetchData();
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

  const fetchData = () => {
    fetchAnalytics();
    fetchAgents();
    fetchCampaigns();
    fetchLeads();
    fetchCallLogs();
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
      const res = await fetch(`${env.apiBaseUrl}/api/campaigns`, {
        headers: getHeaders(),
      });
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error("Error fetching campaigns:", err);
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
        fetchAgents();
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    }
  };

  const handleDeleteAgent = async (id: number) => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/agents/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Agent deleted.");
        fetchAgents();
      }
    } catch (err) {
      showToast("error", "Error deleting agent.");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.agent_id) {
      showToast("error", "Campaign Name and AI Agent are required.");
      return;
    }
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
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) {
      showToast("error", "Name and Phone Number are required.");
      return;
    }
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
      }
    } catch (err) {
      showToast("error", "Server connection error.");
    }
  };

  const handleDeleteLead = async (id: number) => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leads/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast("success", "Lead deleted.");
        fetchLeads();
        fetchAnalytics();
      }
    } catch (err) {
      showToast("error", "Error deleting lead.");
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedCampaignId) {
      showToast("error", "Select a Campaign and choose a CSV file.");
      return;
    }
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
      v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase())
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
    fallbackText: string = ""
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
          rec.lang =
            lead.language === "hi" ? "hi-IN" : lead.language === "en" ? "en-US" : "te-IN";

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
                })
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
        fetchData();
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
  const renderDashboard = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-secondary text-sm">Real-time telecalling metrics and campaign tracking</p>
          </div>
          <button className="btn btn-primary" onClick={fetchData}>
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
              <span className="text-3xl font-bold text-accent-purple">{analytics.conversion_rate}%</span>
              <p className="text-xs text-muted mt-1">Hot leads ratio</p>
            </div>
          </div>
        </div>

        {/* pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Lead Pipeline */}
          <div className="glass-card p-6 lg:col-span-2">
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
                  <span className="text-accent-purple font-semibold">Nurture Leads (Score 40-69)</span>
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

          {/* Quick Metrics */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Integrations Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-sm font-semibold text-primary">Gemini LLM Brain</span>
                <span className="status-pill bg-accent-green/20 text-accent-green px-2 py-1 text-xs rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-sm font-semibold text-primary">ElevenLabs TTS Voice</span>
                <span className="status-pill bg-accent-green/20 text-accent-green px-2 py-1 text-xs rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-sm font-semibold text-primary">WhatsApp Follow-ups</span>
                <span className="status-pill bg-accent-green/20 text-accent-green px-2 py-1 text-xs rounded">
                  Simulated
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-sm font-semibold text-primary">Browser Calling</span>
                <span className="status-pill bg-accent/20 text-accent px-2 py-1 text-xs rounded">
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCampaigns = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">Campaigns Control</h1>
            <p className="text-secondary text-sm">Create telecalling targets and import CSV contact sheets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
                />
              </div>

              <div className="form-group">
                <label className="form-label">Call Objective / Description</label>
                <textarea
                  className="form-textarea h-24"
                  placeholder="Introduce program benefits, qualify budget, schedule counseling callbacks."
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign AI Calling Agent</label>
                <select
                  className="form-input bg-surface"
                  value={newCampaign.agent_id}
                  onChange={(e) => setNewCampaign({ ...newCampaign, agent_id: e.target.value })}
                >
                  <option value="">Select AI Agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2">
                <Plus size={16} />
                <span>Add Campaign</span>
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
                />
                <p className="text-xs text-muted mt-1">Requires headers containing 'name' & 'phone'</p>
              </div>

              <button type="submit" className="btn btn-secondary w-full mt-2">
                <Upload size={16} />
                <span>Upload Leads</span>
              </button>
            </form>
          </div>

          {/* Active Campaigns */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Active Campaigns</h3>
            <div className="space-y-4 max-h-[380px] overflow-y-auto">
              {campaigns.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">No campaigns created yet.</p>
              ) : (
                campaigns.map((c) => (
                  <div key={c.id} className="p-4 bg-surface rounded-lg border border-border-color">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary text-sm">{c.name}</span>
                      <span
                        className={`status-pill px-2 py-0.5 rounded text-xs ${c.status === "active" ? "bg-accent-green/20 text-accent-green" : "bg-muted/20 text-secondary"}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-secondary text-xs line-clamp-2 mb-2">{c.objective}</p>
                    <div className="flex items-center justify-between text-xs text-muted border-t border-border-color pt-2 mt-2">
                      <span>Agent: {c.agent_name}</span>
                      <span>Target: {leads.filter((l) => l.campaign_id === c.id).length} Leads</span>
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

  const renderCRM = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">CRM Leads & Telecalling</h1>
            <p className="text-secondary text-sm">Dial leads directly in the browser and review urgency scoring metrics</p>
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
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Language</label>
                <select
                  className="form-input bg-surface"
                  value={newLead.language}
                  onChange={(e) => setNewLead({ ...newLead, language: e.target.value })}
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
                >
                  <option value="">No Campaign</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2">
                <Plus size={16} />
                <span>Add Contact</span>
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
                      <tr key={l.id} className="border-b border-border-color/30 hover:bg-surface/20">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{l.name}</div>
                          <div className="text-xs text-muted mt-0.5">{l.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-secondary">
                          {l.language === "te" ? "Telugu" : l.language === "hi" ? "Hindi" : "English"}
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
                            >
                              <Phone size={14} />
                            </button>
                            <button
                              className="btn btn-secondary p-2 rounded-full h-auto text-accent-purple hover:bg-accent-purple/20"
                              onClick={() => handleStartRealCall(l)}
                              title="Real Outbound Call"
                            >
                              <Zap size={14} />
                            </button>
                            <button
                              className="btn btn-secondary p-2 rounded-full h-auto text-accent-red hover:bg-accent-red/20"
                              onClick={() => handleDeleteLead(l.id)}
                            >
                              <Trash size={14} />
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
            <p className="text-secondary text-sm">Review call recordings, objection mappings, and full conversation transcripts</p>
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
                        <td className="py-3 px-4 font-semibold text-primary">{l.interest_score}%</td>
                        <td className="py-3 px-4 text-xs text-secondary max-w-[120px] truncate">
                          {l.objections || "None"}
                        </td>
                        <td className="py-3 px-4">
                          <button className="btn btn-secondary text-xs py-1 px-2 h-auto">View</button>
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

                {/* Score Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface rounded-lg">
                    <span className="text-xs text-muted block">Buying Intent</span>
                    <span className="text-lg font-bold text-primary">{selectedCallLog.buying_intent}%</span>
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
                  <span className="text-xs text-muted font-semibold block mb-1">Customer Objections</span>
                  <div className="p-3 bg-surface rounded-lg text-secondary text-xs">
                    {selectedCallLog.objections || "None identified during call."}
                  </div>
                </div>

                {/* Callback Time */}
                {selectedCallLog.callback_time && (
                  <div>
                    <span className="text-xs text-muted font-semibold block mb-1">Requested Callback</span>
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
                <p className="text-sm">Select a call log to view detailed transcripts and post-call analyses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAgents = () => {
    return (
      <div className="tab-pane animate-fade-in">
        <div className="tab-header">
          <div>
            <h1 className="gradient-text text-3xl font-bold">AI Agents Workspace</h1>
            <p className="text-secondary text-sm">Configure speech instructions, assigned voice IDs, and automation rules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Configure Prompt Form */}
          <div className="glass-card p-6 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-primary mb-4">Create AI calling Agent</h3>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Agent Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Swetha (Telugu Agent)"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agent Role Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Admission Counsellor"
                  value={newAgent.role}
                  onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Languages Rules</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. te,en (mix permitted)"
                  value={newAgent.languages}
                  onChange={(e) => setNewAgent({ ...newAgent, languages: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ElevenLabs Voice ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bella Multilingual Voice ID"
                  value={newAgent.voice_id}
                  onChange={(e) => setNewAgent({ ...newAgent, voice_id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Brochure Trigger Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="e.g. 70"
                  value={newAgent.whatsapp_threshold}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, whatsapp_threshold: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">AI Agent System Instruction Prompts</label>
                <textarea
                  className="form-textarea h-32 text-xs leading-relaxed"
                  placeholder="You are Swetha, a 23-year-old admissions counsellor at Mentneo Coaching. Keep your tone polite and friendly. Answer in conversational Telugu..."
                  value={newAgent.prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2">
                <Plus size={16} />
                <span>Save Config</span>
              </button>
            </form>
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
                      >
                        <Trash size={12} />
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
                <p className="text-[11px] text-secondary mt-2 font-mono font-medium">{statusText}</p>

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
                    <p className="text-muted text-[11px] text-center py-4">Waiting for conversation...</p>
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
                <p className="text-xs text-muted mt-0.5">Automated lead categorization and scoring</p>
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
    <div className="voice-agent-studio flex flex-col min-h-[calc(100vh-64px)] w-full text-primary bg-bg-main relative">
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
      <main className="flex-1 p-8">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "campaigns" && renderCampaigns()}
        {activeTab === "crm" && renderCRM()}
        {activeTab === "calls" && renderCallLogs()}
        {activeTab === "agents" && renderAgents()}
      </main>

      {/* Dialer monitor overlay */}
      {renderCallOverlay()}
    </div>
  );
}

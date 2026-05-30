import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Download,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  User,
  Volume2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { env } from "@/config/env";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/voice-agent/conversation")({
  head: () => ({ meta: [{ title: "Voice Conversation Studio — Saadhyam AI" }] }),
  component: VoiceConversationStudioPage,
});

type Language = "english" | "hinglish" | "telugu";

type VoiceType = "female" | "male";

type MessageRole = "user" | "assistant";

interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  intent?: string;
  sentiment?: string;
  audioUrl?: string;
}

interface StartResponse {
  success: boolean;
  session: {
    session_id: string;
    call_id: number;
    campaign_id: number;
    contact_id: number;
    campaign_name: string;
    business_name: string;
    language: Language;
    voice_type: VoiceType;
  };
  greeting: {
    text: string;
    audio_url: string;
  };
}

interface TurnResponse {
  success: boolean;
  turn: {
    customer_text: string;
    intent: string;
    sentiment: string;
    interest_level: string;
    should_followup: boolean;
    recommended_action: string;
    should_continue: boolean;
  };
  response: {
    text: string;
    audio_url: string;
  };
  conversation_history: Array<{ role: string; content: string }>;
}

interface EndResponse {
  success: boolean;
  summary: string;
  sentiment: string;
  lead: null | {
    id: number;
    name: string;
    phone_number: string;
    status: string;
    lead_score: number;
  };
  call: {
    id: number;
    status: string;
    duration: number;
    conversation_summary: string | null;
    customer_sentiment: string | null;
  };
}

const defaultForm = {
  session_name: "",
  business_name: "Saadhyam AI",
  business_description: "An advanced agentic customer acquisition and sales acceleration platform for businesses.",
  services: "Voice automation agents, AI WhatsApp lead qualification, automated SEO blogs, and marketing dashboards.",
  offer_details: "Get a free 14-day voice conversation trial package with zero setup fees.",
  industry: "Information Technology and Software Solutions",
  language: "english" as Language,
  customer_name: "Ravi Kiran",
  customer_type: "Warm Lead",
  campaign_goal: "Qualify interest in the AI sales platform and schedule a 15-minute product demonstration call.",
  voice_type: "female" as VoiceType,
};

function VoiceConversationStudioPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [session, setSession] = useState<StartResponse["session"] | null>(null);
  const [sessionSummary, setSessionSummary] = useState<EndResponse | null>(null);
  const [leadScore, setLeadScore] = useState(50);
  const [sentiment, setSentiment] = useState("neutral");
  const [turnCount, setTurnCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingNextListenRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (!session) {
      return;
    }

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [session?.session_id]);

  useEffect(() => {
    return () => {
      cleanupRecorder();
      stopCurrentAudio();
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, []);

  const token = () => localStorage.getItem("saadhyam_token");

  const joinUrl = (audioPath: string) => {
    if (audioPath.startsWith("http")) {
      return audioPath;
    }
    return `${env.apiBaseUrl}${audioPath}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const cleanupRecorder = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (recordingError) {
        console.warn("Could not stop recorder", recordingError);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const playAssistantAudio = async (audioUrl: string) => {
    stopCurrentAudio();
    const audio = new Audio(joinUrl(audioUrl));
    audioRef.current = audio;
    setIsPlayingAudio(true);

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        setIsPlayingAudio(false);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        audioRef.current = null;
        reject(new Error("Failed to play audio"));
      };
      audio.play().catch((playError) => {
        setIsPlayingAudio(false);
        audioRef.current = null;
        reject(playError);
      });
    });
  };

  const appendMessage = (message: ConversationMessage) => {
    setMessages((current) => [...current, message]);
  };

  const startListening = async () => {
    if (!session || isRecording || isProcessing || isPlayingAudio) {
      return;
    }

    try {
      setError("");
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
      const mimeType = preferredMimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        if (!chunksRef.current.length) {
          setError("No speech detected. Try again.");
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        await sendAudioTurn(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
      toast.success("Listening for the customer response");
    } catch (listenError) {
      console.error(listenError);
      setError("Microphone access failed. Grant permission and try again.");
      toast.error("Microphone access failed");
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const sendAudioTurn = async (audioBlob: Blob) => {
    if (!session) {
      return;
    }

    try {
      setIsProcessing(true);
      stopCurrentAudio();

      const formData = new FormData();
      formData.append("call_id", String(session.call_id));
      formData.append("language", session.language);
      formData.append("conversation_history", JSON.stringify(messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))));
      formData.append("customer_audio", audioBlob, "customer-response.webm");

      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/conversation/local/turn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token() || ""}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process turn (${response.status})`);
      }

      const data = (await response.json()) as TurnResponse;
      const customerMessage: ConversationMessage = {
        role: "user",
        content: data.turn.customer_text,
        timestamp: new Date().toISOString(),
        intent: data.turn.intent,
        sentiment: data.turn.sentiment,
      };
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: data.response.text,
        timestamp: new Date().toISOString(),
        sentiment: data.turn.sentiment,
        intent: data.turn.intent,
        audioUrl: data.response.audio_url,
      };

      appendMessage(customerMessage);
      appendMessage(assistantMessage);
      setTurnCount((value) => value + 1);
      setSentiment(data.turn.sentiment);

      if (data.turn.intent === "interested") {
        setLeadScore((value) => Math.min(100, value + 15));
      } else if (data.turn.intent === "needs_info") {
        setLeadScore((value) => Math.min(100, value + 5));
      } else if (data.turn.intent === "not_interested") {
        setLeadScore((value) => Math.max(0, value - 20));
      }

      await playAssistantAudio(data.response.audio_url);
      if (autoListen && data.turn.should_continue) {
        pendingNextListenRef.current = true;
        window.setTimeout(() => {
          if (pendingNextListenRef.current) {
            pendingNextListenRef.current = false;
            void startListening();
          }
        }, 350);
      }
    } catch (turnError) {
      console.error(turnError);
      setError("Failed to process the recorded turn.");
      toast.error("Could not process the turn");
    } finally {
      setIsProcessing(false);
    }
  };

  const startSession = async () => {
    if (isStarting) {
      return;
    }

    try {
      setIsStarting(true);
      setError("");
      setSessionSummary(null);
      setMessages([]);
      setLeadScore(50);
      setSentiment("neutral");
      setTurnCount(0);
      setElapsedSeconds(0);
      setRecordingSeconds(0);
      pendingNextListenRef.current = false;

      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/conversation/local/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token() || ""}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session (${response.status})`);
      }

      const data = (await response.json()) as StartResponse;
      setSession(data.session);
      appendMessage({
        role: "assistant",
        content: data.greeting.text,
        timestamp: new Date().toISOString(),
        sentiment: "positive",
        intent: "greeting",
        audioUrl: data.greeting.audio_url,
      });
      toast.success("Voice session started");
      await playAssistantAudio(data.greeting.audio_url);
      if (autoListen) {
        window.setTimeout(() => {
          void startListening();
        }, 350);
      }
    } catch (startError) {
      console.error(startError);
      setError("Could not start the conversation session.");
      toast.error("Session start failed");
    } finally {
      setIsStarting(false);
    }
  };

  const endSession = async () => {
    try {
      pendingNextListenRef.current = false;
      if (isRecording) {
        stopListening();
        return;
      }

      if (!session) {
        return;
      }

      setIsProcessing(true);
      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/conversation/local/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token() || ""}`,
        },
        body: JSON.stringify({
          call_id: session.call_id,
          conversation_history: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          final_note: "Local browser voice conversation completed.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end session (${response.status})`);
      }

      const data = (await response.json()) as EndResponse;
      setSessionSummary(data);
      setSession(null);
      appendMessage({
        role: "assistant",
        content: `Session summary: ${data.summary}`,
        timestamp: new Date().toISOString(),
        sentiment: data.sentiment,
        intent: data.lead ? "qualified_lead" : "completed",
      });
      toast.success("Session finalized");
    } catch (endError) {
      console.error(endError);
      setError("Failed to finalize the session.");
      toast.error("Could not end the session");
    } finally {
      setIsProcessing(false);
      cleanupRecorder();
      stopCurrentAudio();
    }
  };

  const resetStudio = () => {
    cleanupRecorder();
    stopCurrentAudio();
    setMessages([]);
    setSession(null);
    setSessionSummary(null);
    setLeadScore(50);
    setSentiment("neutral");
    setTurnCount(0);
    setElapsedSeconds(0);
    setRecordingSeconds(0);
    setError("");
    pendingNextListenRef.current = false;
  };

  const downloadTranscript = () => {
    const transcript = messages
      .map((message) => `${message.role === "user" ? "Customer" : "Agent"}: ${message.content}`)
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `voice-conversation-${session?.session_id || "session"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const getSentimentBadge = () => {
    if (sentiment === "positive") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (sentiment === "negative") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getLeadScoreColor = () => {
    if (leadScore >= 70) {
      return "text-emerald-600";
    }
    if (leadScore >= 40) {
      return "text-amber-600";
    }
    return "text-rose-600";
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
              <Sparkles size={14} />
              Browser voice studio
            </div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Voice Conversation Studio</h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Run a live browser mic loop with Whisper transcription, Gemini response generation, and playable TTS output.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={downloadTranscript} disabled={!messages.length}>
              <Download size={16} className="mr-2" />
              Export Transcript
            </Button>
            <Button variant="outline" onClick={resetStudio}>
              <RefreshCw size={16} className="mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Conversation Setup</CardTitle>
                    <p className="text-sm text-slate-500">Configure the business context before starting the session.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getSentimentBadge()}>{sentiment} sentiment</Badge>
                    <Badge variant="outline" className={getLeadScoreColor()}>
                      Lead score {leadScore}
                    </Badge>
                    <Badge variant="outline">{turnCount} turns</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Session Name (Optional)</label>
                    <Input
                      value={form.session_name}
                      onChange={(event) => setForm((current) => ({ ...current, session_name: event.target.value }))}
                      placeholder="Live test session name..."
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Business Name</label>
                    <Input
                      value={form.business_name}
                      onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
                      placeholder="e.g. ABC Solar"
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Industry</label>
                    <Input
                      value={form.industry}
                      onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                      placeholder="e.g. Renewable Energy"
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Business Description</label>
                    <Textarea
                      value={form.business_description}
                      onChange={(event) => setForm((current) => ({ ...current, business_description: event.target.value }))}
                      placeholder="What does your business do?"
                      rows={2}
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Services</label>
                    <Textarea
                      value={form.services}
                      onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))}
                      placeholder="What services do you offer?"
                      rows={2}
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Offers</label>
                    <Textarea
                      value={form.offer_details}
                      onChange={(event) => setForm((current) => ({ ...current, offer_details: event.target.value }))}
                      placeholder="Current offers/discounts"
                      rows={2}
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer Name</label>
                    <Input
                      value={form.customer_name}
                      onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                      placeholder="e.g. Ravi Kiran"
                      disabled={!!session}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer Type</label>
                    <select
                      value={form.customer_type}
                      onChange={(event) => setForm((current) => ({ ...current, customer_type: event.target.value }))}
                      disabled={!!session}
                      className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white"
                    >
                      <option value="Cold Lead">Cold Lead</option>
                      <option value="Warm Lead">Warm Lead</option>
                      <option value="Inbound Lead">Inbound Lead</option>
                      <option value="Existing Customer">Existing Customer</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Campaign Goal</label>
                    <Textarea
                      value={form.campaign_goal}
                      onChange={(event) => setForm((current) => ({ ...current, campaign_goal: event.target.value }))}
                      placeholder="e.g. Get client to book a site inspection"
                      rows={2}
                      disabled={!!session}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Language</p>
                    <div className="flex flex-wrap gap-2">
                      {(["english", "hinglish", "telugu"] as Language[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, language: value }))}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${form.language === value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Voice type</p>
                    <div className="flex flex-wrap gap-2">
                      {(["female", "male"] as VoiceType[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, voice_type: value }))}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${form.voice_type === value ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                  {!session ? (
                    <Button
                      onClick={startSession}
                      disabled={isStarting}
                      className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-cyan-700"
                    >
                      {isStarting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Phone size={16} className="mr-2" />}
                      Start voice session
                    </Button>
                  ) : (
                    <Button
                      onClick={endSession}
                      disabled={isProcessing}
                      variant="destructive"
                      className="shadow-lg shadow-rose-500/20"
                    >
                      <PhoneOff size={16} className="mr-2" />
                      End session
                    </Button>
                  )}

                  {session && (
                    <Button
                      onClick={isRecording ? stopListening : startListening}
                      disabled={isProcessing || isPlayingAudio}
                      variant={isRecording ? "destructive" : "outline"}
                    >
                      {isRecording ? <Square size={16} className="mr-2" /> : <Mic size={16} className="mr-2" />}
                      {isRecording ? "Stop recording" : "Record response"}
                    </Button>
                  )}

                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={autoListen}
                      onChange={(event) => setAutoListen(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600"
                    />
                    Auto-listen after playback
                  </label>

                  {isPlayingAudio && (
                    <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                      <Volume2 size={14} className="mr-1" />
                      Playing response
                    </Badge>
                  )}

                  {isRecording && (
                    <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                      <Mic size={14} className="mr-1 animate-pulse" />
                      Recording {formatTime(recordingSeconds)}
                    </Badge>
                  )}

                  {isProcessing && (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      <Loader2 size={14} className="mr-1 animate-spin" />
                      Processing
                    </Badge>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-violet-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Conversation</CardTitle>
                    <p className="text-sm text-slate-500">Speak, wait for the response audio, and continue the loop.</p>
                  </div>
                  {session && (
                    <div className="text-right text-xs text-slate-500">
                      <div>Session {session.session_id}</div>
                      <div>{formatTime(elapsedSeconds)} elapsed</div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex h-[560px] flex-col p-0">
                {session && (
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden h-32">
                    {/* Grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
                    
                    {/* Pulse Status Glow */}
                    <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      isRecording ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                      isPlayingAudio ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                      isProcessing ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isRecording ? "bg-rose-500 animate-ping" :
                        isPlayingAudio ? "bg-cyan-500 animate-pulse" :
                        isProcessing ? "bg-amber-500 animate-spin" :
                        "bg-violet-500"
                      }`}></span>
                      {isRecording ? "Listening (Customer Speaking)" :
                       isPlayingAudio ? "Speaking (AI Speaking)" :
                       isProcessing ? "Thinking..." : "Connected"}
                    </div>

                    {/* Animated Sound Wave */}
                    <div className="flex items-center gap-1.5 h-10 mt-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
                        let duration = 0.5 + Math.random() * 1.5;
                        let height = "h-2";
                        let color = "bg-violet-500";
                        
                        if (isRecording) {
                          height = "h-8";
                          color = "bg-rose-500";
                        } else if (isPlayingAudio) {
                          height = "h-10";
                          color = "bg-cyan-400 shadow-[0_0_12px_#22d3ee]";
                        } else if (isProcessing) {
                          height = "h-4";
                          color = "bg-amber-400 animate-pulse";
                        }
                        
                        return (
                          <motion.div
                            key={bar}
                            className={`w-1 rounded-full ${color}`}
                            animate={isRecording || isPlayingAudio ? {
                              height: ["10%", "90%", "30%", "100%", "10%"]
                            } : {
                              height: ["20%", "40%", "20%"]
                            }}
                            transition={{
                              duration: duration,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: bar * 0.05
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="text-xs text-slate-400 mt-2 font-mono tracking-widest uppercase">
                      {isRecording ? "CUSTOMER AUDIO IN" : isPlayingAudio ? "AI AUDIO OUT" : "AI ENGINE STANDBY"}
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700">
                        <Bot size={28} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">No conversation yet</h3>
                      <p className="mt-2 max-w-md text-sm text-slate-500">
                        Start the session to generate a greeting. After the greeting audio plays, the studio will arm the microphone for your response.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={`${message.role}-${index}-${message.timestamp}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.24 }}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${message.role === "user" ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white" : "border border-slate-200 bg-white text-slate-900"}`}>
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.role === "user" ? "bg-white/20" : "bg-violet-100 text-violet-700"}`}>
                                  {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2 text-xs opacity-80">
                                    <span className="font-semibold uppercase tracking-wide">{message.role === "user" ? "Customer" : "Agent"}</span>
                                    <span>•</span>
                                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                                  {(message.intent || message.sentiment) && (
                                    <div className={`flex flex-wrap gap-2 text-xs ${message.role === "user" ? "text-white/80" : "text-slate-500"}`}>
                                      {message.intent && <span>Intent: {message.intent}</span>}
                                      {message.sentiment && <span>Sentiment: {message.sentiment}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin text-violet-600" />
                              Processing audio and generating the next response...
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50/80 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-violet-600" />
                      <span>{session ? "Live browser loop is active" : "Session is idle"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Lead score: <strong className={getLeadScoreColor()}>{leadScore}</strong></span>
                      <span>Duration: {formatTime(elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-cyan-50">
                <CardTitle className="text-lg text-slate-900">Session status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">State</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {session ? (isRecording ? "Recording" : isPlayingAudio ? "Playing" : isProcessing ? "Processing" : "Live") : "Idle"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Turns</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{turnCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sentiment</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{sentiment}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lead score</p>
                    <p className={`mt-1 text-base font-semibold ${getLeadScoreColor()}`}>{leadScore}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  The workflow uses the backend Whisper path for transcription, Gemini or Groq for the reply, and the backend TTS fallback chain for playable audio.
                </div>

                {session && (
                  <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <div><strong className="text-slate-900">Campaign:</strong> {session.campaign_name}</div>
                    <div><strong className="text-slate-900">Business:</strong> {session.business_name}</div>
                    <div><strong className="text-slate-900">Language:</strong> {session.language}</div>
                    <div><strong className="text-slate-900">Voice:</strong> {session.voice_type}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {sessionSummary && (
              <Card className="border-emerald-200 bg-emerald-50/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <CardHeader className="border-b border-emerald-100">
                  <CardTitle className="text-lg text-emerald-900">Final summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5 text-sm text-emerald-900">
                  <p>{sessionSummary.summary}</p>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <div><strong>Sentiment:</strong> {sessionSummary.sentiment}</div>
                    <div><strong>Lead:</strong> {sessionSummary.lead ? `${sessionSummary.lead.status} (${sessionSummary.lead.lead_score})` : "No lead created"}</div>
                    <div><strong>Call status:</strong> {sessionSummary.call.status}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-lg text-slate-900">Quick guidance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-slate-600">
                <p>1. Fill the context fields with the exact business scenario you want to test.</p>
                <p>2. Start the session and wait for the greeting audio to finish.</p>
                <p>3. Click Record response, speak into the microphone, then stop recording.</p>
                <p>4. The backend returns the transcript, the AI reply, and the TTS audio for playback.</p>
                <p>5. End the session to persist the call summary and lead outcome.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

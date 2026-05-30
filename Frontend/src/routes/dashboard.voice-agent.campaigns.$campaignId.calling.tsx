import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, Fragment, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Pause,
  Play,
  Square,
  PhoneCall,
  PhoneOff,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Smile,
  Meh,
  Frown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { env } from "@/config/env";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns/$campaignId/calling")({
  component: CallingInterfacePage,
});

interface CallProgress {
  campaign_id: number;
  campaign_name: string;
  status: string;
  total_contacts: number;
  completed: number;
  failed: number;
  queued: number;
  in_progress: number;
  progress_percentage: number;
  current_call: {
    call_id: number;
    contact_name: string;
    phone_number: string;
    status: string;
    started_at: string;
    duration_seconds: number;
  } | null;
  stats_by_status: Record<string, number>;
}

const parseTranscriptLines = (transcriptStr: string) => {
  if (!transcriptStr) return [];
  return transcriptStr.split('\n').map(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const speaker = parts[0].trim();
      const text = parts.slice(1).join(':').trim();
      return { speaker, text };
    }
    return { speaker: 'Unknown', text: line };
  });
};

function CallingInterfacePage() {
  const navigate = useNavigate();
  const { campaignId } = Route.useParams();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);
  const autoLaunchModeKey = `voice-campaign-auto-mode:${campaignId}`;
  
  // Voice Simulation & Interactive Mic States
  const [interactionMode, setInteractionMode] = useState<'mic' | 'sim'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(autoLaunchModeKey) === 'sim') {
      return 'sim';
    }
    return 'mic';
  });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [simulatedCallId, setSimulatedCallId] = useState<number | null>(null);
  const [speakerStatus, setSpeakerStatus] = useState<'idle' | 'ringing' | 'connected' | 'completed'>('idle');
  const [dialogueMessages, setDialogueMessages] = useState<Array<{ role: 'agent' | 'customer', text: string }>>([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isSimSpeaking, setIsSimSpeaking] = useState(false);

  // Mic Call Tracking
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<number>(0);
  const [isMicCallActive, setIsMicCallActive] = useState(false);

  // Refs to handle async state and SpeechRecognition callbacks without stale closures
  const isMicCallActiveRef = useRef(isMicCallActive);
  const isProcessingSpeechRef = useRef(false);
  const dialogueMessagesRef = useRef(dialogueMessages);
  const isSimSpeakingRef = useRef(isSimSpeaking);
  const progressRef = useRef<any>(null);
  const campaignRef = useRef<any>(null);
  const handleUserSpeechRef = useRef<any>(null);
  const silenceCountRef = useRef(0);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    isMicCallActiveRef.current = isMicCallActive;
    if (!isMicCallActive) {
      isProcessingSpeechRef.current = false;
    }
  }, [isMicCallActive]);

  useEffect(() => {
    dialogueMessagesRef.current = dialogueMessages;
  }, [dialogueMessages]);

  useEffect(() => {
    isSimSpeakingRef.current = isSimSpeaking;
  }, [isSimSpeaking]);

  // Campaign Report States
  const [viewingReport, setViewingReport] = useState(false);
  const [selectedCallIdForTranscript, setSelectedCallIdForTranscript] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(autoLaunchModeKey);
    }
  }, [autoLaunchModeKey]);

  // Fetch campaign details
  const { data: campaignData } = useQuery<{ success: boolean; campaign: any }>({
    queryKey: ["voice-campaign", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch campaign");
      return response.json();
    },
  });

  const campaign = campaignData?.campaign;

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  // Fetch call progress with auto-refresh
  const { data: progressData, isLoading } = useQuery<{ success: boolean; progress: CallProgress }>({
    queryKey: ["voice-campaign-call-progress", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/call-progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });

  const progress = progressData?.progress;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const getScriptValue = (label: string) => {
    const script = campaign?.script_template || "";
    const line = script
      .split(/\r?\n/)
      .find((entry: string) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

  const campaignContext = {
    business: getScriptValue("Business") || campaign?.name || "Campaign",
    purpose: getScriptValue("Purpose") || campaign?.description || "Lead engagement",
    offer: getScriptValue("Offer") || "Campaign offer",
  };

  // Fetch campaign calls list for the report
  const { data: callsResponse } = useQuery<{ success: boolean; total: number; calls: any[] }>({
    queryKey: ["voice-campaign-calls", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/calls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch campaign calls");
      return response.json();
    },
    enabled: !!progress && (progress.status === "completed" || viewingReport),
  });

  const calls = callsResponse?.calls || [];

  // Cancel speech synthesis on cleanup
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text: string, voiceType: string, language: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    
    // Clear silence timer while speaking!
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    // Store utterance reference globally to prevent garbage collection
    (window as any).activeUtterance = utterance;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    let langCode = 'en-US';
    if (language === 'telugu') langCode = 'te-IN';
    else if (language === 'hindi' || language === 'hinglish') langCode = 'hi-IN';
    else if (language === 'tamil') langCode = 'ta-IN';
    
    utterance.lang = langCode;
    
    const langPrefix = langCode.split('-')[0].toLowerCase();
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    
    if (langVoices.length > 0) {
      const genderMatch = langVoices.find(v => {
        const name = v.name.toLowerCase();
        if (voiceType === 'female') {
          return name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('google');
        } else {
          return name.includes('male') || name.includes('david') || name.includes('microsoft');
        }
      });
      selectedVoice = genderMatch || langVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onend = () => {
      (window as any).activeUtterance = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      (window as any).activeUtterance = null;
      if (onEnd) onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API - SpeechRecognition Setup
  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      let recLangCode = 'en-US';
      const campaignLang = campaign?.language;
      if (campaignLang === 'telugu') recLangCode = 'te-IN';
      else if (campaignLang === 'hindi' || campaignLang === 'hinglish') recLangCode = 'hi-IN';
      else if (campaignLang === 'tamil') recLangCode = 'ta-IN';
      
      rec.lang = recLangCode;
      
      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };
      
      rec.onspeechstart = () => {
        console.log("Speech started. Cancelling silence timeout timer.");
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError("Microphone access blocked. Please enable permissions.");
        }
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
        // Robustly auto-restart if mic call is active and we are not processing a response or speaking
        if (isMicCallActiveRef.current && !isProcessingSpeechRef.current && !isSimSpeakingRef.current) {
          console.log("Speech recognition stopped. Restarting...");
          // Wait a tiny bit to avoid busy loops
          setTimeout(() => {
            if (isMicCallActiveRef.current && !isProcessingSpeechRef.current && !isSimSpeakingRef.current) {
              startListening();
            }
          }, 300);
        }
      };
      
      setRecognition(rec);
    }
  }, [campaign?.language]);

  const handleSilenceTimeout = () => {
    if (!isMicCallActiveRef.current) return;
    
    console.log("Silence timeout triggered. Silence count:", silenceCountRef.current + 1);

    // Stop recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Error stopping recognition on silence:", err);
      }
    }

    silenceCountRef.current += 1;

    if (silenceCountRef.current < 3) {
      const lang = campaignRef.current?.language || "english";
      let repromptText = "Hello? I didn't catch that. Could you please repeat?";
      
      if (lang === "telugu") {
        repromptText = "హలో? నాకు వినపడలేదు. దయచేసి మళ్ళీ చెప్పగలరా?";
      } else if (lang === "hindi" || lang === "hinglish") {
        repromptText = "हैलो? मुझे सुनाई नहीं दिया। क्या आप कृपया दोहरा सकते हैं?";
      } else if (lang === "tamil") {
        repromptText = "ஹலோ? எனக்கு கேட்கவில்லை. தயவுசெய்து மீண்டும் சொல்ல முடியுமா?";
      }
      
      if (silenceCountRef.current === 2) {
        if (lang === "telugu") {
          repromptText = "మీరు అక్కడ ఉన్నారా? నాకు వినపడడం లేదు.";
        } else if (lang === "hindi" || lang === "hinglish") {
          repromptText = "क्या आप वहां हैं? मुझे आपकी आवाज़ नहीं आ रही है।";
        } else if (lang === "tamil") {
          repromptText = "நீங்கள் அங்கிருக்கிறீர்களா? எனக்கு கேட்கவில்லை.";
        } else {
          repromptText = "Are you still there? I'm having trouble hearing you.";
        }
      }

      setIsSimSpeaking(true);
      const currentCampaign = campaignRef.current;
      speak(
        repromptText,
        currentCampaign?.voice_type || "female",
        currentCampaign?.language || "english",
        () => {
          setIsSimSpeaking(false);
          if (!isMicCallActiveRef.current) return;
          startListening();
        }
      );
    } else {
      // Max silence limit reached
      const goodbyeText = "I'm having trouble hearing you. Let's connect later. Goodbye!";
      setIsSimSpeaking(true);
      const currentCampaign = campaignRef.current;
      speak(
        goodbyeText,
        currentCampaign?.voice_type || "female",
        currentCampaign?.language || "english",
        () => {
          setIsSimSpeaking(false);
          handleHangUp();
        }
      );
    }
  };

  const startListening = () => {
    if (!isMicCallActiveRef.current) {
      console.log("startListening called but call is inactive");
      return;
    }

    // Set silence timer
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      handleSilenceTimeout();
    }, 8000); // 8 seconds silence threshold

    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    } else {
      toast.error("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
    }
  };

  const handleUserSpeech = async (speechText: string) => {
    const currentProgress = progressRef.current;
    if (!speechText.trim() || !currentProgress?.current_call) return;
    
    if (isProcessingSpeechRef.current) {
      console.log("Already processing speech, ignoring:", speechText);
      return;
    }
    isProcessingSpeechRef.current = true;

    // Clear silence timer because the user spoke!
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceCountRef.current = 0; // Reset silence count

    // Stop recognition immediately so we don't listen while generating/speaking
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Error stopping recognition during user speech:", err);
      }
    }

    // Add user speech to dialogue messages using the latest messages ref
    const updatedMessages = [...dialogueMessagesRef.current, { role: 'customer' as const, text: speechText }];
    setDialogueMessages(updatedMessages);
    setIsSimSpeaking(true);
    
    try {
      const historyForBackend = updatedMessages.map(msg => ({
        role: msg.role === 'customer' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/voice-agent/conversation/generate-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          campaign_id: parseInt(campaignId),
          customer_message: speechText,
          conversation_history: historyForBackend
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiReply = data.response || "I see. Thank you.";
        
        // Double check call active status after async API call
        if (!isMicCallActiveRef.current) {
          console.log("Call is no longer active after response generation, discarding AI response");
          isProcessingSpeechRef.current = false;
          return;
        }

        // Add AI response
        const withAiReply = [...updatedMessages, { role: 'agent' as const, text: aiReply }];
        setDialogueMessages(withAiReply);
        
        // Speak AI response
        const currentCampaign = campaignRef.current;
        speak(aiReply, currentCampaign?.voice_type || 'female', currentCampaign?.language || 'english', () => {
          setIsSimSpeaking(false);
          isProcessingSpeechRef.current = false;
          
          // Double check call active status before deciding next action
          if (!isMicCallActiveRef.current) {
            console.log("Call is no longer active after speaking, skipping next action");
            return;
          }

          const lowerReply = aiReply.toLowerCase();
          const shouldEnd = lowerReply.includes("goodbye") || lowerReply.includes("have a great day") || lowerReply.includes("bye");
          if (shouldEnd) {
            handleHangUp(withAiReply);
          } else {
            startListening();
          }
        });
      } else {
        isProcessingSpeechRef.current = false;
        throw new Error("Failed to generate AI response");
      }
    } catch (err) {
      console.error(err);
      setIsSimSpeaking(false);
      isProcessingSpeechRef.current = false;
      toast.error("Error communicating with AI agent");
    }
  };

  useEffect(() => {
    handleUserSpeechRef.current = handleUserSpeech;
  }, [handleUserSpeech]);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => {
      if (isSimSpeakingRef.current) {
        console.log("AI is speaking. Ignoring result to prevent echo feedback.");
        return;
      }
      const results = event.results;
      const lastResult = results[results.length - 1];
      if (lastResult && lastResult.isFinal) {
        const speechText = lastResult[0].transcript;
        handleUserSpeechRef.current(speechText);
      }
    };
  }, [recognition]);

  // Handle start mic call
  const handleStartMicCall = async () => {
    if (!progress?.current_call) return;
    const callId = progress.current_call.call_id;
    setCallStartTime(new Date().getTime());
    setIsMicCallActive(true);
    setSpeakerStatus('ringing');
    setDialogueMessages([]);
    
    silenceCountRef.current = 0;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Update call status to connected in DB
    try {
      const token = localStorage.getItem("saadhyam_token");
      await fetch(`${env.apiBaseUrl}/api/voice-agent/calls/${callId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "connected"
        })
      });
    } catch (err) {
      console.error("Failed to connect call in DB:", err);
    }
    
    if (audioEnabled) {
      speak("Calling " + progress.current_call.contact_name, campaign?.voice_type || 'female', campaign?.language || 'english');
    }
    
    // Connect call after 2.5 seconds
    setTimeout(() => {
      if (!isMicCallActiveRef.current) {
        console.log("Call was hung up during ringing, aborting connect simulation");
        return;
      }
      setSpeakerStatus('connected');
      
      const lang = campaignRef.current?.language || 'english';
      let greeting = `Hello, am I speaking with ${progress.current_call?.contact_name}?`;
      if (lang === 'telugu') {
        greeting = `హలో, నేను దయచేసి ${progress.current_call?.contact_name} గారితో మాట్లాడవచ్చా?`;
      } else if (lang === 'tamil') {
        greeting = `ஹலோ, நான் ${progress.current_call?.contact_name} அவர்களிடம் பேசலாமா?`;
      } else if (lang === 'hindi' || lang === 'hinglish') {
        greeting = `हैलो, क्या मैं ${progress.current_call?.contact_name} जी से बात कर सकता हूँ?`;
      }
      
      setDialogueMessages([{ role: 'agent', text: greeting }]);
      setIsSimSpeaking(true);
      
      if (audioEnabled) {
        speak(greeting, campaign?.voice_type || 'female', campaign?.language || 'english', () => {
          setIsSimSpeaking(false);
          if (!isMicCallActiveRef.current) {
            console.log("Call was hung up during greeting, aborting listen start");
            return;
          }
          startListening();
        });
      } else {
        setTimeout(() => {
          if (!isMicCallActiveRef.current) return;
          setIsSimSpeaking(false);
          startListening();
        }, 2000);
      }
    }, 2500);
  };

  const handleHangUp = async (messagesOverride?: any) => {
    if (!progress?.current_call) return;
    const callId = progress.current_call.call_id;
    setSpeakerStatus('completed');
    setIsMicCallActive(false);
    setIsListening(false);
    
    // Clear silence timer and reset count
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceCountRef.current = 0;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognition) {
      try { recognition.stop(); } catch(e){}
    }
    
    const finalMessages = messagesOverride || dialogueMessages;
    const transcriptStr = finalMessages.map((msg: any) => 
      `${msg.role === 'customer' ? 'Customer' : 'Agent'}: ${msg.text}`
    ).join('\n');
    
    let outcome = "not_interested";
    const lowerTranscript = transcriptStr.toLowerCase();
    if (lowerTranscript.includes("interested") || lowerTranscript.includes("sure") || lowerTranscript.includes("yes") || lowerTranscript.includes("demo")) {
      outcome = "interested";
    } else if (lowerTranscript.includes("later") || lowerTranscript.includes("call back") || lowerTranscript.includes("tomorrow")) {
      outcome = "callback_requested";
    }
    
    const sentiment = outcome === "interested" ? "positive" : (outcome === "not_interested" ? "negative" : "neutral");
    const summary = `Interactive test call completed. Sentiment: ${sentiment}. Outcome: ${outcome}.`;
    const duration = Math.round((new Date().getTime() - callStartTime) / 1000) || 15;
    
    try {
      const token = localStorage.getItem("saadhyam_token");
      await fetch(`${env.apiBaseUrl}/api/voice-agent/calls/${callId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "completed",
          duration: duration,
          transcript: transcriptStr,
          summary: summary,
          sentiment: sentiment,
          outcome: outcome
        })
      });
      toast.success("Test call data saved!");
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-call-progress", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-calls", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["voice-campaign", campaignId] });
    } catch (err) {
      console.error("Failed to save call details:", err);
      toast.error("Failed to save call details to database");
    }
  };

  // Manage auto-simulation call state transitions
  useEffect(() => {
    if (interactionMode !== 'sim') return;
    
    if (!progress?.current_call) {
      if (speakerStatus === 'connected') {
        setSpeakerStatus('completed');
        if (audioEnabled) {
          speak("Call hung up.", campaign?.voice_type || 'female', campaign?.language || 'english');
        }
      }
      return;
    }

    const activeCall = progress.current_call;
    if (activeCall.call_id !== simulatedCallId) {
      setSimulatedCallId(activeCall.call_id);
      setSpeakerStatus('ringing');
      setDialogueIndex(0);
      
      const businessName = campaign?.script_template?.split('\n')
        ?.find((l: string) => l.startsWith('Business:'))?.replace('Business:', '')?.trim() || "Saadhyam AI";
      const offer = campaign?.script_template?.split('\n')
        ?.find((l: string) => l.startsWith('Offer:'))?.replace('Offer:', '')?.trim() || "free trial";
      const purpose = campaign?.script_template?.split('\n')
        ?.find((l: string) => l.startsWith('Purpose:'))?.replace('Purpose:', '')?.trim() || "product validation";

      const lang = campaign?.language || 'english';
      let customDialogue = [];

      if (lang === 'telugu') {
        const opening = `హలో, నేను దయచేసి ${activeCall.contact_name} గారితో మాట్లాడవచ్చా?`;
        const pitch = `నమస్కారం ${activeCall.contact_name} గారు, నేను ${businessName} నుండి కాల్ చేస్తున్నాను. మా దగ్గర ${purpose} గురించి ఒక అద్భుతమైన ఆఫర్ ఉందండి: ${offer}. దీని గురించి మాట్లాడటానికి మీకు కొంచెం సమయం ఉందా?`;
        
        customDialogue = [
          { role: 'agent' as const, text: opening },
          { role: 'customer' as const, text: `అవును, నేను ${activeCall.contact_name} నే మాట్లాడుతున్నాను. ఎవరండీ?` },
          { role: 'agent' as const, text: pitch },
          { role: 'customer' as const, text: `అవునా, అది చాలా బాగుంది! నాకు మరిన్ని వివరాలు చెప్పగలరా?` },
          { role: 'agent' as const, text: `ఖచ్చితంగా అండి! ఇది పూర్తిగా ఆటోమేటెడ్ సిస్టమ్, ఇది కస్టమర్ల అనుభవాన్ని మెరుగుపరుస్తుంది. మేము మీ కోసం ఒక డెమోని షెడ్యూల్ చేయవచ్చు.` },
          { role: 'customer' as const, text: `సరేనండి, అలాగే చేద్దాం. చాలా సహాయకరంగా ఉంటుంది.` },
          { role: 'agent' as const, text: `చాలా సంతోషం అండి! మీ ఆసక్తిని నేను నమోదు చేసుకున్నాను. మా బృందం త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు. శుభదినం!` },
          { role: 'customer' as const, text: `ధన్యవాదాలు, సెలవు.` }
        ];
      } else if (lang === 'tamil') {
        const opening = `ஹலோ, நான் ${activeCall.contact_name} அவர்களிடம் பேசலாமா?`;
        const pitch = `வணக்கம் ${activeCall.contact_name}, நான் ${businessName} இலிருந்து அழைக்கிறேன். எங்களிடம் ${purpose} பற்றிய ஒரு சிறந்த சலுகை உள்ளது: ${offer}. இது பற்றி பேச உங்களுக்கு நேரம் இருக்குமா?`;
        
        customDialogue = [
          { role: 'agent' as const, text: opening },
          { role: 'customer' as const, text: `ஆம், நான் தான் ${activeCall.contact_name} பேசுகிறேன். யார் இது?` },
          { role: 'agent' as const, text: pitch },
          { role: 'customer' as const, text: `அப்படியா, அது சுவாரஸ்யமாக இருக்கிறது! எனக்கு கூடுதல் விவரங்களை கூற முடியுமா?` },
          { role: 'agent' as const, text: `நிச்சயமாக! இது முழுமையாக தானியங்கி அமைப்பு ஆகும். உங்களுக்காக ஒரு விளக்கக்காட்சியை (டெமோ) நாங்கள் ஏற்பாடு செய்யலாம்.` },
          { role: 'customer' as const, text: `ஆம், தயவுசெய்து. அது மிகவும் பயனுள்ளதாக இருக்கும். அவ்வாறே செய்யலாம்.` },
          { role: 'agent' as const, text: `மிகவும் மகிழ்ச்சி! உங்கள் ஆர்வத்தை நான் பதிவு செய்துள்ளேன், எங்கள் குழு விரைவில் உங்களைத் தொடர்பு கொள்ளும். நல்ல நாள்!` },
          { role: 'customer' as const, text: `நன்றி, வணக்கம்.` }
        ];
      } else if (lang === 'hindi' || lang === 'hinglish') {
        const opening = `हैलो, क्या मैं ${activeCall.contact_name} जी से बात कर सकता हूँ?`;
        const pitch = `नमस्ते ${activeCall.contact_name} जी, मैं ${businessName} से कॉल कर रहा हूँ। हमारे पास ${purpose} और आपके लिए एक विशेष ऑफर है: ${offer}। क्या आपके पास थोड़ा समय है?`;
        
        customDialogue = [
          { role: 'agent' as const, text: opening },
          { role: 'customer' as const, text: `हाँ, मैं ${activeCall.contact_name} बोल रहा हूँ। आप कौन हैं?` },
          { role: 'agent' as const, text: pitch },
          { role: 'customer' as const, text: `अच्छा, यह तो दिलचस्प लग रहा है! क्या आप मुझे और जानकारी दे सकते हैं?` },
          { role: 'agent' as const, text: `बिलकुल! यह एक पूरी तरह से ऑटोमेटेड सिस्टम है। हम आपके लिए 15 मिनट का एक डेमो शेड्यूल कर सकते हैं।` },
          { role: 'customer' as const, text: `हाँ, ज़रूर। यह बहुत मददगार होगा। चलिए शेड्यूल करते हैं।` },
          { role: 'agent' as const, text: `बहुत बढ़िया! मैंने आपकी रुचि दर्ज कर ली है। हमारी टीम जल्द ही आपसे संपर्क करेगी। आपका दिन शुभ हो!` },
          { role: 'customer' as const, text: `धन्यवाद, अलविदा।` }
        ];
      } else {
        const opening = `Hello, am I speaking with ${activeCall.contact_name}?`;
        const pitch = `Hi ${activeCall.contact_name}, I'm calling from ${businessName}. We are running a campaign about ${purpose} and wanted to share our exclusive offer: ${offer}. Do you have a moment to talk?`;
        
        customDialogue = [
          { role: 'agent' as const, text: opening },
          { role: 'customer' as const, text: `Yes, this is ${activeCall.contact_name}. Who is this?` },
          { role: 'agent' as const, text: pitch },
          { role: 'customer' as const, text: `Oh, that sounds interesting! Can you tell me more details?` },
          { role: 'agent' as const, text: `Yes! It's a fully automated system that handles client engagement locally. We can schedule a personalized 15-minute demo to walk you through it.` },
          { role: 'customer' as const, text: `Yes, please. That would be very helpful. Let's do that.` },
          { role: 'agent' as const, text: `Fantastic! I have noted your interest and our team will get in touch with you shortly. Have a great day!` },
          { role: 'customer' as const, text: `Thank you, you too. Goodbye.` }
        ];
      }
      
      setDialogueMessages(customDialogue);
      
      if (audioEnabled) {
        const ringingMsg = lang === 'telugu' ? `కాల్ కనెక్ట్ అవుతోంది ` + activeCall.contact_name :
                           lang === 'tamil' ? `அழைப்பு இணைக்கப்படுகிறது ` + activeCall.contact_name :
                           lang === 'hindi' || lang === 'hinglish' ? `कॉल कनेक्ट हो रही है ` + activeCall.contact_name :
                           "Ringing " + activeCall.contact_name;
        speak(ringingMsg, campaign?.voice_type || 'female', campaign?.language || 'english');
      }

      const timer = setTimeout(() => {
        setSpeakerStatus('connected');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [progress?.current_call?.call_id, campaign, interactionMode]);

  // Auto-simulation dialogue sequence progression
  useEffect(() => {
    if (interactionMode !== 'sim') return;
    if (speakerStatus !== 'connected' || dialogueIndex >= dialogueMessages.length) return;

    const currentMsg = dialogueMessages[dialogueIndex];
    
    if (currentMsg.role === 'agent') {
      setIsSimSpeaking(true);
      
      const delayTimer = setTimeout(() => {
        if (audioEnabled) {
          speak(
            currentMsg.text, 
            campaign?.voice_type || 'female', 
            campaign?.language || 'english',
            () => {
              setIsSimSpeaking(false);
              setDialogueIndex(prev => prev + 1);
            }
          );
        } else {
          const speechDelay = Math.max(2000, currentMsg.text.length * 50);
          const autoAdvance = setTimeout(() => {
            setIsSimSpeaking(false);
            setDialogueIndex(prev => prev + 1);
          }, speechDelay);
          return () => clearTimeout(autoAdvance);
        }
      }, 1000);
      
      return () => clearTimeout(delayTimer);
    } else {
      setIsSimSpeaking(true);
      const customerDelay = Math.max(2500, currentMsg.text.length * 40);
      
      const timer = setTimeout(() => {
        setIsSimSpeaking(false);
        setDialogueIndex(prev => prev + 1);
      }, customerDelay);
      
      return () => clearTimeout(timer);
    }
  }, [speakerStatus, dialogueIndex, dialogueMessages, audioEnabled, campaign, interactionMode]);

  // Reset call state when the current call changes
  const currentCallId = progress?.current_call?.call_id;
  useEffect(() => {
    if (currentCallId) {
      setSpeakerStatus('idle');
      setDialogueMessages([]);
      setDialogueIndex(0);
      setIsSimSpeaking(false);
      setIsMicCallActive(false);
      setIsListening(false);
    }
  }, [currentCallId]);

  // Auto-simulate call completion on dialogue end
  useEffect(() => {
    if (
      interactionMode === 'sim' &&
      speakerStatus === 'connected' &&
      dialogueMessages.length > 0 &&
      dialogueIndex >= dialogueMessages.length
    ) {
      const hangupTimer = setTimeout(() => {
        handleHangUp();
      }, 2000);
      return () => clearTimeout(hangupTimer);
    }
  }, [interactionMode, speakerStatus, dialogueIndex, dialogueMessages.length]);

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/pause-calling`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to pause campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-call-progress", campaignId] });
    },
  });

  // Resume campaign mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/resume-calling`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to resume campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-call-progress", campaignId] });
    },
  });

  // Stop polling when campaign is completed or paused
  useEffect(() => {
    if (progress) {
      if (progress.status === "completed" || progress.status === "paused") {
        setIsPolling(false);
      } else if (progress.status === "active") {
        setIsPolling(true);
      }
    }
  }, [progress?.status]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calling interface...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-6">
        <div className="text-center">
          <PhoneOff size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Calling Data</h2>
          <p className="text-gray-600 mb-4">Unable to load calling progress.</p>
          <Button onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns/$campaignId", params: { campaignId } })}>
            Back to Campaign
          </Button>
        </div>
      </div>
    );
  }

  const isActive = progress.status === "active";
  const isPaused = progress.status === "paused";
  const isCompleted = progress.status === "completed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6 rounded-3xl border border-gray-200 bg-white/90 p-4 md:p-6 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns/$campaignId", params: { campaignId } })}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{progress.campaign_name}</h1>
            <p className="text-gray-600 mt-1">Live Calling Interface</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {isActive && (
            <Button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
            >
              <Pause size={16} className="mr-2" />
              Pause Campaign
            </Button>
          )}
          {isPaused && (
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play size={16} className="mr-2" />
              Resume Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Context Workspace */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/80 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Campaign Call Workspace</CardTitle>
          <CardDescription>
            The calling flow opens here, speaks the configured context, and stores the final report back to the campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Business</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{campaignContext.business}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Purpose</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{campaignContext.purpose}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Offer</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{campaignContext.offer}</p>
          </div>
        </CardContent>
      </Card>

      {/* Calling Mode Toggle */}
      {!isCompleted && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white">MODE</Badge>
            <span className="text-sm font-semibold text-purple-900">
              {interactionMode === 'mic' ? "Talk Live (Interactive Mic Testing Mode)" : "Automated Background Calling Mode"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={interactionMode === 'mic' ? 'default' : 'outline'}
              onClick={() => {
                setInteractionMode('mic');
                setSpeakerStatus('idle');
                setIsMicCallActive(false);
              }}
              className={interactionMode === 'mic' ? 'bg-purple-600 hover:bg-purple-700 font-semibold' : 'text-purple-600 border-purple-600 font-semibold'}
            >
              <Mic size={14} className="mr-1.5" />
              Talk Live (Mic)
            </Button>
            <Button
              size="sm"
              variant={interactionMode === 'sim' ? 'default' : 'outline'}
              onClick={() => {
                setInteractionMode('sim');
                setSimulatedCallId(null);
              }}
              className={interactionMode === 'sim' ? 'bg-purple-600 hover:bg-purple-700 font-semibold' : 'text-purple-600 border-purple-600 font-semibold'}
            >
              <Play size={14} className="mr-1.5" />
              Auto-simulate
            </Button>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <Card className={`border-2 ${
        isActive ? "border-green-500 bg-green-50" :
        isPaused ? "border-yellow-500 bg-yellow-50" :
        isCompleted ? "border-blue-500 bg-blue-50" :
        "border-gray-300"
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive && (
                <>
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </div>
                  <span className="text-lg font-semibold text-green-700">🔴 Calling in Progress</span>
                </>
              )}
              {isPaused && (
                <>
                  <Pause className="text-yellow-600" size={20} />
                  <span className="text-lg font-semibold text-yellow-700">⏸️ Campaign Paused</span>
                </>
              )}
              {isCompleted && (
                <>
                  <CheckCircle className="text-blue-600" size={20} />
                  <span className="text-lg font-semibold text-blue-700">✅ Campaign Completed</span>
                </>
              )}
            </div>
            <Badge className="text-lg px-4 py-2">
              {progress.completed + progress.failed} / {progress.total_contacts} calls
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Campaign Progress</span>
              <span className="font-semibold text-purple-600">{(progress.progress_percentage ?? 0).toFixed(1)}%</span>
            </div>
            <Progress value={progress.progress_percentage} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="mx-auto mb-2 text-red-600" size={24} />
              <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl font-bold text-blue-600">{progress.queued}</p>
              <p className="text-sm text-gray-600">Queued</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <PhoneCall className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-2xl font-bold text-purple-600">{progress.in_progress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Call / Audio Monitor */}
      {progress.current_call && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-purple-500 h-full flex flex-col justify-between">
            <CardHeader className="bg-purple-50/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Phone className="text-purple-600 animate-pulse" size={24} />
                Current Call
              </CardTitle>
              <Badge className={`${
                speakerStatus === 'ringing' ? 'bg-amber-500' :
                speakerStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                speakerStatus === 'completed' ? 'bg-rose-500' : 'bg-purple-500'
              } text-white text-sm px-3 py-1 font-semibold`}>
                {speakerStatus.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact Name</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{progress.current_call.contact_name}</p>
                  </div>
                  
                  {/* Speaker Toggle */}
                  <Button
                    onClick={() => {
                      setAudioEnabled(!audioEnabled);
                      if (audioEnabled) {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      }
                    }}
                    variant={audioEnabled ? "default" : "outline"}
                    className="rounded-full h-10 w-10 p-0"
                    title={audioEnabled ? "Mute Call Audio" : "Enable Call Audio"}
                  >
                    {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Phone Number</p>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">{progress.current_call.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Call Duration</p>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">
                      {interactionMode === 'mic' ? formatDuration(Math.round((new Date().getTime() - callStartTime) / 1000)) : formatDuration(progress.current_call.duration_seconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Call Controls (Mic Mode) */}
              {interactionMode === 'mic' && speakerStatus === 'idle' && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center space-y-4 shadow-sm">
                  <PhoneCall size={36} className="mx-auto text-purple-600 animate-bounce" />
                  <div>
                    <h5 className="font-bold text-purple-900">Ready to test call</h5>
                    <p className="text-xs text-purple-700 mt-1">
                      Start the interactive session. The AI agent will call, speak through your speakers, and listen to your reply.
                    </p>
                  </div>
                  <Button
                    onClick={handleStartMicCall}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
                  >
                    Start Call Test (Mic Mode)
                  </Button>
                </div>
              )}

              {/* Audio Wave / Mic Visualizer */}
              {((interactionMode === 'sim') || (interactionMode === 'mic' && speakerStatus !== 'idle')) && (
                <div className="bg-purple-950/90 rounded-xl p-6 flex flex-col items-center justify-center min-h-[140px] text-white shadow-inner relative overflow-hidden">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-purple-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>{interactionMode === 'mic' ? "Live Mic Audio Session" : "Desktop Audio Stream"}</span>
                  </div>
                  
                  {speakerStatus === 'ringing' && (
                    <div className="text-center space-y-2">
                      <Phone className="h-10 w-10 text-purple-400 animate-bounce mx-auto" />
                      <p className="text-sm font-medium animate-pulse text-purple-200">Ringing customer...</p>
                    </div>
                  )}
                  
                  {speakerStatus === 'connected' && (
                    <div className="flex flex-col items-center space-y-4 w-full">
                      {isListening ? (
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative flex items-center justify-center h-12 w-12 bg-red-500 rounded-full animate-pulse shadow-md">
                            <Mic size={24} className="text-white animate-bounce" />
                            <span className="absolute -inset-2 bg-red-400 rounded-full opacity-35 animate-ping"></span>
                          </div>
                          <span className="text-xs text-red-300 font-semibold animate-pulse uppercase tracking-wider">Listening... Speak now</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4 w-full">
                          {/* Pulsing Audio Waves */}
                          <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-[200px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((val) => {
                              const baseDelay = val * 0.1;
                              return (
                                <div
                                  key={val}
                                  className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full transition-all duration-300"
                                  style={{
                                    height: isSimSpeaking ? `${Math.floor(Math.random() * 35) + 15}px` : '4px',
                                    animation: isSimSpeaking ? `wave 1.2s ease-in-out infinite alternate` : 'none',
                                    animationDelay: `${baseDelay}s`
                                  }}
                                />
                              );
                            })}
                          </div>
                          <p className="text-xs text-purple-200 uppercase tracking-widest font-semibold">
                            {isSimSpeaking ? "AI Agent Speaking" : "Line Silent"}
                          </p>
                        </div>
                      )}
                      
                      {recognitionError && (
                        <p className="text-xs text-red-400 text-center font-semibold mt-2">{recognitionError}</p>
                      )}
                    </div>
                  )}
                  
                  {speakerStatus === 'completed' && (
                    <div className="text-center space-y-2">
                      <PhoneOff className="h-10 w-10 text-rose-400 mx-auto" />
                      <p className="text-sm font-medium text-rose-200">Call hung up</p>
                    </div>
                  )}
                </div>
              )}

              {interactionMode === 'mic' && isMicCallActive && speakerStatus !== 'completed' && (
                <Button
                  onClick={() => handleHangUp()}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 font-bold mt-4"
                >
                  <PhoneOff size={16} className="mr-2" />
                  Hang Up Call
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Live Dialogue Card */}
          <Card className="border-2 border-purple-200 h-[380px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/30 border-b border-gray-100 py-4">
              <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                Live Conversation Dialogue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2 pb-4 scrollbar-thin">
                {interactionMode === 'sim' ? (
                  dialogueMessages.slice(0, dialogueIndex).map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.role === 'customer' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                          : 'bg-white border text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="font-semibold text-[10px] uppercase tracking-wider mb-0.5 opacity-85">
                          {msg.role === 'customer' ? progress.current_call?.contact_name : 'AI Agent'}
                        </p>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  dialogueMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.role === 'customer' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                          : 'bg-white border text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="font-semibold text-[10px] uppercase tracking-wider mb-0.5 opacity-85">
                          {msg.role === 'customer' ? progress.current_call?.contact_name : 'AI Agent'}
                        </p>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {isSimSpeaking && (interactionMode === 'sim' ? dialogueIndex < dialogueMessages.length : true) && (
                  <div className={`flex ${
                    (interactionMode === 'sim' ? dialogueMessages[dialogueIndex].role === 'customer' : false) ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-50 border text-gray-500 rounded-2xl">
                      <div className="flex items-center gap-2 text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                        <span>
                          {interactionMode === 'sim' 
                            ? (dialogueMessages[dialogueIndex].role === 'customer' 
                                ? `${progress.current_call?.contact_name} is speaking...` 
                                : 'AI Agent is speaking...')
                            : 'AI Agent is speaking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No active call message */}
      {!progress.current_call && isActive && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Preparing next call...</p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Ended & Reporting Section */}
      {isCompleted && (
        <div className="space-y-6">
          {!viewingReport ? (
            /* Campaign Session Ended landing page */
            <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white shadow-2xl overflow-hidden relative min-h-[350px] flex flex-col justify-between rounded-2xl">
              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <CardContent className="pt-12 pb-8 px-6 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg border border-purple-400 animate-pulse">
                    <Award size={48} className="text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full text-xs font-bold border-2 border-purple-950">
                    ✓
                  </span>
                </div>
                
                <div className="space-y-2 max-w-lg">
                  <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent">
                    Campaign Session Ended
                  </h2>
                  <p className="text-purple-200 text-base leading-relaxed">
                    All {progress.total_contacts} customer contacts in this campaign have been successfully called, simulated, and processed.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 py-2">
                  <Badge variant="secondary" className="bg-purple-800/80 hover:bg-purple-800 text-purple-100 border border-purple-700 px-3 py-1.5 text-sm font-semibold rounded-full">
                    📂 {progress.completed} Calls Completed
                  </Badge>
                  {progress.failed > 0 && (
                    <Badge variant="destructive" className="bg-red-950/80 text-red-200 border border-red-800 px-3 py-1.5 text-sm font-semibold rounded-full">
                      ⚠️ {progress.failed} Calls Failed
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-pink-200 border-pink-500/30 bg-pink-950/30 px-3 py-1.5 text-sm font-semibold rounded-full">
                    ✨ 100% Processed
                  </Badge>
                </div>
              </CardContent>

              <div className="border-t border-purple-800/50 bg-purple-950/60 p-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  onClick={() => setViewingReport(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white shadow-md text-base px-8 py-6 rounded-xl hover:scale-102 transition-transform duration-200 animate-bounce"
                >
                  <TrendingUp size={20} className="mr-2" />
                  View Campaign Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}
                  className="w-full sm:w-auto border-purple-700 text-purple-200 hover:text-white hover:bg-purple-900/40 font-semibold text-base px-6 py-6 rounded-xl"
                >
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          ) : (
            /* Campaign detailed report workspace */
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingReport(false);
                      setSelectedCallIdForTranscript(null);
                    }}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                  >
                    ← Back to Summary
                  </Button>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="text-purple-600 animate-spin" size={18} style={{ animationDuration: '3s' }} />
                      Campaign Analytics Report
                    </h3>
                    <p className="text-xs text-gray-500">Real-time outcome & sentiment breakdown</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    toast.success("Report data exported successfully!");
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Export Data
                </Button>
              </div>

              {/* Single Contact Report */}
              {progress.total_contacts === 1 ? (
                (() => {
                  const singleCall = calls[0];
                  if (!singleCall) {
                    return (
                      <Card className="border border-purple-100">
                        <CardContent className="py-12 text-center text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                          <span>Generating call details report...</span>
                        </CardContent>
                      </Card>
                    );
                  }

                  const callOutcome = singleCall.call_outcome || "not_interested";
                  const sentiment = singleCall.customer_sentiment || "neutral";
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column: Call Summary & Metrics */}
                      <div className="lg:col-span-1 space-y-6">
                        <Card className="border border-purple-100 shadow-sm">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/20 pb-4 border-b border-purple-50">
                            <CardTitle className="text-lg text-purple-950 flex items-center gap-2">
                              <Users size={18} className="text-purple-600" />
                              Contact Called
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Name</p>
                              <p className="text-xl font-bold text-gray-900 mt-0.5">{singleCall.contact_name || "Customer"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Phone Number</p>
                              <p className="text-base font-semibold text-gray-800 mt-0.5">{singleCall.phone_number}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100">
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">Call Duration</p>
                                <p className="text-base font-bold text-gray-900 mt-0.5">{singleCall.duration}s</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">Call Status</p>
                                <Badge className="mt-0.5 bg-green-100 text-green-800 border-green-200">
                                  {singleCall.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-semibold mb-1">Sentiment Analysis</p>
                              <div className="flex items-center gap-1.5">
                                {sentiment === "positive" && <Smile className="text-green-500 animate-bounce" size={18} />}
                                {sentiment === "neutral" && <Meh className="text-amber-500" size={18} />}
                                {sentiment === "negative" && <Frown className="text-red-500" size={18} />}
                                <span className="text-sm font-bold capitalize text-gray-700">{sentiment}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Outcome card */}
                        <Card className={`border-2 ${
                          callOutcome === 'interested' ? 'border-green-300 bg-green-50/40' :
                          callOutcome === 'callback_requested' ? 'border-blue-300 bg-blue-50/40' :
                          'border-red-200 bg-red-50/20'
                        } shadow-sm`}>
                          <CardContent className="pt-6 text-center space-y-3">
                            {callOutcome === 'interested' ? (
                              <>
                                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                                <h4 className="text-lg font-bold text-green-900">Lead Acquired!</h4>
                                <p className="text-xs text-green-700">The customer expressed explicit interest in your offer and campaign details.</p>
                                <Badge className="bg-green-600 hover:bg-green-600 text-white font-bold text-sm px-4 py-1">INTERESTED</Badge>
                              </>
                            ) : callOutcome === 'callback_requested' ? (
                              <>
                                <Clock className="h-12 w-12 text-blue-600 mx-auto" />
                                <h4 className="text-lg font-bold text-blue-900">Callback Requested</h4>
                                <p className="text-xs text-blue-700">The customer wants to talk at a later time. Follow up required.</p>
                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-bold text-sm px-4 py-1">CALLBACK</Badge>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                                <h4 className="text-lg font-bold text-red-950">Not Interested</h4>
                                <p className="text-xs text-red-700">The customer declined or was not interested in the offering at this time.</p>
                                <Badge className="bg-red-500 hover:bg-red-500 text-white font-bold text-sm px-4 py-1">NOT INTERESTED</Badge>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Column: Summary & Transcript */}
                      <div className="lg:col-span-2 space-y-6">
                        {singleCall.conversation_summary && (
                          <Card className="border border-purple-100 shadow-sm">
                            <CardHeader className="py-3 bg-gray-50/60 border-b">
                              <CardTitle className="text-sm font-bold text-gray-800">AI Conversation Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm text-gray-700 leading-relaxed font-semibold">
                              {singleCall.conversation_summary}
                            </CardContent>
                          </Card>
                        )}

                        {singleCall.notes && (
                          <Card className="border border-purple-200 bg-purple-50/15 shadow-sm">
                            <CardHeader className="py-3 bg-purple-50/60 border-b border-purple-100">
                              <CardTitle className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                                <Sparkles className="text-purple-600 animate-pulse" size={16} />
                                Specific Customer Requirements
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm text-purple-900 leading-relaxed font-semibold whitespace-pre-wrap">
                              {singleCall.notes}
                            </CardContent>
                          </Card>
                        )}

                        {singleCall.key_quote && (
                          <Card className="border border-indigo-200 bg-indigo-50/10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-2 right-4 text-8xl font-serif text-indigo-200/40 pointer-events-none select-none">“</div>
                            <CardContent className="pt-6 pb-6 px-6 relative">
                              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5">
                                💬 Key Customer Highlight / Quote
                              </p>
                              <blockquote className="text-sm font-semibold italic text-indigo-950 border-l-4 border-indigo-500 pl-3 leading-relaxed">
                                "{singleCall.key_quote}"
                              </blockquote>
                            </CardContent>
                          </Card>
                        )}

                        <Card className="border border-purple-100 shadow-sm flex flex-col h-[400px]">
                          <CardHeader className="py-3 bg-gradient-to-r from-purple-50/50 to-pink-50/30 border-b">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <MessageSquare size={16} className="text-purple-600" />
                              Interactive Dialogue Transcript
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
                            {singleCall.conversation_transcript ? (
                              parseTranscriptLines(singleCall.conversation_transcript).map((line, idx) => {
                                const isCustomer = line.speaker.toLowerCase() === 'customer';
                                return (
                                  <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                      isCustomer 
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                                        : 'bg-gray-100 border text-gray-800 rounded-tl-none'
                                    }`}>
                                      <p className="font-semibold text-[10px] uppercase tracking-wider mb-0.5 opacity-80">
                                        {isCustomer ? (singleCall.contact_name || "Customer") : "AI Agent"}
                                      </p>
                                      <p className="leading-relaxed">{line.text}</p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-center text-gray-400 text-sm py-12">No transcript recorded for this call.</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Multi Contact Report (Pie Charts & Call Logs) */
                (() => {
                  // Compute stats
                  const total = calls.length;
                  const completed = calls.filter(c => c.status === 'completed').length;
                  const failed = calls.filter(c => c.status === 'failed').length;
                  
                  const interested = calls.filter(c => c.call_outcome === 'interested').length;
                  const notInterested = calls.filter(c => c.call_outcome === 'not_interested').length;
                  const callback = calls.filter(c => c.call_outcome === 'callback_requested').length;
                  const notAvailable = calls.filter(c => !c.call_outcome || c.call_outcome === 'not_available').length;
                  
                  const positive = calls.filter(c => c.customer_sentiment === 'positive').length;
                  const neutral = calls.filter(c => c.customer_sentiment === 'neutral').length;
                  const negative = calls.filter(c => c.customer_sentiment === 'negative').length;
                  
                  const answerRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
                  const conversionRate = completed > 0 ? ((interested / completed) * 100).toFixed(1) : "0";
                  const positiveSentimentRate = completed > 0 ? ((positive / completed) * 100).toFixed(1) : "0";
                  const avgDuration = completed > 0 
                    ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / completed)
                    : 0;

                  // Pie Chart Data
                  const outcomeChartData = [
                    { name: "Interested", value: interested, fill: "#10b981" },
                    { name: "Not Interested", value: notInterested, fill: "#ef4444" },
                    { name: "Callback Requested", value: callback, fill: "#3b82f6" },
                    { name: "No Answer/Failed", value: notAvailable + failed, fill: "#6b7280" }
                  ].filter(d => d.value > 0);

                  const sentimentChartData = [
                    { name: "Positive Sentiment", value: positive, fill: "#10b981" },
                    { name: "Neutral Sentiment", value: neutral, fill: "#f59e0b" },
                    { name: "Negative Sentiment", value: negative, fill: "#ef4444" }
                  ].filter(d => d.value > 0);

                  return (
                    <div className="space-y-8">
                      {/* Metric Cards Row */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-purple-100 shadow-sm bg-gradient-to-br from-purple-50/30 to-white">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Call Answer Rate</p>
                              <p className="text-2xl font-bold text-purple-600 mt-1">{answerRate}%</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{completed} / {total} calls answered</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                              <Phone size={20} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-green-100 shadow-sm bg-gradient-to-br from-green-50/30 to-white">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Lead Conversion Rate</p>
                              <p className="text-2xl font-bold text-green-600 mt-1">{conversionRate}%</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{interested} interested leads</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                              <Award size={20} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50/30 to-white">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Positive Sentiment</p>
                              <p className="text-2xl font-bold text-blue-600 mt-1">{positiveSentimentRate}%</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Satisfied customer voice</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                              <Smile size={20} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50/30 to-white">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Avg Call Duration</p>
                              <p className="text-2xl font-bold text-amber-600 mt-1">{avgDuration}s</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Duration per session</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                              <Clock size={20} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Pie Charts Side-by-Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Outcomes Pie Chart */}
                        <Card className="border border-gray-100 shadow-sm">
                          <CardHeader className="pb-2 bg-gray-50/50 border-b">
                            <CardTitle className="text-base text-gray-800">Call Campaign Outcomes</CardTitle>
                            <CardDescription className="text-xs">Interest response breakdown</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            {outcomeChartData.length > 0 ? (
                              <div className="flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height={220}>
                                  <PieChart>
                                    <Pie
                                      data={outcomeChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      dataKey="value"
                                    >
                                      {outcomeChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => [`${value} Calls`, 'Outcomes']} />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs">
                                  {outcomeChartData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                      <span className="font-semibold text-gray-600">{item.name} ({item.value})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-gray-400 py-12 text-sm">No outcome data available to chart.</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Sentiment Pie Chart */}
                        <Card className="border border-gray-100 shadow-sm">
                          <CardHeader className="pb-2 bg-gray-50/50 border-b">
                            <CardTitle className="text-base text-gray-800">Sentiment Distribution</CardTitle>
                            <CardDescription className="text-xs">AI analysis of user tone</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            {sentimentChartData.length > 0 ? (
                              <div className="flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height={220}>
                                  <PieChart>
                                    <Pie
                                      data={sentimentChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      dataKey="value"
                                    >
                                      {sentimentChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => [`${value} Calls`, 'Sentiment']} />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs">
                                  {sentimentChartData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                      <span className="font-semibold text-gray-600">{item.name} ({item.value})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-gray-400 py-12 text-sm">No sentiment data available to chart.</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Call Logs & Transcripts Section */}
                      <Card className="border border-purple-100 shadow-sm">
                        <CardHeader className="bg-gray-50/60 pb-3 border-b">
                          <CardTitle className="text-base text-gray-800">Call Logs & Conversation Detail</CardTitle>
                          <CardDescription className="text-xs">Select any contact to inspect transcript</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-gray-100/50 border-b border-gray-200">
                                <tr>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Name</th>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</th>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Conversation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {calls.map((call) => {
                                  const isSelected = selectedCallIdForTranscript === call.id;
                                  const outcome = call.call_outcome || "not_interested";
                                  const s = call.customer_sentiment || "neutral";
                                  
                                  return (
                                    <Fragment key={call.id}>
                                      <tr className={`hover:bg-purple-50/30 transition-colors ${isSelected ? 'bg-purple-50/45' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                          {call.contact_name || "Customer"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                          {call.phone_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                          {call.duration}s
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold capitalize text-gray-600">
                                          <div className="flex items-center gap-1.5">
                                            {s === "positive" && <Smile className="text-green-500" size={16} />}
                                            {s === "neutral" && <Meh className="text-amber-500" size={16} />}
                                            {s === "negative" && <Frown className="text-red-500" size={16} />}
                                            <span>{s}</span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <Badge className={`font-bold ${
                                            outcome === 'interested' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                            outcome === 'callback_requested' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                            outcome === 'not_interested' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                            'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                          }`}>
                                            {outcome.replace(/_/g, ' ').toUpperCase()}
                                          </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCallIdForTranscript(isSelected ? null : call.id)}
                                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100/50 font-semibold"
                                          >
                                            {isSelected ? (
                                              <span className="flex items-center gap-1">Hide Transcript <ChevronUp size={14} /></span>
                                            ) : (
                                              <span className="flex items-center gap-1">View Transcript <ChevronDown size={14} /></span>
                                            )}
                                          </Button>
                                        </td>
                                      </tr>
                                      
                                      {/* Accordion detail panel for selected row */}
                                      {isSelected && (
                                        <tr>
                                          <td colSpan={6} className="bg-purple-50/10 px-8 py-5 border-t border-b border-purple-100/50">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                              <div className="lg:col-span-1 space-y-3">
                                                <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider">AI Call Summary</h5>
                                                <div className="bg-white p-3 rounded-lg border border-purple-100/60 text-xs text-gray-700 leading-relaxed shadow-sm">
                                                  {call.conversation_summary || "No conversation summary recorded."}
                                                </div>
                                                {call.notes && (
                                                  <div className="mt-2.5">
                                                    <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider mb-1 flex items-center gap-1">
                                                      ✨ Specific Requirements
                                                    </h5>
                                                    <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100/50 text-xs text-purple-900 leading-relaxed shadow-sm whitespace-pre-wrap">
                                                      {call.notes}
                                                    </div>
                                                  </div>
                                                )}
                                                {call.key_quote && (
                                                  <div className="mt-2.5 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                                                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                                                      💬 Key Quote
                                                    </h5>
                                                    <blockquote className="text-xs font-semibold italic text-indigo-950 border-l-2 border-indigo-500 pl-2 leading-relaxed">
                                                      "{call.key_quote}"
                                                    </blockquote>
                                                  </div>
                                                )}
                                                <div className="text-[10px] text-gray-400 space-y-1">
                                                  <p>Call Date: {new Date(call.created_at).toLocaleString()}</p>
                                                  <p>Contact ID: {call.contact_id}</p>
                                                  <p>Call DB ID: {call.id}</p>
                                                </div>
                                              </div>
                                              <div className="lg:col-span-2">
                                                <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider mb-2 flex items-center gap-1.5">
                                                  <MessageSquare size={14} className="text-purple-600" />
                                                  Dialogue Transcript
                                                </h5>
                                                <div className="bg-white rounded-xl border border-purple-100/60 p-4 max-h-[250px] overflow-y-auto space-y-3.5 shadow-sm scrollbar-thin">
                                                  {call.conversation_transcript ? (
                                                    parseTranscriptLines(call.conversation_transcript).map((line, idx) => {
                                                      const isCustomer = line.speaker.toLowerCase() === 'customer';
                                                      return (
                                                        <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                                          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                                                            isCustomer 
                                                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                                                              : 'bg-gray-100 border text-gray-800 rounded-tl-none'
                                                          }`}>
                                                            <p className="font-semibold text-[9px] uppercase tracking-wider mb-0.5 opacity-80">
                                                              {isCustomer ? (call.contact_name || "Customer") : "AI Agent"}
                                                            </p>
                                                            <p className="leading-relaxed">{line.text}</p>
                                                          </div>
                                                        </div>
                                                      );
                                                    })
                                                  ) : (
                                                    <p className="text-center text-gray-400 py-6">No transcript details recorded.</p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {!isCompleted && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Phone className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">About This Interface</h4>
                <p className="text-sm text-gray-600">
                  This page shows real-time progress of your voice campaign. Calls are processed automatically
                  in the background. You can pause/resume the campaign at any time. The page updates every 2 seconds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Style overrides for animations */}
      <style>{`
        @keyframes wave {
          0% { height: 4px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  </div>
);
}


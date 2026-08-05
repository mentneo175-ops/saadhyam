import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, MessageSquare, Volume2, AlertTriangle } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

import { sendQuery } from "@/lib/assistantApi";
import { useAuth } from "@/hooks/useAuth";
import { voiceCommandApi } from "@/lib/voiceCommandApi";
import { useVoiceExecutor } from "@/hooks/useVoiceExecutor";

const initialMessages = [
  {
    role: "assistant",
    content: "Hi! I'm your AI business assistant. Ask me anything about your business, market trends, or competitors!",
  },
];

export default function AssistantWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [mode, setMode] = useState("chat"); // "chat" or "voice"
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle, listening, processing, speaking
  const [language, setLanguage] = useState("en-US"); // "te-IN" or "en-US"
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [replyText, setReplyText] = useState("");
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Refs to hold the latest state values to avoid stale closures in listeners
  const modeRef = useRef(mode);
  const languageRef = useRef(language);
  const voiceStatusRef = useRef(voiceStatus);
  const isListeningRef = useRef(isListening);
  const isSpeakingRef = useRef(isSpeaking);
  const isLoadingRef = useRef(isLoading);
  const queryRef = useRef(query);
  const isOpenRef = useRef(isOpen);
  const startListeningRef = useRef(null);
  const handleVoiceQueryRef = useRef(null);
  const speakRef = useRef(null);

  // Sync refs on render
  modeRef.current = mode;
  languageRef.current = language;
  voiceStatusRef.current = voiceStatus;
  isListeningRef.current = isListening;
  isSpeakingRef.current = isSpeaking;
  isLoadingRef.current = isLoading;
  queryRef.current = query;
  isOpenRef.current = isOpen;

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setReplyText("");
        recognitionRef.current.lang = languageRef.current;
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceStatus("listening");
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text) => {
    console.log('[Speak] Attempting to speak:', text.substring(0, 50) + '...');
    console.log('[Speak] isSpeaking:', isSpeaking);
    console.log('[Speak] synthRef available:', !!synthRef.current);
    
    if (!synthRef.current) {
      console.error('[Speak] Speech synthesis not available');
      return;
    }
    
    // Cancel any ongoing speech first
    synthRef.current.cancel();
    
    // Small delay to ensure cancel completes
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = language === "te-IN"
        ? voices.find(v => v.lang.includes("te") || v.lang.startsWith("te-"))
        : voices.find(v => v.lang.includes("en") || v.lang.startsWith("en-"));
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      utterance.onstart = () => {
        console.log('[Speak] Speech started');
        setIsSpeaking(true);
        setVoiceStatus("speaking");
      };
      
      utterance.onend = () => {
        console.log('[Speak] Speech ended');
        setIsSpeaking(false);
        setVoiceStatus("idle");
        
        // In voice mode, automatically start listening again after speaking
        if (modeRef.current === "voice" && isOpenRef.current) {
          setTimeout(() => {
            console.log('[Speak] Auto-starting listening after speech');
            if (startListeningRef.current) {
              startListeningRef.current();
            }
          }, 800);
        }
      };
      
      utterance.onerror = (event) => {
        console.error('[Speak] Speech error:', event);
        setIsSpeaking(false);
        setVoiceStatus("idle");
      };
      
      console.log('[Speak] Calling speak()');
      synthRef.current.speak(utterance);
    }, 100);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setVoiceStatus("idle");
    }
  }, []);

  const handleCommandSuccess = useCallback((msg) => {
    setReplyText(msg);
    speak(msg);
    // Always append to chat messages so switching to chat mode shows full history
    setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
  }, [speak]);

  const handleAskConfirmation = useCallback((command) => {
    setPendingConfirmation(command);
    setReplyText(command.reply_te);
    speak(command.reply_te);
  }, [speak]);

  const { executeCommand, confirmDangerousAction } = useVoiceExecutor({
    onAskConfirmation: handleAskConfirmation,
    onSuccess: handleCommandSuccess
  });

  const handleConfirm = async () => {
    if (!pendingConfirmation) return;
    const cmd = pendingConfirmation;
    setPendingConfirmation(null);
    await confirmDangerousAction(cmd);
    if (modeRef.current === "voice") {
      setTimeout(() => {
        if (startListeningRef.current) startListeningRef.current();
      }, 1500);
    }
  };

  const handleCancel = async () => {
    if (!pendingConfirmation) return;
    const cmd = pendingConfirmation;
    setPendingConfirmation(null);
    try {
      await voiceCommandApi.logExecution(cmd.log_id, false);
    } catch (e) {
      console.error(e);
    }
    const cancelMsg = language === "te-IN" ? "చర్య రద్దు చేయబడింది." : "Action cancelled.";
    setReplyText(cancelMsg);
    speak(cancelMsg);
    if (modeRef.current === "voice") {
      setTimeout(() => {
        if (startListeningRef.current) startListeningRef.current();
      }, 1500);
    }
  };

  const handleVoiceQuery = useCallback(async (transcriptText) => {
    console.log('[Voice] Processing query:', transcriptText);
    setVoiceStatus("processing");
    setIsLoading(true);
    setReplyText("");

    let parsedCommand = null;
    let parseError = null;
    try {
      // Try to parse as voice command first
      const langParam = language.split("-")[0];
      parsedCommand = await voiceCommandApi.parse(transcriptText, location.pathname, langParam);
      console.log('[Voice] Parsed command:', parsedCommand);
    } catch (error) {
      console.error('[Voice] Parser error (falling back to general query):', error);
      parseError = error;
    }

    try {
      if (parsedCommand && parsedCommand.intent !== "UNKNOWN" && parsedCommand.action !== "NO_ACTION") {
        setReplyText(parsedCommand.reply_te);
        // Speak response in Voice Mode via TTS
        speak(parsedCommand.reply_te);

        const executed = await executeCommand(parsedCommand);
        if (!executed) {
          setIsLoading(false);
          return;
        }
      } else {
        // Fallback to general AI query
        const token = localStorage.getItem('saadhyam_token') || localStorage.getItem('token');
        console.log('[Voice] Token available:', !!token);
        
        if (!token) {
          const noAuthMsg = language === "te-IN" 
            ? "దయచేసి మళ్ళీ లాగిన్ చేయండి." 
            : "Please log in again to use the assistant.";
          setReplyText(noAuthMsg);
          speak(noAuthMsg);
          setVoiceStatus("idle");
          setIsLoading(false);
          return;
        }

        const responseText = await sendQuery(transcriptText, token);
        console.log('[Voice] Response received:', responseText);
        setReplyText(responseText);

        // Speak the response immediately via TTS
        console.log('[Voice] Calling speak function...');
        speak(responseText);
      }
    } catch (error) {
      console.error('[Voice] Error:', error);
      // Show user-friendly error instead of raw backend messages like "User not found"
      let errorMsg;
      const rawMsg = error?.message || "";
      if (rawMsg.includes("User not found") || rawMsg.includes("not found") || rawMsg.includes("401") || rawMsg.includes("Authentication")) {
        errorMsg = language === "te-IN"
          ? "దయచేసి మళ్ళీ లాగిన్ చేయండి."
          : "Your session may have expired. Please log in again.";
      } else if (rawMsg.includes("Failed to fetch") || rawMsg.includes("Network")) {
        errorMsg = language === "te-IN"
          ? "సర్వర్‌కు కనెక్ట్ కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : "Could not connect to the server. Please try again.";
      } else {
        errorMsg = language === "te-IN"
          ? "క్షమించండి, ఎర్రర్ వచ్చింది. మళ్ళీ ప్రయత్నించండి."
          : "Sorry, I encountered an error. Please try again.";
      }
      setReplyText(errorMsg);
      speak(errorMsg);
      setVoiceStatus("idle");
    } finally {
      setIsLoading(false);
    }
  }, [speak, language, location.pathname, executeCommand]);

  // Assign function refs to be referenced in the event handlers
  startListeningRef.current = startListening;
  handleVoiceQueryRef.current = handleVoiceQuery;
  speakRef.current = speak;

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcriptText = event.results[0][0].transcript;
        console.log('Speech recognized:', transcriptText);
        setTranscript(transcriptText);
        
        if (modeRef.current === "voice") {
          // In voice mode, automatically process the query
          if (handleVoiceQueryRef.current) {
            handleVoiceQueryRef.current(transcriptText);
          }
        } else {
          // In chat mode, just fill the input
          setQuery(transcriptText);
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Only set to idle if not already processing or speaking
        if (voiceStatusRef.current === "listening") {
          setVoiceStatus("idle");
        }
        
        // Don't speak error in voice mode if we're already listening
        if (modeRef.current === "voice" && voiceStatusRef.current === "listening") {
          setTimeout(() => {
            if (!isSpeakingRef.current && !isLoadingRef.current) {
              const speakErr = languageRef.current === "te-IN"
                ? "క్షమించండి, మీ వాయిస్ వినబడలేదు. మళ్ళీ ప్రయత్నించండి."
                : "Sorry, I couldn't hear you clearly. Please try again.";
              if (speakRef.current) {
                speakRef.current(speakErr);
              }
            }
          }, 500);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setSpeechSupported(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // Run ONCE on mount!

  // Sync SpeechRecognition language configuration when language state changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Auto-scroll to bottom in chat mode
  useEffect(() => {
    if (mode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mode]);

  // Auto-start listening when switching to voice mode
  useEffect(() => {
    if (mode === "voice" && isOpen && speechSupported && !isListening && !isSpeaking) {
      // Set status to idle first
      setVoiceStatus("idle");
      
      // Give a brief welcome message
      const welcomeMsg = language === "te-IN"
        ? "వాయిస్ అసిస్టెంట్ సిద్ధంగా ఉంది. మీ వ్యాపారం గురించి ఏదైనా అడగండి."
        : "Voice assistant ready. Ask me anything about your business.";
      speak(welcomeMsg);
    } else if (mode === "chat") {
      // Stop any ongoing speech when switching to chat
      stopSpeaking();
      stopListening();
      setVoiceStatus("idle");
    }
  }, [mode, isOpen, speechSupported]);

  // Handle chat mode query (with chat UI)
  const handleChatQuery = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    console.log('[Chat] Sending query:', trimmed);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuery("");
    setIsLoading(true);

    try {
      // Try to parse as command first
      const isTelugu = /[\u0c00-\u0c7f]/.test(trimmed);
      const lang = isTelugu ? "te" : "en";
      
      const parsedCommand = await voiceCommandApi.parse(trimmed, location.pathname, lang);
      console.log('[Chat] Parsed command:', parsedCommand);
      
      if (parsedCommand && parsedCommand.intent !== "UNKNOWN" && parsedCommand.action !== "NO_ACTION") {
        const executed = await executeCommand(parsedCommand);
        if (executed) {
          setMessages((prev) => [...prev, { role: "assistant", content: parsedCommand.reply_te }]);
        }
      } else {
        // Fallback to general query
        const token = localStorage.getItem('saadhyam_token') || localStorage.getItem('token');
        console.log('[Chat] Token available:', !!token);
        
        const responseText = await sendQuery(trimmed, token);
        console.log('[Chat] Response received:', responseText);
        
        setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
      }
    } catch (error) {
      console.error('[Chat] Error:', error);
      const errorMsg = error?.message || "Sorry, I could not fetch an answer right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTranscript("");
    setReplyText("");
    if (newMode === "chat") {
      stopSpeaking();
      stopListening();
      setVoiceStatus("idle");
    }
  };

  // Show widget on all dashboard pages except login/signup, and hide on B2B Chat
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isB2BChatPage = location.pathname === '/dashboard/b2b-chat';
  const shouldShow = isClient && isDashboardPage && !isB2BChatPage && user;

  // Don't render if should not be shown
  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Widget Panel - Positioned above button */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl z-[100] lg:w-[380px]">
          {/* Header with Mode Toggle */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mode === "chat" ? "💬 Chat Assistant" : "🎤 Voice Assistant"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode === "chat" 
                    ? "Type or speak your questions" 
                    : speechSupported 
                      ? "Live voice conversation" 
                      : "Voice not supported"}
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                {speechSupported && (
                  <div className="flex items-center space-x-0.5 bg-muted rounded-lg p-0.5 border border-border">
                    <button
                      type="button"
                      onClick={() => setLanguage("te-IN")}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        language === "te-IN"
                          ? "bg-card text-purple-600 dark:text-purple-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      తెలుగు
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("en-US")}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        language === "en-US"
                          ? "bg-card text-purple-600 dark:text-purple-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      EN
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    stopSpeaking();
                    stopListening();
                    setVoiceStatus("idle");
                  }}
                  className="rounded-full border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Mode Toggle Buttons */}
            <div className="flex border-t border-border">
              <button
                type="button"
                onClick={() => switchMode("chat")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                  mode === "chat"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare size={16} />
                Chat Mode
              </button>
              <button
                type="button"
                onClick={() => switchMode("voice")}
                disabled={!speechSupported}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "voice"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Volume2 size={16} />
                Voice Mode
              </button>
            </div>
          </div>

          {/* Chat Mode UI */}
          {mode === "chat" && (
            <>
              <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3 text-sm">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                        : "mr-auto w-fit max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-foreground"
                    }
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="mr-auto w-fit rounded-2xl bg-muted px-3 py-2 text-foreground">
                    💭 Thinking...
                  </div>
                )}
                {isListening && (
                  <div className="mr-auto w-fit rounded-2xl bg-red-100 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    🎤 Listening...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleChatQuery();
                      }
                    }}
                    placeholder={isListening ? "Listening..." : "Ask about your business..."}
                    disabled={isListening}
                    className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                  
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={`rounded-full p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isListening
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleChatQuery}
                    disabled={isLoading || !query.trim()}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Send
                  </button>
                </div>
                
                {speechSupported && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    💡 Click the mic to speak your question
                  </p>
                )}
              </div>
            </>
          )}

          {/* Voice Mode UI */}
          {mode === "voice" && (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              {/* Voice Status Indicator */}
              <div className="mb-6">
                {voiceStatus === "idle" && (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
                    <Volume2 size={48} className="text-muted-foreground" />
                  </div>
                )}
                
                {voiceStatus === "listening" && (
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75"></div>
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-red-500">
                      <Mic size={48} className="text-white" />
                    </div>
                  </div>
                )}
                
                {voiceStatus === "processing" && (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-500">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                )}
                
                {voiceStatus === "speaking" && (
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-green-400 opacity-75"></div>
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-green-500">
                      <Volume2 size={48} className="text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {voiceStatus === "idle" && "Ready to listen"}
                  {voiceStatus === "listening" && "Listening..."}
                  {voiceStatus === "processing" && "Processing..."}
                  {voiceStatus === "speaking" && "Speaking..."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {voiceStatus === "idle" && "Click the button below to start"}
                  {voiceStatus === "listening" && "Speak your question now"}
                  {voiceStatus === "processing" && "Analyzing your query"}
                  {voiceStatus === "speaking" && "AI is responding"}
                </p>
              </div>

              {/* Recognized transcript */}
              {(transcript || voiceStatus === "listening") && (
                <div className="w-full mt-4 bg-muted border border-border rounded-xl p-3 text-center">
                  <p className="text-sm italic font-medium text-foreground">
                    "{transcript || (language === "te-IN" ? "మాట్లాడండి..." : "Speak now...")}"
                  </p>
                </div>
              )}

              {/* Assistant replies */}
              {replyText && voiceStatus !== "listening" && (
                <div className="w-full mt-4 flex items-start space-x-2.5 bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 dark:border-purple-400/20 rounded-xl p-3">
                  <span className="text-lg">🤖</span>
                  <p className="text-sm font-medium text-foreground leading-relaxed text-left flex-1">
                    {replyText}
                  </p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="mt-8 flex gap-3">
                {voiceStatus === "idle" && (
                  <button
                    type="button"
                    onClick={startListening}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Start Listening
                  </button>
                )}
                
                {voiceStatus === "listening" && (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-600"
                  >
                    Stop Listening
                  </button>
                )}
                
                {voiceStatus === "speaking" && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
                  >
                    Stop Speaking
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-8 rounded-lg bg-muted p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Voice Mode:</strong> Speak naturally and the AI will respond with audio. 
                  The conversation continues automatically after each response.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Button - Fixed in corner */}
      <div className="fixed bottom-6 right-6 z-[100] lg:bottom-6 lg:right-6">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#5D2F8F] to-[#A855F7] text-white shadow-lg shadow-purple-500/40 transition hover:scale-110 hover:shadow-xl hover:shadow-purple-500/60"
          aria-label="Toggle assistant"
        >
          {mode === "voice" && isListening ? "🎤" : mode === "voice" && isSpeaking ? "🔊" : "AI"}
        </button>
      </div>

      {/* Dangerous Action Confirmation Dialog */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-100 dark:border-amber-950/50 bg-card p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-500">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold">
                {language === "te-IN" ? "ఈ చర్యకు కన్ఫర్మేషన్ అవసరం" : "Confirmation Required"}
              </h3>
            </div>

            <div className="my-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "te-IN" 
                  ? "మీరు క్రింది చర్యను ఎగ్జిక్యూట్ చేయాలనుకుంటున్నారా? ఇది ప్రమాదకరమైన చర్య కావచ్చు." 
                  : "Are you sure you want to execute this action? It might be dangerous."}
              </p>

              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-xl p-3.5">
                <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">
                  {language === "te-IN" ? "ఖరారు చేయవలసిన కమాండ్:" : "Command to execute:"}
                </p>
                <p className="text-sm font-bold text-foreground mt-1 italic">
                  "{pendingConfirmation.reply_te}"
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="border border-border hover:bg-muted text-foreground rounded-xl px-4 py-2 text-sm font-semibold transition"
              >
                {language === "te-IN" ? "రద్దు చేయి (Cancel)" : "Cancel"}
              </button>
              
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition"
              >
                {language === "te-IN" ? "నిర్ధారించు (Confirm)" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

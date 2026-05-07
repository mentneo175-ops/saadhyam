import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, MessageSquare, Volume2 } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

import { sendQuery } from "@/lib/assistantApi";
import { useAuth } from "@/hooks/useAuth";

const initialMessages = [
  {
    role: "assistant",
    content: "Hi! I can tell you about Amazon, Flipkart, Google, and Microsoft. Ask me anything!",
  },
];

export default function AssistantWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" or "voice"
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle, listening, processing, speaking
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messagesEndRef = useRef(null);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
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
    if (synthRef.current && !isSpeaking) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceStatus("speaking");
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        
        // In voice mode, automatically start listening again after speaking
        if (mode === "voice" && isOpen) {
          setTimeout(() => {
            setVoiceStatus("idle");
            startListening();
          }, 500);
        } else {
          setVoiceStatus("idle");
        }
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceStatus("idle");
      };
      
      synthRef.current.speak(utterance);
    }
  }, [isSpeaking, mode, isOpen, startListening]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setVoiceStatus("idle");
    }
  }, []);

  // Handle voice mode query (no chat UI)
  const handleVoiceQuery = useCallback(async (transcript) => {
    setVoiceStatus("processing");
    setIsLoading(true);

    try {
      const token = user?.token || localStorage.getItem('token');
      const responseText = await sendQuery(transcript, token);
      
      // Speak the response immediately
      speak(responseText);
    } catch (error) {
      const errorMsg = "Sorry, I encountered an error. Please try again.";
      speak(errorMsg);
      setVoiceStatus("idle");
    } finally {
      setIsLoading(false);
    }
  }, [user, speak]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        if (mode === "voice") {
          // In voice mode, automatically process the query
          handleVoiceQuery(transcript);
        } else {
          // In chat mode, just fill the input
          setQuery(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceStatus("idle");
        
        if (mode === "voice") {
          speak("Sorry, I couldn't hear you clearly. Please try again.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
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
  }, [mode, handleVoiceQuery, speak]);

  // Auto-scroll to bottom in chat mode
  useEffect(() => {
    if (mode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mode]);

  // Auto-start listening when switching to voice mode
  useEffect(() => {
    if (mode === "voice" && isOpen && speechSupported) {
      // Give a welcome message
      speak("Voice assistant activated. I can tell you about Amazon, Flipkart, Google, and Microsoft. What would you like to know?");
      // Start listening after welcome message
      setTimeout(() => {
        if (mode === "voice" && !isListening && !isSpeaking) {
          startListening();
        }
      }, 5000); // Increased to 5 seconds for longer welcome message
    } else if (mode === "chat") {
      // Stop any ongoing speech when switching to chat
      stopSpeaking();
      stopListening();
      setVoiceStatus("idle");
    }
  }, [mode, isOpen, speechSupported, speak, startListening, stopSpeaking, stopListening, isListening, isSpeaking]);

  // Handle chat mode query (with chat UI)
  const handleChatQuery = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuery("");
    setIsLoading(true);

    try {
      const token = user?.token || localStorage.getItem('token');
      const responseText = await sendQuery(trimmed, token);
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    } catch (error) {
      const errorMsg = "Sorry, I could not fetch an answer right now. Please try again.";
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
    if (newMode === "chat") {
      stopSpeaking();
      stopListening();
      setVoiceStatus("idle");
    }
  };

  // Hide widget on login/signup pages
  const hideOnPages = ['/login', '/signup', '/'];
  const shouldHide = hideOnPages.includes(location.pathname) || !user;

  // Don't render if should be hidden
  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-[380px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
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

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90"
        aria-label="Toggle assistant"
      >
        {mode === "voice" && isListening ? "🎤" : mode === "voice" && isSpeaking ? "🔊" : "AI"}
      </button>
    </div>
  );
}

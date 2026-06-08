import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, AlertTriangle, Keyboard, RefreshCw } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceExecutor } from "@/hooks/useVoiceExecutor";
import { voiceCommandApi, VoiceCommandResponse } from "@/lib/voiceCommandApi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Translation dictionaries for Telugu and English
const MESSAGES = {
  "te-IN": {
    listening: "వింటున్నాను...",
    processing: "ప్రాసెస్ చేస్తున్నాను...",
    success: "పూర్తయింది!",
    error: "లోపం సంభవించింది",
    idle: "మీ కమాండ్ చెప్పండి",
    listeningSub: "మీ ఆదేశాన్ని తెలుగులో మాట్లాడండి",
    processingSub: "ఆదేశాన్ని విశ్లేషిస్తున్నాను...",
    idleSub: "క్రింద ఉన్న మైక్ నొక్కి కమాండ్ చెప్పవచ్చు",
    unsupported: "మీ బ్రౌజర్లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి క్రోమ్ లేదా ఎడ్జ్ బ్రౌజర్ ఉపయోగించండి.",
    placeholder: "",
    networkError: "క్షమించండి, నెట్‌వర్క్ కనెక్టివిటీ లోపం సంభవించింది.",
    voiceError: "మీ వాయిస్ వినబడలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    notAllowedError: "మైక్రోఫోన్ అనుమతి నిరోధించబడింది. దయచేసి మీ బ్రౌజర్ సెట్టింగ్లలో మైక్రోఫోన్ అనుమతిని ఇవ్వండి (Allow చేయండి).",
    noSpeechError: "మీ వాయిస్ వినబడలేదు. దయచేసి మైక్రోఫోన్ వద్ద మాట్లాడండి.",
    audioCaptureError: "మైక్రోఫోన్ కనుగొనబడలేదు. దయచేసి మైక్రోఫోన్ కనెక్ట్ అయిందో లేదో చూడండి.",
    confirmTitle: "ఈ చర్యకు కన్ఫర్మేషన్ అవసరం",
    confirmSub: "మీరు క్రింది చర్యను ఎగ్జిక్యూట్ చేయాలనుకుంటున్నారా? ఇది ప్రమాదకరమైన చర్య కావచ్చు.",
    confirmCmd: "ఖరారు చేయవలసిన కమాండ్:",
    cancel: "రద్దు చేయి (Cancel)",
    confirm: "నిర్ధారించు (Confirm)",
    cancelledToast: "చర్య రద్దు చేయబడింది."
  },
  "en-US": {
    listening: "Listening...",
    processing: "Processing...",
    success: "Done!",
    error: "Error occurred",
    idle: "Say your command",
    listeningSub: "Speak your command in English",
    processingSub: "Analyzing command...",
    idleSub: "Click the mic below or type a command",
    unsupported: "Voice recognition is not supported in this browser. Please use Chrome or Edge.",
    placeholder: "",
    networkError: "Speech recognition network error. Please check your internet connection.",
    voiceError: "Voice not heard. Please try again.",
    notAllowedError: "Microphone permission is blocked. Please enable microphone access in your browser settings.",
    noSpeechError: "Voice not heard. Please speak clearly or check your microphone.",
    audioCaptureError: "No microphone detected. Please plug in or enable a microphone.",
    confirmTitle: "Confirmation Required",
    confirmSub: "Are you sure you want to execute this action? It might be dangerous.",
    confirmCmd: "Command to execute:",
    cancel: "Cancel",
    confirm: "Confirm",
    cancelledToast: "Action cancelled."
  }
};

export default function VoiceAssistant() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [pendingConfirmation, setPendingConfirmation] = useState<VoiceCommandResponse | null>(null);
  const [language, setLanguage] = useState<"te-IN" | "en-US">("te-IN");

  // Speak response using browser Speech Synthesis
  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Load voice depending on language setting
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = language === "te-IN"
        ? voices.find(v => v.lang.includes("te") || v.lang.startsWith("te-"))
        : voices.find(v => v.lang.includes("en") || v.lang.startsWith("en-"));
        
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed:", e);
    }
  }, [language]);

  const handleCommandSuccess = useCallback((msg: string) => {
    setReplyText(msg);
    setStatus("success");
    speakText(msg);
    
    // Auto reset to idle status after feedback
    setTimeout(() => {
      setStatus("idle");
    }, 4000);
  }, [speakText]);

  const handleAskConfirmation = useCallback((command: VoiceCommandResponse) => {
    setPendingConfirmation(command);
    setReplyText(command.reply_te);
    setStatus("idle");
    speakText(command.reply_te);
  }, [speakText]);

  const { executeCommand, confirmDangerousAction } = useVoiceExecutor({
    onAskConfirmation: handleAskConfirmation,
    onSuccess: handleCommandSuccess
  });

  const processCommandText = async (text: string) => {
    if (!text.trim()) return;
    setStatus("processing");
    try {
      const langParam = language.split("-")[0];
      const response = await voiceCommandApi.parse(text, location.pathname, langParam);
      await executeCommand(response);
    } catch (error) {
      console.error("Failed to parse command:", error);
      setStatus("error");
      const errorMsg = MESSAGES[language].networkError;
      setReplyText(errorMsg);
      speakText(errorMsg);
    }
  };

  const {
    isListening,
    transcript,
    supported: speechSupported,
    startListening,
    stopListening
  } = useSpeechRecognition({
    lang: language,
    onResult: (finalTranscript) => {
      stopListening();
      processCommandText(finalTranscript);
    },
    onError: (errCode) => {
      setStatus("error");
      let errorMsg = MESSAGES[language].voiceError;
      if (errCode === "not-allowed") {
        errorMsg = MESSAGES[language].notAllowedError;
      } else if (errCode === "no-speech") {
        errorMsg = MESSAGES[language].noSpeechError;
      } else if (errCode === "audio-capture") {
        errorMsg = MESSAGES[language].audioCaptureError;
      } else if (errCode === "network") {
        errorMsg = MESSAGES[language].networkError;
      }
      setReplyText(errorMsg);
      speakText(errorMsg);
    }
  });

  // Handle Ctrl+Space shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update status when speech recognition starts listening
  useEffect(() => {
    if (isListening) {
      setStatus("listening");
      setReplyText("");
    }
  }, [isListening]);

  // Sync voices (Web Speech API voices load asynchronously)
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);



  const handleConfirm = async () => {
    if (!pendingConfirmation) return;
    const cmd = pendingConfirmation;
    setPendingConfirmation(null);
    await confirmDangerousAction(cmd);
  };

  const handleCancel = async () => {
    if (!pendingConfirmation) return;
    const cmd = pendingConfirmation;
    setPendingConfirmation(null);
    // Log cancelled execution in backend
    try {
      await voiceCommandApi.logExecution(cmd.log_id, false);
    } catch (e) {
      console.error(e);
    }
    toast(MESSAGES[language].cancelledToast);
  };

  return (
    <>
      {/* Floating Microphone Button */}
      <div className="fixed bottom-6 right-24 z-[99] lg:bottom-6 lg:right-24">
        <motion.button
          type="button"
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev;
              if (next && speechSupported) {
                // Auto start listening on open
                setTimeout(startListening, 300);
              }
              return next;
            });
          }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 ${
            isListening 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/40" 
              : "bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-purple-500/30"
          }`}
          whileTap={{ scale: 0.95 }}
          title="Saadhyam Voice Assistant (Ctrl + Space)"
        >
          {isListening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75"></span>
          )}
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </motion.button>
      </div>

      {/* Slide-out/Fade Command Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[101] flex items-end justify-center p-4 sm:items-center sm:justify-end sm:p-6 bg-black/40 backdrop-blur-xs">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => {
              stopListening();
              setIsOpen(false);
            }} />

            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-900/95 z-[102]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    Saadhyam Voice AI
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Siri-like in-app voice command assistant
                  </p>
                </div>
                
                {/* Language switch & close layout */}
                <div className="flex items-center space-x-1.5">
                  <div className="flex items-center space-x-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setLanguage("te-IN")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        language === "te-IN"
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      తెలుగు
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("en-US")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        language === "en-US"
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      stopListening();
                      setIsOpen(false);
                    }}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="my-5 flex flex-col items-center justify-center min-h-[160px] space-y-4">
                {/* Voice waves when listening */}
                {status === "listening" && (
                  <div className="flex items-center justify-center space-x-1.5 h-10">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scaleY: [1, 2.5, 1],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="w-1.5 bg-gradient-to-t from-purple-600 to-pink-500 rounded-full h-4 origin-center"
                      />
                    ))}
                  </div>
                )}

                {/* Status Text Indicator */}
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    {status === "listening" && MESSAGES[language].listening}
                    {status === "processing" && MESSAGES[language].processing}
                    {status === "success" && MESSAGES[language].success}
                    {status === "error" && MESSAGES[language].error}
                    {status === "idle" && MESSAGES[language].idle}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {status === "listening" && MESSAGES[language].listeningSub}
                    {status === "processing" && MESSAGES[language].processingSub}
                    {status === "idle" && MESSAGES[language].idleSub}
                  </p>
                </div>

                {/* Recognized transcript */}
                {(transcript || status === "listening") && (
                  <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 text-center border border-gray-100 dark:border-gray-800/80">
                    <p className="text-sm italic font-medium text-gray-700 dark:text-gray-300">
                      "{transcript || (language === "te-IN" ? "మాట్లాడండి..." : "Speak now...")}"
                    </p>
                  </div>
                )}

                {/* Assistant replies (reply_te) */}
                {replyText && status !== "listening" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-start space-x-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-3.5 border border-purple-100/50 dark:border-purple-900/30"
                  >
                    <span className="text-lg">🤖</span>
                    <p className="text-sm font-medium text-purple-950 dark:text-purple-300 leading-relaxed text-left">
                      {replyText}
                    </p>
                  </motion.div>
                )}

                {/* Speech unsupported banner */}
                {!speechSupported && (
                  <div className="w-full bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex items-start space-x-2">
                    <Keyboard className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-left">
                      {MESSAGES[language].unsupported}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Microphone Control (Only Voice, No Text Box) */}
              <div className="flex flex-col items-center justify-center border-t border-gray-100 pt-5 pb-2 dark:border-gray-800">
                {speechSupported ? (
                  <motion.button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={status === "processing"}
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105 ${
                      isListening 
                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" 
                        : "bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-purple-500/20"
                    } ${status === "processing" ? "opacity-60 cursor-not-allowed" : ""}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {status === "processing" ? (
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    ) : isListening ? (
                      <MicOff size={24} />
                    ) : (
                      <Mic size={24} />
                    )}
                  </motion.button>
                ) : (
                  <div className="text-center py-2">
                    <Keyboard className="text-amber-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {MESSAGES[language].unsupported}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dangerous Action Confirmation Dialog */}
      <AnimatePresence>
        {pendingConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-100 dark:border-amber-950/50 bg-white dark:bg-gray-900 p-6 shadow-2xl"
            >
              <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-500">
                <AlertTriangle size={28} />
                <h3 className="text-xl font-bold">{MESSAGES[language].confirmTitle}</h3>
              </div>

              <div className="my-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {MESSAGES[language].confirmSub}
                </p>

                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-xl p-3.5">
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    {MESSAGES[language].confirmCmd}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 italic">
                    "{pendingConfirmation.reply_te}"
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800"
                >
                  {MESSAGES[language].cancel}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-xl px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                >
                  {MESSAGES[language].confirm}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

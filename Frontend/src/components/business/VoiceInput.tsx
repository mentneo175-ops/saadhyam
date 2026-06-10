import { useState, useRef, useEffect } from "react";
import { Mic, Square, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTextExtracted: (text: string) => void;
  onLiveTranscript?: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTextExtracted, onLiveTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        let finalTranscriptAccumulator = '';
        
        recognition.onstart = () => {
          finalTranscriptAccumulator = '';
          setLiveTranscript('');
          setIsComplete(false);
        };
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscriptAccumulator += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          const fullTranscript = finalTranscriptAccumulator + interimTranscript;
          setLiveTranscript(finalTranscriptAccumulator);
          
          if (onLiveTranscript && fullTranscript.trim()) {
            onLiveTranscript(fullTranscript.trim());
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          if (event.error === 'network') {
            toast.error('Network error. Please check your connection.');
            return;
          }
          toast.error(`Speech recognition error: ${event.error}`);
        };
        
        recognition.onend = () => {
          if (recording) {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Could not restart recognition');
            }
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn('Web Speech API not supported in this browser');
        toast.error('Voice input not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [onLiveTranscript, recording]);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setRecording(true);
      setRecordingTime(0);
      setLiveTranscript("");
      setIsComplete(false);
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition already started');
      }
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started - speak now!");
    } catch (error) {
      toast.error("Failed to access microphone. Please grant permission.");
      console.error("Microphone access error:", error);
    }
  };

  const stopRecording = () => {
    if (recording) {
      setRecording(false);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (liveTranscript.trim()) {
        onTextExtracted(liveTranscript.trim());
        setIsComplete(true);
        toast.success("Voice input completed!");
        
        setTimeout(() => {
          setIsComplete(false);
          setLiveTranscript("");
        }, 2000);
      } else {
        toast.error("No speech detected. Please try again.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={`
          w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 text-left relative
          ${isComplete
            ? "border-green-300 bg-green-50/50" 
            : recording
            ? "border-blue-400 bg-blue-50/50 shadow-lg"
            : "border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 hover:shadow-lg"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {recording && liveTranscript && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-lg z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-ping dark:bg-slate-900"></div>
            <span className="font-medium">Recording</span>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300
            ${isComplete
              ? "bg-green-100"
              : recording
              ? "bg-red-100 animate-pulse"
              : "bg-purple-100 group-hover:bg-purple-200"
            }
          `}>
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : recording ? (
              <Square className="w-5 h-5 text-red-600 fill-red-600" />
            ) : (
              <Mic className="w-6 h-6 text-purple-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
              {isComplete
                ? "Recording Complete!"
                : recording
                ? `Recording... ${formatTime(recordingTime)}`
                : "Record Voice"}
            </h3>
            <p className="text-sm text-gray-500">
              {isComplete
                ? "Voice input added successfully"
                : recording
                ? liveTranscript ? 'Listening...' : 'Speak now...'
                : "Speak in any language"}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

import { X, RefreshCw } from "lucide-react";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { WidgetConfig, Message } from "./Widget";
import { Badge } from "@/components/ui/badge";

interface ChatWindowProps {
  config: WidgetConfig;
  messages: Message[];
  onClose: () => void;
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  conversationId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatWindow({
  config,
  messages,
  onClose,
  onSendMessage,
  isTyping,
  conversationId,
  messagesEndRef,
}: ChatWindowProps) {
  const primaryColor = config.primary_color || "#8B5CF6";

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full h-full sm:w-[400px] sm:h-[600px] flex flex-col bg-white dark:bg-gray-950 sm:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-900 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="flex items-center justify-between px-4 py-4 text-white shadow-md select-none shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white border border-white/10 uppercase">
              {config.business_name.slice(0, 2)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">
              {config.business_name}
            </h3>
            <span className="text-[11px] text-white/80 font-medium">
              We reply instantly
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-full transition outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-hidden bg-gray-50/50 dark:bg-gray-900/30 flex flex-col min-h-0">
        <MessageList
          messages={messages}
          welcomeMessage={config.welcome_message}
          isTyping={isTyping}
          primaryColor={primaryColor}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Input Composer */}
      <div className="border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 px-3 py-3 shrink-0">
        <MessageComposer
          onSend={onSendMessage}
          primaryColor={primaryColor}
          conversationId={conversationId}
        />
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400 dark:text-gray-600 font-medium select-none">
          <span>Powered by</span>
          <span className="font-semibold text-gray-500 dark:text-gray-500">Saadhyam AI</span>
        </div>
      </div>
    </div>
  );
}

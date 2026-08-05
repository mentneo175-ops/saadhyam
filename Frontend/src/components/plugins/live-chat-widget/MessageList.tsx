import { Message } from "./Widget";
import { MessageBubble } from "./MessageBubble";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  welcomeMessage: string;
  isTyping: boolean;
  primaryColor: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  welcomeMessage,
  isTyping,
  primaryColor,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth h-full">
      {/* Welcome message bubble */}
      <div className="flex items-start gap-2">
        <div
          style={{ backgroundColor: primaryColor }}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {welcomeMessage}
          </p>
        </div>
      </div>

      {/* Conversation messages */}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          primaryColor={primaryColor}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-start gap-2">
          <div
            style={{ backgroundColor: primaryColor }}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: primaryColor, animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: primaryColor, animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: primaryColor, animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

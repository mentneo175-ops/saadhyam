import { Message } from "./Widget";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, primaryColor }: MessageBubbleProps) {
  const isVisitor = message.sender_type === "visitor";
  const isTemp = message.id.startsWith("temp-");

  return (
    <div
      className={cn(
        "flex items-end gap-2 group",
        isVisitor ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isVisitor && (
        <div
          style={{ backgroundColor: primaryColor }}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm mb-4"
        >
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isVisitor ? "items-end" : "items-start"
        )}
      >
        {/* Bubble */}
        <div
          style={isVisitor ? { backgroundColor: primaryColor } : undefined}
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-opacity duration-200",
            isVisitor
              ? "text-white rounded-br-none"
              : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none",
            isTemp && "opacity-60"
          )}
        >
          {message.message || (
            <span className="italic text-xs opacity-70">
              [unsupported message type]
            </span>
          )}
        </div>

        {/* Timestamp + read status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 text-[10px] text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isVisitor ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>{formatTime(message.created_at)}</span>
          {isVisitor && (
            <span
              className={cn(
                "font-medium",
                message.is_read
                  ? "text-blue-400 dark:text-blue-500"
                  : "text-gray-400"
              )}
            >
              {isTemp ? "Sending…" : message.is_read ? "Read" : "Sent"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

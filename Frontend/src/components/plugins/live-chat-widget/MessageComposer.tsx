import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (text: string) => void;
  primaryColor: string;
  conversationId: string | null;
}

export function MessageComposer({
  onSend,
  primaryColor,
  conversationId,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const canSend = text.trim().length > 0;

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border px-3 py-2 transition-all duration-200",
        isFocused
          ? "border-transparent ring-2 shadow-sm"
          : "border-gray-200 dark:border-gray-800"
      )}
      style={
        isFocused
          ? { boxShadow: `0 0 0 2px ${primaryColor}33` }
          : undefined
      }
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={
          conversationId
            ? "Type a message…"
            : "Type your message to start a conversation…"
        }
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none leading-relaxed"
        style={{ maxHeight: "120px" }}
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        style={canSend ? { backgroundColor: primaryColor } : undefined}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
          canSend
            ? "text-white shadow-sm hover:opacity-90 active:scale-95"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        )}
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

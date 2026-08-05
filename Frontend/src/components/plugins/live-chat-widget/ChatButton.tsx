import { MessageSquare } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  themeColor: string;
}

export function ChatButton({ onClick, themeColor }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: themeColor }}
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 outline-none"
    >
      <MessageSquare className="w-6 h-6 animate-pulse" />
    </button>
  );
}

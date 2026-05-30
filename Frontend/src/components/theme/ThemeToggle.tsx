import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  variant?: "compact" | "expanded";
  className?: string;
}

export function ThemeToggle({ variant = "compact", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "expanded") {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {/* Light */}
        <button
          onClick={() => !isDark || toggleTheme()}
          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 ${
            !isDark
              ? "border-purple-500 bg-purple-50 dark:bg-purple-500/15 shadow-md shadow-purple-500/10"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-purple-300 dark:hover:border-purple-500/40"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              !isDark
                ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30"
                : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
            }`}
          >
            <Sun size={20} />
          </div>
          <span className={`text-sm font-semibold ${!isDark ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"}`}>
            Light
          </span>
          {!isDark && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
        </button>

        {/* Dark */}
        <button
          onClick={() => isDark || toggleTheme()}
          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 ${
            isDark
              ? "border-purple-500 bg-purple-50 dark:bg-purple-500/15 shadow-md shadow-purple-500/10"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-purple-300 dark:hover:border-purple-500/40"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isDark
                ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30"
                : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
            }`}
          >
            <Moon size={20} />
          </div>
          <span className={`text-sm font-semibold ${isDark ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"}`}>
            Dark
          </span>
          {isDark && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
        </button>
      </div>
    );
  }

  // Compact: pill toggle switch
  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        size={16}
        className={`absolute transition-all duration-300 ${
          isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100 text-amber-500"
        }`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ${
          isDark ? "opacity-100 rotate-0 scale-100 text-purple-400" : "opacity-0 -rotate-90 scale-0"
        }`}
      />
    </button>
  );
}

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";

interface PremiumSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  showFilters: boolean;
}

export function PremiumSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  showFilters,
}: PremiumSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const placeholders = [
    "Search for technology companies...",
    "Find healthcare providers...",
    "Discover retail businesses...",
    "Explore consulting firms...",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder every 3 seconds
  useState(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Premium Search Input */}
          <div className="relative flex-1">
            {/* AI Glow Border */}
            <motion.div
              animate={{
                opacity: isFocused ? 1 : 0,
                scale: isFocused ? 1 : 0.95,
              }}
              transition={{ duration: 0.3 }}
              className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-0"
            />

            {/* Search Container */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <motion.div
                  animate={{
                    scale: isFocused ? 1.1 : 1,
                    rotate: isFocused ? 360 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Search className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholders[placeholderIndex]}
                className="w-full pl-12 pr-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-lg"
              />

              {/* AI Sparkle Icon */}
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Premium Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFilterClick}
            className={`relative overflow-hidden px-6 py-4 rounded-2xl font-medium text-white shadow-lg transition-all duration-300 ${
              showFilters
                ? "bg-gradient-to-r from-purple-600 to-pink-600"
                : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-purple-600 hover:to-pink-600"
            }`}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Building2, MapPin, Star, Sparkles, CheckCircle2 } from "lucide-react";
import type { Business } from "./types";

interface PremiumBusinessCardProps {
  business: Business;
  index: number;
  onSelect: (business: Business) => void;
}

export function PremiumBusinessCard({ business, index, onSelect }: PremiumBusinessCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(business)}
      className="group relative w-full text-left"
    >
      {/* Glassmorphism Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
        {/* Gradient Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-cyan-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />

        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-20 blur-xl" />
        </div>

        {/* Header with Gradient */}
        <div className="relative h-32 bg-gradient-to-br from-purple-100 via-pink-100 to-cyan-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-cyan-900/30 flex items-center justify-center overflow-hidden">
          {/* Animated Background Pattern */}
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
              backgroundSize: "200% 200%",
            }}
          />

          {/* Business Icon */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="relative w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center"
          >
            <Building2 className="w-10 h-10 text-purple-600" />
          </motion.div>
        </div>

        {/* Card Content */}
        <div className="relative p-6">
          {/* Business Name */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
            {business.name}
          </h3>

          {/* Category */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{business.category}</p>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">
              {business.location.lat.toFixed(4)}, {business.location.lng.toFixed(4)}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.div
                key={star}
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= 4
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </motion.div>
            ))}
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1 font-medium">
              (4.0)
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {business.isVerified && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-medium shadow-lg"
              >
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </motion.span>
            )}
            {business.isPartner && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium shadow-lg"
              >
                <Sparkles className="w-3 h-3" />
                Partner
              </motion.span>
            )}
          </div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </motion.button>
  );
}

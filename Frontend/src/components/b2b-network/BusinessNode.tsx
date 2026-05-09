import { motion } from "framer-motion";
import { Building2, CheckCircle2, Sparkles } from "lucide-react";
import type { Business } from "./types";

interface BusinessNodeProps {
  business: Business;
  x: number;
  y: number;
  isCenter: boolean;
  onClick: () => void;
  delay?: number;
}

export function BusinessNode({
  business,
  x,
  y,
  isCenter,
  onClick,
  delay = 0,
}: BusinessNodeProps) {
  const size = isCenter ? 160 : business.isPartner ? 120 : 100;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Subtle Float Animation */}
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full"
      >
        {/* Node Card */}
        <div
          className={`
            relative w-full h-full rounded-xl
            border shadow-sm
            ${
              isCenter
                ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                : business.isPartner
                ? "bg-card border-border/60"
                : "bg-muted/50 border-border/40"
            }
            transition-all duration-200
            hover:scale-105 hover:shadow-md
            flex flex-col items-center justify-center p-3
          `}
        >
          {/* Logo/Icon */}
          <div
            className={`
              rounded-lg mb-2 flex items-center justify-center
              ${isCenter ? "w-12 h-12" : "w-10 h-10"}
              ${
                isCenter
                  ? "bg-purple-100"
                  : business.isPartner
                  ? "bg-purple-50"
                  : "bg-muted"
              }
            `}
          >
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Building2
                className={`${isCenter ? "w-6 h-6" : "w-5 h-5"} text-purple-600`}
              />
            )}
          </div>

          {/* Business Name */}
          <h3
            className={`
              font-semibold text-center text-gray-900 mb-1 line-clamp-2
              ${isCenter ? "text-sm" : "text-xs"}
            `}
          >
            {business.name}
          </h3>

          {/* Category */}
          <p className="text-[10px] text-muted-foreground text-center mb-2">
            {business.category}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {business.isVerified && (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            )}
            {business.isPartner && (
              <Sparkles className="w-3 h-3 text-purple-600" />
            )}
          </div>

          {/* AI Score (for center node) */}
          {isCenter && business.aiScore && (
            <div className="mt-2 px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200">
              <span className="text-[10px] font-semibold text-purple-700">
                Score: {business.aiScore}
              </span>
            </div>
          )}

          {/* Status Indicator */}
          <div
            className={`
              absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
              ${isCenter ? "bg-purple-500" : business.isPartner ? "bg-emerald-500" : "bg-gray-400"}
            `}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

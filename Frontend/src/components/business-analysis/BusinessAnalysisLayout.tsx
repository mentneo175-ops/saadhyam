import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface BusinessAnalysisLayoutProps {
  children: ReactNode;
}

export function BusinessAnalysisLayout({ children }: BusinessAnalysisLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-h-full"
    >
      {/* Ambient depth — purple / pink / blue-violet */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] h-[min(580px,90vw)] w-[min(580px,90vw)] rounded-full bg-primary/[0.14] blur-[120px]"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-5%] h-[min(460px,80vw)] w-[min(460px,80vw)] rounded-full bg-secondary/[0.12] blur-[100px]"
        animate={{ opacity: [0.35, 0.6, 0.35], y: [0, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[oklch(0.58_0.18_270/0.1)] blur-[90px]"
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Extra ambient — mid-page warmth */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[60%] right-[5%] h-64 w-64 rounded-full bg-[oklch(0.65_0.14_330/0.08)] blur-[80px]"
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* Subtle floating accents */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary/45"
          style={{
            top: `${15 + i * 14}%`,
            left: `${6 + i * 17}%`,
          }}
          animate={{ opacity: [0.15, 0.6, 0.15], y: [0, -12, 0] }}
          transition={{ duration: 5 + i * 0.7, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 space-y-10 md:space-y-12 lg:space-y-14"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
};

export const revealFromLeft = {
  hidden: { opacity: 0, x: -28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scaleReveal = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

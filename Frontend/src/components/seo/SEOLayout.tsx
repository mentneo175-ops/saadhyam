import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SEOLayoutProps {
  children: ReactNode;
}

export function SEOLayout({ children }: SEOLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-full"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3], y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/4 h-48 w-48 rounded-full bg-primary/5 blur-2xl"
        animate={{ x: [0, 12, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-6"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

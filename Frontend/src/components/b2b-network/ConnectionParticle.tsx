import { motion } from "framer-motion";

interface ConnectionParticleProps {
  pathData: string;
  delay?: number;
}

export function ConnectionParticle({
  pathData,
  delay = 0,
}: ConnectionParticleProps) {
  return (
    <motion.circle
      r="3"
      fill="#22d3ee"
      filter="url(#glow)"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <animateMotion
        dur="5s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={pathData}
      />
    </motion.circle>
  );
}

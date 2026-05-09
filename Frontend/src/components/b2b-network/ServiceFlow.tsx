import { motion } from "framer-motion";

interface ServiceFlowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  service: string;
  delay?: number;
}

export function ServiceFlow({ from, to, service, delay = 0 }: ServiceFlowProps) {
  // Calculate path
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  const offsetX = -dy * 0.2;
  const offsetY = dx * 0.2;
  
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;

  const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute"
      style={{
        offsetPath: `path('${pathData}')`,
      }}
    >
      <motion.div
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        transition={{
          duration: 8,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
        className="px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30"
      >
        <span className="text-xs font-medium text-cyan-300 whitespace-nowrap">
          {service}
        </span>
      </motion.div>
    </motion.div>
  );
}

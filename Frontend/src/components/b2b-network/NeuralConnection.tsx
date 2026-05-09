import { motion } from "framer-motion";

interface NeuralConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  animated?: boolean;
}

export function NeuralConnection({
  from,
  to,
  animated = true,
}: NeuralConnectionProps) {
  // Calculate control points for smooth curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Create curved path
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Perpendicular offset for curve
  const offsetX = -dy * 0.15;
  const offsetY = dx * 0.15;
  
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;

  const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

  return (
    <g>
      {/* Main connection line */}
      <motion.path
        d={pathData}
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4 4"
        initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animated ? { pathLength: 1, opacity: 0.3 } : undefined}
        transition={
          animated
            ? {
                pathLength: { duration: 1, ease: "easeOut" },
                opacity: { duration: 0.5 },
              }
            : undefined
        }
      />
    </g>
  );
}

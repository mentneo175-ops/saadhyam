import { useEffect, useRef, useState } from "react";

interface AnimationConfig {
  particleCount: number;
  connectionQuality: "high" | "medium" | "low";
  enableParticles: boolean;
  enableGlow: boolean;
}

export function useNetworkAnimation() {
  const [config, setConfig] = useState<AnimationConfig>({
    particleCount: 50,
    connectionQuality: "high",
    enableParticles: true,
    enableGlow: true,
  });

  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Detect device capabilities
    const updateConfig = () => {
      const width = window.innerWidth;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        setConfig({
          particleCount: 0,
          connectionQuality: "low",
          enableParticles: false,
          enableGlow: false,
        });
        return;
      }

      // Desktop: Full experience
      if (width >= 1024) {
        setConfig({
          particleCount: 50,
          connectionQuality: "high",
          enableParticles: true,
          enableGlow: true,
        });
      }
      // Tablet: Reduced particles
      else if (width >= 768) {
        setConfig({
          particleCount: 25,
          connectionQuality: "medium",
          enableParticles: true,
          enableGlow: true,
        });
      }
      // Mobile: Minimal animations
      else {
        setConfig({
          particleCount: 10,
          connectionQuality: "low",
          enableParticles: false,
          enableGlow: false,
        });
      }
    };

    updateConfig();
    window.addEventListener("resize", updateConfig);
    return () => window.removeEventListener("resize", updateConfig);
  }, []);

  // Smooth animation loop
  const startAnimation = (callback: (time: number) => void) => {
    const animate = (time: number) => {
      callback(time);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Easing functions
  const easing = {
    easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeOut: (t: number) => t * (2 - t),
    easeIn: (t: number) => t * t,
    linear: (t: number) => t,
  };

  // Calculate smooth path between two points
  const calculateCurvedPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    curvature: number = 0.2
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const offsetX = -dy * curvature;
    const offsetY = dx * curvature;

    const controlX = midX + offsetX;
    const controlY = midY + offsetY;

    return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
  };

  // Get point along path at percentage
  const getPointOnPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    percentage: number,
    curvature: number = 0.2
  ) => {
    const t = percentage;
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const offsetX = -dy * curvature;
    const offsetY = dx * curvature;

    const controlX = midX + offsetX;
    const controlY = midY + offsetY;

    // Quadratic Bezier curve formula
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlX + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlY + t * t * to.y;

    return { x, y };
  };

  return {
    config,
    startAnimation,
    stopAnimation,
    easing,
    calculateCurvedPath,
    getPointOnPath,
  };
}

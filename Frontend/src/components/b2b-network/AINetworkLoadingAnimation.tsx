import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Sparkles, Zap, Network } from "lucide-react";

interface BusinessNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isUser?: boolean;
}

interface Connection {
  from: string;
  to: string;
  active: boolean;
}

const loadingMessages = [
  "Finding relevant business connections...",
  "Analyzing nearby business ecosystem...",
  "AI matching opportunities...",
  "Discovering potential partners...",
  "Mapping business network...",
  "Connecting with local businesses...",
];

export function AINetworkLoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Array<{ id: number; path: string }>>([]);

  // Define nodes
  const userNode: BusinessNode = {
    id: "user",
    label: "Your Business",
    x: 15,
    y: 50,
    isUser: true,
  };

  const otherNodes: BusinessNode[] = [
    { id: "b1", label: "Tech Co", x: 85, y: 20 },
    { id: "b2", label: "Marketing", x: 85, y: 40 },
    { id: "b3", label: "Consulting", x: 85, y: 60 },
    { id: "b4", label: "Healthcare", x: 85, y: 80 },
  ];

  const hubNode: BusinessNode = {
    id: "hub",
    label: "AI Hub",
    x: 50,
    y: 50,
  };

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Randomly activate connections
  useEffect(() => {
    const interval = setInterval(() => {
      const newActive = new Set<string>();
      
      // Randomly select 2-3 connections to activate
      const numConnections = 2 + Math.floor(Math.random() * 2);
      const availableNodes = otherNodes.map(n => n.id);
      
      for (let i = 0; i < numConnections; i++) {
        const randomNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        newActive.add(`user-hub-${randomNode}`);
      }
      
      setActiveConnections(newActive);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Generate particles for active connections
  useEffect(() => {
    const newParticles: Array<{ id: number; path: string }> = [];
    let particleId = 0;

    activeConnections.forEach((connection) => {
      const parts = connection.split("-");
      if (parts.length === 3) {
        // Add particles for both segments
        newParticles.push({ id: particleId++, path: `${parts[0]}-${parts[1]}` });
        newParticles.push({ id: particleId++, path: `${parts[1]}-${parts[2]}` });
      }
    });

    setParticles(newParticles);
  }, [activeConnections]);

  const getNodePosition = (nodeId: string) => {
    if (nodeId === "user") return userNode;
    if (nodeId === "hub") return hubNode;
    return otherNodes.find(n => n.id === nodeId) || hubNode;
  };

  const isConnectionActive = (from: string, to: string) => {
    return Array.from(activeConnections).some(conn => {
      const parts = conn.split("-");
      return (
        (parts.includes(from) && parts.includes(to)) ||
        (parts.includes(to) && parts.includes(from))
      );
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-purple-950/30 dark:to-pink-950/30 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-purple-500"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Gradient Blobs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
      />

      {/* Main Network Visualization */}
      <div className="relative w-full max-w-6xl h-[500px] z-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient for active connections */}
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8">
                <animate
                  attributeName="stop-color"
                  values="#a855f7; #ec4899; #06b6d4; #a855f7"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8">
                <animate
                  attributeName="stop-color"
                  values="#ec4899; #06b6d4; #a855f7; #ec4899"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pulse filter */}
            <filter id="pulse">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection Lines - User to Hub */}
          <motion.path
            d={`M ${userNode.x} ${userNode.y} Q ${(userNode.x + hubNode.x) / 2} ${userNode.y - 10} ${hubNode.x} ${hubNode.y}`}
            fill="none"
            stroke={isConnectionActive("user", "hub") ? "url(#activeGradient)" : "#9ca3af"}
            strokeWidth={isConnectionActive("user", "hub") ? "0.4" : "0.2"}
            strokeDasharray={isConnectionActive("user", "hub") ? "0" : "2,2"}
            opacity={isConnectionActive("user", "hub") ? 1 : 0.3}
            filter={isConnectionActive("user", "hub") ? "url(#glow)" : "none"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: isConnectionActive("user", "hub") ? 1 : 0.3 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Connection Lines - Hub to Other Businesses */}
          {otherNodes.map((node) => {
            const isActive = isConnectionActive("hub", node.id);
            return (
              <motion.path
                key={node.id}
                d={`M ${hubNode.x} ${hubNode.y} Q ${(hubNode.x + node.x) / 2} ${(hubNode.y + node.y) / 2 - 5} ${node.x} ${node.y}`}
                fill="none"
                stroke={isActive ? "url(#activeGradient)" : "#9ca3af"}
                strokeWidth={isActive ? "0.4" : "0.2"}
                strokeDasharray={isActive ? "0" : "2,2"}
                opacity={isActive ? 1 : 0.3}
                filter={isActive ? "url(#glow)" : "none"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isActive ? 1 : 0.3 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
              />
            );
          })}

          {/* Animated Particles */}
          <AnimatePresence>
            {particles.map((particle) => {
              const [from, to] = particle.path.split("-");
              const fromNode = getNodePosition(from);
              const toNode = getNodePosition(to);
              
              return (
                <motion.circle
                  key={particle.id}
                  r="0.5"
                  fill="#a855f7"
                  filter="url(#glow)"
                  initial={{ 
                    cx: fromNode.x, 
                    cy: fromNode.y,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{ 
                    cx: toNode.x, 
                    cy: toNode.y,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1.5, 0],
                  }}
                  transition={{ 
                    duration: 1.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              );
            })}
          </AnimatePresence>

          {/* User Business Node */}
          <g>
            <motion.circle
              cx={userNode.x}
              cy={userNode.y}
              r="4"
              fill="url(#activeGradient)"
              filter="url(#pulse)"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx={userNode.x}
              cy={userNode.y}
              r="6"
              fill="none"
              stroke="url(#activeGradient)"
              strokeWidth="0.3"
              opacity="0.5"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </g>

          {/* AI Hub Node */}
          <g>
            <motion.circle
              cx={hubNode.x}
              cy={hubNode.y}
              r="5"
              fill="url(#activeGradient)"
              filter="url(#pulse)"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              }}
            />
            <motion.circle
              cx={hubNode.x}
              cy={hubNode.y}
              r="7"
              fill="none"
              stroke="url(#activeGradient)"
              strokeWidth="0.3"
              opacity="0.6"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx={hubNode.x}
              cy={hubNode.y}
              r="9"
              fill="none"
              stroke="url(#activeGradient)"
              strokeWidth="0.2"
              opacity="0.4"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </g>

          {/* Other Business Nodes */}
          {otherNodes.map((node, index) => {
            const isActive = isConnectionActive("hub", node.id);
            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="3"
                  fill={isActive ? "url(#activeGradient)" : "#9ca3af"}
                  opacity={isActive ? 1 : 0.5}
                  filter={isActive ? "url(#glow)" : "none"}
                  animate={{
                    scale: isActive ? [1, 1.15, 1] : 1,
                    y: [0, -1, 0],
                  }}
                  transition={{
                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 },
                  }}
                />
                {isActive && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r="5"
                    fill="none"
                    stroke="url(#activeGradient)"
                    strokeWidth="0.2"
                    opacity="0.5"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Node Labels */}
        <motion.div
          className="absolute left-[10%] top-[45%] -translate-x-1/2 -translate-y-1/2"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg backdrop-blur-xl border border-white/20">
            <Building2 className="w-4 h-4 inline mr-2" />
            Your Business
          </div>
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg backdrop-blur-xl border border-white/20">
            <Zap className="w-4 h-4 inline mr-2" />
            AI Network Hub
          </div>
        </motion.div>

        {otherNodes.map((node, index) => (
          <motion.div
            key={node.id}
            className="absolute"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: index * 0.2,
            }}
          >
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur-xl border ${
              isConnectionActive("hub", node.id)
                ? "bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white border-white/30"
                : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50"
            }`}>
              {node.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 text-center z-10"
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="inline-block mb-4"
        >
          <Network className="w-12 h-12 text-purple-600 dark:text-purple-400" />
        </motion.div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600">
          Discovering Business Network
        </h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            {loadingMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Stats Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center gap-8 z-10"
      >
        <div className="text-center">
          <motion.div
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CountUp end={150} duration={2} />+
          </motion.div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Businesses</div>
        </div>

        <div className="text-center">
          <motion.div
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            <CountUp end={12} duration={2} />+
          </motion.div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
        </div>

        <div className="text-center">
          <motion.div
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          >
            <CountUp end={50} duration={2} />km
          </motion.div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Radius</div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple count-up animation component
function CountUp({ end, duration }: { end: number; duration: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count}</span>;
}

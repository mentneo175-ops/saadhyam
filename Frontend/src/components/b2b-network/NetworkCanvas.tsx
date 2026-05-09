import { useRef, useEffect, useState } from "react";
import { BusinessNode } from "./BusinessNode";
import { NeuralConnection } from "./NeuralConnection";
import type { Business, NetworkNode as NetworkNodeType } from "./types";

interface NetworkCanvasProps {
  userBusiness: Business | null;
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
}

export function NetworkCanvas({
  userBusiness,
  businesses,
  onBusinessClick,
}: NetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NetworkNodeType[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!userBusiness || dimensions.width === 0) return;

    // Calculate node positions
    const allBusinesses = [userBusiness, ...businesses];
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const newNodes: NetworkNodeType[] = allBusinesses.map((business, index) => {
      if (index === 0) {
        // User business at center
        return {
          business,
          x: centerX,
          y: centerY,
          connections: businesses.slice(0, 8).map((b) => b.id),
        };
      }

      // Arrange other businesses in a circle
      const angle = ((index - 1) / businesses.length) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return {
        business,
        x,
        y,
        connections: [userBusiness.id],
      };
    });

    setNodes(newNodes);
  }, [userBusiness, businesses, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-muted/10">
      {/* SVG Layer for Connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {/* Draw connections */}
        {nodes.map((node) =>
          node.connections.map((targetId) => {
            const targetNode = nodes.find((n) => n.business.id === targetId);
            if (!targetNode) return null;

            return (
              <NeuralConnection
                key={`${node.business.id}-${targetId}`}
                from={{ x: node.x, y: node.y }}
                to={{ x: targetNode.x, y: targetNode.y }}
                animated
              />
            );
          })
        )}
      </svg>

      {/* Business Nodes */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {nodes.map((node, index) => (
          <BusinessNode
            key={node.business.id}
            business={node.business}
            x={node.x}
            y={node.y}
            isCenter={index === 0}
            onClick={() => onBusinessClick(node.business)}
            delay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import type { ServiceFlow } from "@/components/b2b-network/types";

const availableServices = [
  "AI Automation",
  "Web Development",
  "SEO",
  "Marketing",
  "Branding",
  "Cloud Services",
  "DevOps",
  "Consulting",
  "Analytics",
  "Design",
  "Content Creation",
  "Social Media",
];

export function useServiceFlows(businessIds: string[]) {
  const [flows, setFlows] = useState<ServiceFlow[]>([]);

  useEffect(() => {
    if (businessIds.length < 2) return;

    // Generate service flows between businesses
    const newFlows: ServiceFlow[] = [];
    const centerBusinessId = businessIds[0];

    // Create flows from center to other businesses
    businessIds.slice(1, 7).forEach((businessId, index) => {
      const service =
        availableServices[Math.floor(Math.random() * availableServices.length)];

      newFlows.push({
        id: `flow-${centerBusinessId}-${businessId}`,
        from: centerBusinessId,
        to: businessId,
        service,
        progress: 0,
      });
    });

    setFlows(newFlows);

    // Animate flow progress
    const interval = setInterval(() => {
      setFlows((prevFlows) =>
        prevFlows.map((flow) => ({
          ...flow,
          progress: (flow.progress + 0.01) % 1,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [businessIds]);

  const addFlow = (from: string, to: string, service: string) => {
    const newFlow: ServiceFlow = {
      id: `flow-${from}-${to}-${Date.now()}`,
      from,
      to,
      service,
      progress: 0,
    };
    setFlows((prev) => [...prev, newFlow]);
  };

  const removeFlow = (flowId: string) => {
    setFlows((prev) => prev.filter((flow) => flow.id !== flowId));
  };

  return { flows, addFlow, removeFlow };
}

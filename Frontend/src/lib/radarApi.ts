import { getApiBaseUrl } from "./runtimeUrls";

const getApiUrl = () => {
  return getApiBaseUrl() || "http://localhost:8000";
};


export interface RadarOpportunity {
  id: number;
  title: string;
  description: string;
  category: "nearby" | "seasonal" | "b2b" | "trend";
  estimated_value?: string;
  urgency: "high" | "medium" | "low";
  distance?: string;
  action_label: string;
  action_link?: string;
  status: "active" | "contacted" | "dismissed";
  created_at?: string;
}

export async function getRadarOpportunities(
  token: string,
  category?: string
): Promise<{ status: string; opportunities: RadarOpportunity[]; total: number }> {
  const url = new URL(`${getApiUrl()}/api/radar/`);
  if (category) {
    url.searchParams.append("category", category);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to fetch radar opportunities");
  }

  return response.json();
}

export async function scanRadarOpportunities(
  token: string
): Promise<{ status: string; source: string; opportunities: RadarOpportunity[] }> {
  const response = await fetch(`${getApiUrl()}/api/radar/scan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to scan for opportunities");
  }

  return response.json();
}

export async function updateRadarOpportunity(
  token: string,
  opportunityId: number,
  status: "contacted" | "dismissed"
): Promise<{ status: string; opportunity_id: number; new_status: string }> {
  const response = await fetch(`${getApiUrl()}/api/radar/action`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      opportunity_id: opportunityId,
      status: status,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to update opportunity status");
  }

  return response.json();
}

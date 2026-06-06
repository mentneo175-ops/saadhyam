import { apiClient } from "@/lib/api";

export interface VoiceCommandResponse {
  log_id: number;
  intent: string;
  action: string;
  route: string | null;
  params: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  reply_te: string;
}

export const voiceCommandApi = {
  async parse(text: string, currentRoute: string, lang: string = "te"): Promise<VoiceCommandResponse> {
    return apiClient.post("/api/voice-command/parse", { text, currentRoute, lang });
  },

  async logExecution(logId: number, executed: boolean): Promise<any> {
    return apiClient.post("/api/voice-command/log-execution", { log_id: logId, executed });
  }
};

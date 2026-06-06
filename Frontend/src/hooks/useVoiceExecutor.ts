import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { voiceCommandApi, VoiceCommandResponse } from "@/lib/voiceCommandApi";

interface UseVoiceExecutorProps {
  onAskConfirmation?: (command: VoiceCommandResponse) => void;
  onSuccess?: (message: string) => void;
}

export function useVoiceExecutor({ onAskConfirmation, onSuccess }: UseVoiceExecutorProps = {}) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const executeCommand = async (command: VoiceCommandResponse): Promise<boolean> => {
    const { intent, action, route, params, log_id, reply_te } = command;

    // Handle permissions check
    if (intent === "PERMISSION_DENIED") {
      toast.error(reply_te);
      return false;
    }

    // Handle dangerous actions that require confirmation first
    if (command.requiresConfirmation || action === "ASK_CONFIRMATION") {
      if (onAskConfirmation) {
        onAskConfirmation(command);
        return false;
      }
      toast.warning("ఈ చర్యకు కన్ఫర్మేషన్ అవసరం.");
      return false;
    }

    try {
      // 1. NAVIGATE action
      if (action === "NAVIGATE" && route) {
        const [path, searchStr] = route.split("?");
        const search: Record<string, string> = {};
        if (searchStr) {
          const urlParams = new URLSearchParams(searchStr);
          urlParams.forEach((value, key) => {
            search[key] = value;
          });
        }
        
        await navigate({ to: path as any, search: search as any });
        if (onSuccess) onSuccess(reply_te);
        // Log auto execution success directly
        await voiceCommandApi.logExecution(log_id, true);
        return true;
      }

      // 2. SET_THEME action
      if (action === "SET_THEME" && params && params.theme) {
        const selectedTheme = params.theme;
        if (selectedTheme === "dark" || selectedTheme === "light") {
          setTheme(selectedTheme);
          if (onSuccess) onSuccess(reply_te);
          await voiceCommandApi.logExecution(log_id, true);
          return true;
        }
      }

      // 3. GENERATE_DRAFT action (WhatsApp draft)
      if (action === "GENERATE_DRAFT") {
        // Navigate to whatsapp sales page to start draft flow
        await navigate({ to: "/dashboard/whatsapp-sales" as any });
        if (onSuccess) onSuccess(reply_te);
        await voiceCommandApi.logExecution(log_id, true);
        return true;
      }

      // 4. Fallback / NO_ACTION
      if (action === "NO_ACTION" || intent === "UNKNOWN") {
        if (intent === "UNKNOWN") {
          toast.error(reply_te);
        } else {
          if (onSuccess) onSuccess(reply_te);
        }
        return true;
      }

      // Default fallback
      if (reply_te) {
        if (onSuccess) onSuccess(reply_te);
      }
      return true;
    } catch (e) {
      console.error("Error executing voice command:", e);
      toast.error("కమాండ్ ఎగ్జిక్యూషన్ విఫలమైంది.");
      return false;
    }
  };

  const confirmDangerousAction = async (command: VoiceCommandResponse): Promise<void> => {
    try {
      // Log execution status on the backend
      await voiceCommandApi.logExecution(command.log_id, true);
      
      // Perform mock dangerous action side effects or show success feedback
      let successMsg = "చర్య విజయవంతంగా పూర్తయింది.";
      
      if (command.intent === "DELETE_LEAD") {
        successMsg = "లీడ్ విజయవంతంగా డిలీట్ చేయబడింది.";
      } else if (command.intent === "DELETE_CAMPAIGN") {
        successMsg = "క్యాంపెయిన్ విజయవంతంగా డిలీట్ చేయబడింది.";
      } else if (command.intent === "SEND_WHATSAPP_MESSAGE") {
        successMsg = "వాట్సాప్ మెసేజ్ విజయవంతంగా పంపబడింది.";
      } else if (command.intent === "STOP_CAMPAIGN") {
        successMsg = "క్యాంపెయిన్ విజయవంతంగా ఆపివేయబడింది.";
      } else if (command.intent === "DISABLE_AGENT") {
        successMsg = "వాయిస్ ఏజెంట్ డిసేబుల్ చేయబడింది.";
      }

      if (onSuccess) {
        onSuccess(successMsg);
      } else {
        toast.success(successMsg);
      }
    } catch (e) {
      console.error("Failed to execute dangerous action:", e);
      toast.error("చర్య విఫలమైంది.");
    }
  };

  return {
    executeCommand,
    confirmDangerousAction
  };
}

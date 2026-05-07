import { useState } from "react";
import { Globe, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface WebsiteImportProps {
  onTextExtracted: (text: string, title?: string) => void;
  disabled?: boolean;
}

export function WebsiteImport({ onTextExtracted, disabled }: WebsiteImportProps) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Please enter a website URL");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setImporting(true);
    setImportStatus("idle");

    try {
      const response = await apiClient.importWebsite(url);

      if (response.success) {
        setImportStatus("success");
        console.log("Website import success! Text length:", response.text?.length);
        console.log("Website import text:", response.text);
        toast.success("Website imported successfully!");
        onTextExtracted(response.text, response.title);
        setUrl("");
      } else {
        setImportStatus("error");
        toast.error(response.message || "Failed to import website");
      }
    } catch (error: any) {
      setImportStatus("error");
      const errorMessage = error.data?.detail || error.message || "Failed to import website";
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !importing) {
      handleImport();
    }
  };

  return (
    <div className="relative">
      <div className={`
        p-5 rounded-xl border-2 transition-all duration-300 shadow-lg
        ${importStatus === "success"
          ? "border-green-400 bg-green-50"
          : importStatus === "error"
          ? "border-red-400 bg-red-50"
          : "border-purple-300 bg-white"
        }
      `}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all
              ${importStatus === "success"
                ? "bg-green-100"
                : importStatus === "error"
                ? "bg-red-100"
                : "bg-purple-100"
              }
            `}>
              {importing ? (
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              ) : importStatus === "success" ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : importStatus === "error" ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Globe className="w-6 h-6 text-purple-600" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Website Import</h3>
              <p className="text-xs text-gray-600">Enter your website URL below</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="url"
              placeholder="https://www.yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={disabled || importing}
              className="w-full h-12 text-base px-4 border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              autoFocus
            />
            
            <button
              type="button"
              onClick={handleImport}
              disabled={disabled || importing || !url.trim()}
              className={`
                w-full h-12 rounded-lg font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2
                ${disabled || importing || !url.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Import Website</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { FileText, Loader2,  AlertCircle, Upload, CheckCircle2  } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface PDFUploadProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export function PDFUpload({ onTextExtracted, disabled }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF file too large. Maximum size is 10MB");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setUploadStatus("idle");

    try {
      const response = await apiClient.uploadPDF(file);

      if (response.success) {
        setUploadStatus("success");
        toast.success("PDF uploaded and processed successfully!");
        onTextExtracted(response.text);
      } else {
        setUploadStatus("error");
        toast.error(response.message || "Failed to process PDF");
      }
    } catch (error: any) {
      setUploadStatus("error");
      const errorMessage = error.data?.detail || error.message || "Failed to upload PDF";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || uploading}
        className={`
          w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 text-left
          ${uploadStatus === "success" 
            ? "border-green-300 bg-green-50/50" 
            : uploadStatus === "error"
            ? "border-red-300 bg-red-50/50"
            : "border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 hover:shadow-lg"
          }
          ${uploading ? "cursor-wait" : "cursor-pointer"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300
            ${uploadStatus === "success"
              ? "bg-green-100"
              : uploadStatus === "error"
              ? "bg-red-100"
              : "bg-purple-100 group-hover:bg-purple-200"
            }
          `}>
            {uploading ? (
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            ) : uploadStatus === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : uploadStatus === "error" ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : (
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
              {uploading ? "Processing..." : uploadStatus === "success" ? "PDF Uploaded!" : "Upload PDF or Brochure"}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {uploading
                ? fileName
                : uploadStatus === "success"
                ? "Document processed successfully"
                : "Menu, catalog, flyer"}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

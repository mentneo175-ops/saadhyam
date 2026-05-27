import React from "react";

interface LoaderProps {
  text?: string;
  className?: string;
}

export function Loader({ text = "Loading", className = "" }: LoaderProps) {
  return (
    <div className={`min-h-full w-full flex items-center justify-center p-8 ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
        <span>{text}</span>
        <span className="inline-flex gap-0.5 items-center">
          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
        </span>
      </div>
    </div>
  );
}

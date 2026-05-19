import type { ReactNode } from "react";

export function renderMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {boldText}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

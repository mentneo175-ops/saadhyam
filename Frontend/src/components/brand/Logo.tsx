import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: 16, text: "text-base" },
  md: { box: "h-10 w-10", icon: 20, text: "text-lg" },
  lg: { box: "h-12 w-12", icon: 24, text: "text-xl" },
};

export function Logo({ size = "md", showText = true, to = "/" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      {showText && (
        <span className={`font-bold ${s.text} tracking-tight`}>
          Saadhyam <span className="text-gradient">AI</span>
        </span>
      )}
    </Link>
  );
}

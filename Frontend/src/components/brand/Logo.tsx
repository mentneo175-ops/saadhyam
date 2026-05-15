import { Link } from "@tanstack/react-router";
import logoImage from "@/Icon/Saadhyam_Icon-removebg-preview.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { img: "h-10", text: "text-base", gap: "gap-2" },
  md: { img: "h-12", text: "text-lg", gap: "gap-2" },
  lg: { img: "h-16", text: "text-xl", gap: "gap-3" },
};

export function Logo({ size = "md", showText = true, to = "/" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link to={to} className={`flex items-center ${s.gap} group hover:opacity-80 transition-opacity`}>
      <img 
        src={logoImage} 
        alt="Saadhyam AI Logo" 
        className={`${s.img} w-auto object-contain`}
      />
      {showText && (
        <span className={`font-bold ${s.text} tracking-tight`}>
          Saadhyam <span className="text-gradient">AI</span>
        </span>
      )}
    </Link>
  );
}

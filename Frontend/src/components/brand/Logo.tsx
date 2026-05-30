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

export function Logo({ size = "md", showText = true, to = "/dashboard" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link to={to} className={`flex items-center ${s.gap} group hover:opacity-80 transition-opacity`}>
      <img 
        src={logoImage} 
        alt="Saadhyam AI Logo" 
        className={`${s.img} w-auto object-contain`}
      />
      {showText && (
        <span className="flex items-baseline gap-1 leading-none">
          <span className={`font-bold ${s.text} tracking-tight`}>
            Saadhyam
          </span>
          <span className="flex flex-col items-center leading-none">
            <span className={`font-bold ${s.text} tracking-tight text-gradient`}>
              AI
            </span>
            <span className="mt-0 text-[5px] font-medium uppercase tracking-[0.08em] text-muted-foreground leading-none opacity-60">
              v0.56
            </span>
          </span>
        </span>
      )}
    </Link>
  );
}

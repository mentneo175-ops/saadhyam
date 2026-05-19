import { type LucideIcon } from "lucide-react";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  impact: "High" | "Medium" | "Low";
  bg: string;
  iconColor: string;
}

const impactColor = {
  High: "bg-blue-50 text-blue-900",
  Medium: "bg-gray-100 text-gray-700",
  Low: "bg-gray-50 text-gray-600",
};

// Helper function to render markdown text with bold
const renderMarkdown = (text: string) => {
  // Split by ** to find bold sections
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** and render as bold
      const boldText = part.slice(2, -2);
      return <strong key={idx} className="font-bold text-gray-900">{boldText}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
};

export function ActionCard({ icon: Icon, title, desc, impact, bg, iconColor }: ActionCardProps) {
  return (
    <div
      className="group min-w-[260px] snap-start rounded-2xl border border-gray-200/50 p-5 bg-white/80 backdrop-blur-sm hover:border-purple-300 hover:shadow-xl hover:shadow-purple-200/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-fuchsia-50/0 group-hover:from-purple-50/60 group-hover:to-fuchsia-50/40 transition-all duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300"
          >
            <Icon size={20} className="text-white" />
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${impactColor[impact]} shadow-sm`}
          >
            {impact} impact
          </span>
        </div>
        <p className="font-bold text-sm mb-2 text-gray-900 group-hover:text-purple-900 transition-colors">
          {renderMarkdown(title)}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

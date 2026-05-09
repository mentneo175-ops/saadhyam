import { Search, Filter, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkControlsProps {
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const categories = [
  { value: "all", label: "All Businesses" },
  { value: "Technology", label: "Technology" },
  { value: "Marketing", label: "Marketing" },
  { value: "Consulting", label: "Consulting" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Education", label: "Education" },
  { value: "Retail", label: "Retail" },
];

export function NetworkControls({
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: NetworkControlsProps) {
  return (
    <div className="p-4 border-b border-border/60 bg-card/50">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Nearby
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Partners
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Search, SlidersHorizontal } from "lucide-react";

interface PremiumSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  showFilters: boolean;
  activeFilterCount?: number;
}

export function PremiumSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  showFilters,
  activeFilterCount = 0,
}: PremiumSearchBarProps) {
  return (
    <div className="relative z-50 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Simple Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for businesses..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
            />
          </div>

          {/* Simple Filter Button */}
          <button
            onClick={onFilterClick}
            className={`relative px-6 py-3 rounded-lg font-medium transition-colors ${
              showFilters
                ? "bg-purple-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              
              {/* Active Filter Count Badge */}
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

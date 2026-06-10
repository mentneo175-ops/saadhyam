import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, Star, Sparkles } from "lucide-react";

interface FilterPanelProps {
  show: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  showSaadhyamOnly: boolean;
  onSaadhyamOnlyChange: (value: boolean) => void;
  showVerifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  showRelevantOnly: boolean;
  onRelevantOnlyChange: (value: boolean) => void;
}

const categories = [
  { id: "Technology", icon: "💻", color: "from-blue-500 to-cyan-500" },
  { id: "Marketing", icon: "📢", color: "from-pink-500 to-rose-500" },
  { id: "Consulting", icon: "💼", color: "from-purple-500 to-indigo-500" },
  { id: "Healthcare", icon: "🏥", color: "from-red-500 to-pink-500" },
  { id: "Education", icon: "📚", color: "from-green-500 to-emerald-500" },
  { id: "Retail", icon: "🛍️", color: "from-yellow-500 to-orange-500" },
  { id: "Finance", icon: "💰", color: "from-emerald-500 to-teal-500" },
  { id: "Hospitality", icon: "🏨", color: "from-orange-500 to-red-500" },
  { id: "Other", icon: "🏢", color: "from-gray-500 to-slate-500" },
];

export function FilterPanel({
  show,
  onClose,
  selectedCategories,
  onCategoriesChange,
  showSaadhyamOnly,
  onSaadhyamOnlyChange,
  showVerifiedOnly,
  onVerifiedOnlyChange,
  showRelevantOnly,
  onRelevantOnlyChange,
}: FilterPanelProps) {
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove category
      onCategoriesChange(selectedCategories.filter(c => c !== categoryId));
    } else {
      // Add category
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const clearAllFilters = () => {
    onCategoriesChange([]);
    onSaadhyamOnlyChange(false);
    onVerifiedOnlyChange(false);
    onRelevantOnlyChange(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Filter Panel - Full Page */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[101] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Filters</h2>
                  <p className="text-sm text-white/80 mt-1">
                    Refine your business search
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Business Type Filters */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Business Type
                </h3>
                <div className="space-y-3">
                  {/* Synergistic Partners Only */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={showRelevantOnly}
                      onChange={(e) => onRelevantOnlyChange(e.target.checked)}
                      className="w-5 h-5 rounded border-blue-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Synergistic Partners Only
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Show only categories relevant to your business type
                      </p>
                    </div>
                  </motion.label>

                  {/* Saadhyam Partners Only */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={showSaadhyamOnly}
                      onChange={(e) => onSaadhyamOnlyChange(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Saadhyam Partners Only
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Show only verified Saadhyam businesses
                      </p>
                    </div>
                  </motion.label>

                  {/* Verified Only */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={showVerifiedOnly}
                      onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Verified Businesses
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Show only verified businesses
                      </p>
                    </div>
                  </motion.label>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Categories (Select Multiple)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Category Buttons - Multiple Selection */}
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCategory(category.id)}
                        className={`p-4 rounded-xl border-2 transition-all relative ${
                          isSelected
                            ? `bg-gradient-to-r ${category.color} border-transparent text-white shadow-lg`
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-purple-400"
                        }`}
                      >
                        {/* Selection Checkmark */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center dark:bg-slate-900"
                          >
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-xs font-semibold line-clamp-1">
                          {category.id}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* Selected Count */}
                {selectedCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                  >
                    <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                      {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategories.map((catId) => {
                        const cat = categories.find(c => c.id === catId);
                        return (
                          <span key={catId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            {cat?.icon} {catId}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Clear Filters */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearAllFilters}
                className="w-full py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Clear All Filters
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

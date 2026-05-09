import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <motion.button
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectCategory(category.id)}
          className="group relative p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-left"
        >
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
          >
            {category.icon}
          </div>

          {/* Category Name */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
            {category.name}
          </h3>

          {/* Business Count */}
          <p className="text-sm text-gray-600 mb-4">
            {category.count} {category.count === 1 ? "business" : "businesses"}
          </p>

          {/* Arrow */}
          <div className="absolute bottom-6 right-6">
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}

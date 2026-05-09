import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  gradient: string;
}

interface PremiumCategoryCardProps {
  category: Category;
  index: number;
  onSelect: (categoryId: string) => void;
}

export function PremiumCategoryCard({ category, index, onSelect }: PremiumCategoryCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(category.id)}
      className="group relative w-full"
    >
      {/* Glassmorphism Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500">
        {/* Gradient Glow on Hover */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${category.gradient} blur-2xl`}
          style={{ transform: "scale(0.8)" }}
        />

        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 rounded-3xl ${category.gradient} opacity-20 blur-xl`} />
        </div>

        {/* Card Content */}
        <div className="relative p-8">
          {/* Icon Container */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${category.gradient} mb-6 shadow-lg`}
          >
            <span className="text-3xl">{category.icon}</span>
          </motion.div>

          {/* Category Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
            {category.name}
          </h3>

          {/* Business Count */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span className="font-semibold text-gray-900 dark:text-white">{category.count}</span>{" "}
            {category.count === 1 ? "business" : "businesses"}
          </p>

          {/* Animated Arrow */}
          <motion.div
            className="flex items-center justify-end"
            initial={{ x: 0 }}
            whileHover={{ x: 8 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`p-2 rounded-xl ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </motion.button>
  );
}

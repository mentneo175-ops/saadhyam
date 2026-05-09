import { motion } from "framer-motion";
import { Building2, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { Business } from "./types";

interface BusinessGridProps {
  businesses: Business[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectBusiness: (business: Business) => void;
}

const ITEMS_PER_PAGE = 9;

export function BusinessGrid({
  businesses,
  currentPage,
  totalPages,
  onPageChange,
  onSelectBusiness,
}: BusinessGridProps) {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBusinesses = businesses.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Business Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentBusinesses.map((business, index) => (
          <motion.button
            key={business.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectBusiness(business)}
            className="group bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200 overflow-hidden text-left"
          >
            {/* Business Icon/Logo */}
            <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Business Info */}
            <div className="p-5">
              {/* Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                {business.name}
              </h3>

              {/* Category */}
              <p className="text-sm text-gray-600 mb-3">{business.category}</p>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">
                  {business.location.lat.toFixed(4)}, {business.location.lng.toFixed(4)}
                </span>
              </div>

              {/* Rating (Mock for now) */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-600 ml-1">(4.0)</span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3">
                {business.isVerified && (
                  <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                    Verified
                  </span>
                )}
                {business.isPartner && (
                  <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                    Partner
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first, last, current, and adjacent pages
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                    page === currentPage
                      ? "bg-purple-600 text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
            return null;
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, businesses.length)} of {businesses.length}{" "}
        businesses
      </div>
    </div>
  );
}

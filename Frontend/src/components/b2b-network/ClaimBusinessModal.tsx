import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Upload, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { Business } from "./types";

interface ClaimBusinessModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClaimData) => void;
}

interface ClaimData {
  businessName: string;
  category: string;
  proofUrl?: string;
  description: string;
}

export function ClaimBusinessModal({
  business,
  isOpen,
  onClose,
  onSubmit,
}: ClaimBusinessModalProps) {
  const [formData, setFormData] = useState<ClaimData>({
    businessName: business.name,
    category: business.category,
    proofUrl: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error claiming business:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-cyan-400/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Claim Business
                      </h2>
                      <p className="text-sm text-cyan-300/70 mt-1">
                        Verify ownership to unlock premium features
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Success State */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Claim Submitted!
                  </h3>
                  <p className="text-cyan-300/70">
                    We'll verify your claim and get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Business Name */}
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData({ ...formData, businessName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400/50 transition-colors"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                        required
                      >
                        <option value="Technology">Technology</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Why are you claiming this business?
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
                        placeholder="I am the owner/manager of this business..."
                        required
                      />
                    </div>

                    {/* Proof URL */}
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Proof of Ownership (Optional)
                      </label>
                      <div className="relative">
                        <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                        <input
                          type="url"
                          value={formData.proofUrl}
                          onChange={(e) =>
                            setFormData({ ...formData, proofUrl: e.target.value })
                          }
                          placeholder="https://example.com/proof.pdf"
                          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-400/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400/50 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-cyan-300/50 mt-2">
                        Link to business registration, website, or social media
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-slate-800/50 border border-cyan-400/20 text-white font-medium hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Claim"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Feather } from "lucide-react";
import { Reflection } from "@/types/canopy";

interface ThoughtVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReflection: Reflection | null;
  onReleaseThought: (text: string) => void;
  onOpenCompose: () => void;
}

export const ThoughtVaultDrawer: React.FC<ThoughtVaultDrawerProps> = ({
  isOpen,
  onClose,
  selectedReflection,
  onReleaseThought,
  onOpenCompose,
}) => {
  const [thoughtText, setThoughtText] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);

  const maxLength = 180;

  const handleRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtText.trim() || isReleasing) return;

    setIsReleasing(true);

    // Give time for shrink-and-drift upward animation before closing
    setTimeout(() => {
      onReleaseThought(thoughtText.trim());
      setThoughtText("");
      setIsReleasing(false);
      onClose();
    }, 700);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !isReleasing && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Drawer / Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={
              isReleasing
                ? {
                    scale: 0.1,
                    y: -400,
                    opacity: 0,
                    boxShadow: "0 0 40px 20px rgba(253, 230, 138, 0.9)",
                  }
                : { y: 0, scale: 1, opacity: 1 }
            }
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 280,
              duration: isReleasing ? 0.7 : 0.4,
            }}
            className="relative w-full sm:max-w-lg ambient-glass-card rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200/80" />
                <h3 className="text-sm font-medium tracking-wide text-gray-200 uppercase">
                  {selectedReflection ? "Thought Reflection" : "Thought Vault"}
                </h3>
              </div>
              <button
                onClick={onClose}
                disabled={isReleasing}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            {selectedReflection ? (
              /* VIEW MODE: Tapped Star Content */
              <div className="space-y-4 py-2">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <p className="text-lg font-light leading-relaxed text-amber-100/90 italic">
                    &ldquo;{selectedReflection.text}&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>{selectedReflection.authorTag || "Anonymous Night Canopy traveler"}</span>
                  <span className="text-gray-500">{selectedReflection.timestamp}</span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={onOpenCompose}
                    className="flex-1 ambient-glow-button text-xs py-3 px-4 rounded-xl font-medium text-amber-200 flex items-center justify-center gap-2"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    Share Your Own Reflection
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-3 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Return to Canopy
                  </button>
                </div>
              </div>
            ) : (
              /* COMPOSE MODE: Write & Release Reflection */
              <form onSubmit={handleRelease} className="space-y-4 py-2">
                <div className="relative">
                  <textarea
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value.slice(0, maxLength))}
                    maxLength={maxLength}
                    rows={4}
                    placeholder="Whisper a quiet thought into the canopy... (What's keeping you awake?)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-200/40 focus:ring-1 focus:ring-amber-200/20 transition-all resize-none"
                    autoFocus
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500 font-mono">
                    {thoughtText.length} / {maxLength}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Anonymous & ambient
                  </span>

                  <button
                    type="submit"
                    disabled={!thoughtText.trim() || isReleasing}
                    className="ambient-glow-button text-xs py-2.5 px-5 rounded-xl font-medium text-amber-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isReleasing ? "Releasing Star..." : "Release into Sky"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

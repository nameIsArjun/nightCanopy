"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Plus, Sparkles, MessageSquare, Heart } from "lucide-react";
import { CanopyCanvas } from "@/components/CanopyCanvas";
import { ThoughtVaultDrawer } from "@/components/ThoughtVaultDrawer";
import { GroundingAudioPlayer } from "@/components/GroundingAudioPlayer";
import { EphemeralChat } from "@/components/EphemeralChat";
import { Reflection, AmbientDot } from "@/types/canopy";

export default function Home() {
  const [userIntent, setUserIntent] = useState<"quiet" | "opentotalk">("quiet");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [newStarQueue, setNewStarQueue] = useState<Reflection[]>([]);
  const [activeChatDot, setActiveChatDot] = useState<AmbientDot | null>(null);
  const [simulatedNodCount, setSimulatedNodCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated 30-second interval for incoming "Nod" from canopy companions
  useEffect(() => {
    const nodInterval = setInterval(() => {
      setSimulatedNodCount((prev) => prev + 1);
      setToastMessage("Someone in the canopy sent you a silent nod 🌙");

      // Auto-hide toast after 4 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 30000);

    return () => clearInterval(nodInterval);
  }, []);

  // Open drawer to view an existing star reflection
  const handleSelectStar = (reflection: Reflection) => {
    setSelectedReflection(reflection);
    setIsDrawerOpen(true);
  };

  // Open drawer to compose a brand new reflection
  const handleOpenCompose = () => {
    setSelectedReflection(null);
    setIsDrawerOpen(true);
  };

  // Handle thought submission: Create new star reflection and append to canvas
  const handleReleaseThought = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newReflection: Reflection = {
      id: `star-${Date.now()}`,
      text,
      timestamp: timeStr,
      authorTag: "Anonymous Stargazer",
    };

    setNewStarQueue((prev) => [...prev, newReflection]);
  };

  // Remove star from queue after canvas handles initialization
  const handleNewStarProcessed = (id: string) => {
    setNewStarQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Trigger Ephemeral Chat when an "Open to Talk" dot is clicked
  const handleOpenChat = (dot: AmbientDot) => {
    setActiveChatDot(dot);
  };

  // Point 2 & 4: Handle Ephemeral Chat closing with optional Parting Ember gift & Grounding Buffer Toast
  const handleCloseChat = (partingEmber?: import("@/types/canopy").EmberGift) => {
    if (partingEmber) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const emberStar: Reflection = {
        id: `ember-star-${Date.now()}`,
        text: `Parting Ember: ${partingEmber.message}`,
        timestamp: timeStr,
        authorTag: activeChatDot ? activeChatDot.userTag : "Canopy Companion",
        isEmber: true,
      };
      setNewStarQueue((prev) => [...prev, emberStar]);
    }

    setActiveChatDot(null);

    // Point 4: Post-Chat Re-anchoring & Grounding Buffer Toast (6-second duration)
    setToastMessage(
      "Session ended gently. Take a quiet breath... You were heard under the canopy tonight 🌙"
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Point 5: Handle Mutual Silent Gratitude notification
  const handleSendThankYou = () => {
    setToastMessage("A quiet thank you was shared. Your presence mattered 💖");
    setSimulatedNodCount((prev) => prev + 1);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0B0D12]">
      {/* Interactive HTML5 Canopy Canvas */}
      <CanopyCanvas
        onSelectStar={handleSelectStar}
        onOpenChat={handleOpenChat}
        newStarQueue={newStarQueue}
        onNewStarProcessed={handleNewStarProcessed}
        triggerSimulatedNodCount={simulatedNodCount}
      />

      {/* Ambient Toast Notification for Incoming Nod / Grounding Buffer */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 ambient-glass px-5 py-2.5 rounded-full border border-amber-200/30 text-xs text-amber-100 flex items-center gap-2 shadow-2xl backdrop-blur-xl"
          >
            <Heart className="w-4 h-4 text-pink-300 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Header Bar & Dual-Mode Toggle */}
      <header className="absolute top-0 left-0 right-0 z-20 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 max-w-6xl mx-auto gap-3 pointer-events-none">
        {/* Brand Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="p-2 rounded-full bg-white/5 border border-white/10 text-amber-200">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-medium tracking-wider text-gray-200 uppercase">
              The Night Canopy
            </h1>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-light">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse" />
              42 quiet souls present
            </p>
          </div>
        </div>

        {/* Dual-Mode Intent Switch & Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Intent Toggle Switch */}
          <div className="ambient-glass p-1 rounded-full flex items-center gap-1 border border-white/10">
            <button
              onClick={() => setUserIntent("quiet")}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                userIntent === "quiet"
                  ? "bg-white/15 text-gray-200 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Quiet Mode
            </button>
            <button
              onClick={() => setUserIntent("opentotalk")}
              className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all ${
                userIntent === "opentotalk"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 shadow-sm"
                  : "text-gray-400 hover:text-cyan-200"
              }`}
            >
              <MessageSquare className="w-3 h-3 text-cyan-300" />
              Open to Talk
            </button>
          </div>

          {/* Share a Thought Trigger */}
          <button
            onClick={handleOpenCompose}
            className="ambient-glow-button text-xs py-1.5 px-3.5 rounded-full text-amber-100 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Release Thought</span>
          </button>
        </div>
      </header>

      {/* Screen 2: Thought Vault Drawer */}
      <ThoughtVaultDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedReflection={selectedReflection}
        onReleaseThought={handleReleaseThought}
        onOpenCompose={() => setSelectedReflection(null)}
      />

      {/* Ephemeral Chat Sheet */}
      <EphemeralChat
        key={activeChatDot ? activeChatDot.id : "none"}
        isOpen={activeChatDot !== null}
        onClose={handleCloseChat}
        onSendThankYou={handleSendThankYou}
        targetDot={activeChatDot}
      />

      {/* Screen 3: Grounding & Ambient Audio Player Bar */}
      <GroundingAudioPlayer />

      {/* Ambient Hint Banner */}
      <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-1.5 text-[11px] text-gray-400 font-light pointer-events-none z-10 opacity-70">
        <Sparkles className="w-3 h-3 text-amber-200/70" />
        Dots with orbital rings are Open to Talk
      </div>
    </main>
  );
}

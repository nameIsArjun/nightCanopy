"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Moon, Sparkles, X } from "lucide-react";
import { AmbientDot } from "@/types/canopy";

interface EphemeralChatProps {
  isOpen: boolean;
  onClose: () => void;
  targetDot: AmbientDot | null;
}

interface SimpleChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
}

const ICEBREAKERS = [
  "What's one thing keeping you overthinking tonight?",
  "If you could whisper a message to the stars right now, what would it say?",
  "What song or sound is comforting you at this hour?",
  "What's a quiet memory that keeps coming back to you tonight?",
  "Are you staying up out of peace or restless energy?",
];

const INITIAL_ICEBREAKER_ANSWERS = [
  "Just moved into a new place in the city... the quiet is taking some getting used to.",
  "Honestly just watching the clock tick past 2 AM and letting my mind unwind.",
  "Listening to a soft ambient ambient loop and hoping sleep comes soon.",
  "Staring at the rain out the window... night hours always feel so vast.",
  "Trying to let go of tomorrow's to-do list so I can finally rest.",
];

const NIGHT_OWL_RESPONSES = [
  "I know that feeling all too well. The night has a way of making everything feel larger than it is.",
  "Thank you for sharing that with me. Wishing you peaceful sleep and gentle thoughts soon.",
  "It's reassuring to know others are sitting quietly under the canopy tonight too.",
  "Sometimes just acknowledging the thought is enough to let it rest. Take deep breaths.",
  "The quiet hours can be heavy, but you aren't carrying them alone.",
  "Taking things one breath at a time tonight. Glad we're both under the canopy.",
];

export const EphemeralChat: React.FC<EphemeralChatProps> = ({
  isOpen,
  onClose,
  targetDot,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [messages, setMessages] = useState<SimpleChatMessage[]>([]);
  const [isInitialTyping, setIsInitialTyping] = useState(true);
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);

  const [icebreaker] = useState<string>(
    () => ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]
  );

  const maxLength = 280;

  // Initial 2-second typing delay before companion reveals opening message
  useEffect(() => {
    if (!isOpen || !targetDot) return;

    const initialTimer = setTimeout(() => {
      const initialAnswer =
        INITIAL_ICEBREAKER_ANSWERS[
          Math.floor(Math.random() * INITIAL_ICEBREAKER_ANSWERS.length)
        ];
      setMessages([
        {
          id: `init-${Date.now()}`,
          sender: "them",
          text: initialAnswer,
        },
      ]);
      setIsInitialTyping(false);
    }, 2000);

    return () => clearTimeout(initialTimer);
  }, [isOpen, targetDot]);

  // Handle sending a user message with 3.5s response delay
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isCompanionTyping || isInitialTyping || isLeaving) return;

    const userMsg: SimpleChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "me",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsCompanionTyping(true);

    // 3.5-second delay before companion responds
    setTimeout(() => {
      const replyText =
        NIGHT_OWL_RESPONSES[Math.floor(Math.random() * NIGHT_OWL_RESPONSES.length)];
      const replyMsg: SimpleChatMessage = {
        id: `reply-${Date.now()}`,
        sender: "them",
        text: replyText,
      };
      setMessages((prev) => [...prev, replyMsg]);
      setIsCompanionTyping(false);
    }, 3500);
  };

  // "Heading to Sleep" Off-Ramp with farewell message and 1.5s fade-out
  const handleHeadingToSleep = () => {
    if (isLeaving) return;

    const farewellMsg: SimpleChatMessage = {
      id: `farewell-${Date.now()}`,
      sender: "them",
      text: "Rest well, night owl. Closing chat...",
    };

    setMessages((prev) => [...prev, farewellMsg]);
    setIsLeaving(true);

    // 1.5-second fade-out transition before closing modal
    setTimeout(() => {
      onClose();
      setIsLeaving(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && targetDot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            onClick={() => !isLeaving && onClose()}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Ephemeral Chat Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={
              isLeaving
                ? { y: 40, opacity: 0, scale: 0.96 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={{ y: "100%", opacity: 0 }}
            transition={
              isLeaving
                ? { duration: 1.5, ease: "easeInOut" }
                : { type: "spring", damping: 28, stiffness: 260 }
            }
            className="relative w-full sm:max-w-lg h-[82vh] sm:h-[620px] ambient-glass-card rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl z-10 border border-white/10 overflow-hidden"
          >
            {/* Header with Heading to Sleep Button */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-75" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    {targetDot.userTag}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                      Open to Talk
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-light">Ephemeral late-night session</p>
                </div>
              </div>

              {/* Prominent "Heading to sleep..." Exit Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleHeadingToSleep}
                  disabled={isLeaving}
                  className="ambient-glow-button text-xs py-1.5 px-3.5 rounded-full text-indigo-200 flex items-center gap-1.5 border border-indigo-500/30 bg-indigo-950/50 hover:bg-indigo-900/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Heading to sleep...</span>
                </button>
                <button
                  onClick={onClose}
                  disabled={isLeaving}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Icebreaker Card */}
            <div className="p-4 bg-white/5 border-b border-white/5 mx-4 mt-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-amber-200/80 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium tracking-wide uppercase text-[10px]">
                  Late-Night Icebreaker
                </span>
              </div>
              <p className="text-sm text-amber-100/90 font-light italic leading-relaxed">
                &ldquo;{icebreaker}&rdquo;
              </p>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Initial 2-second breathing typing indicator */}
              {isInitialTyping && (
                <div className="flex flex-col items-start">
                  <div className="bg-slate-800/60 border border-slate-700/40 text-slate-300 px-4 py-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-300" />
                    <span className="text-[11px] text-slate-400 ml-1">typing first note...</span>
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "me" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "me"
                        ? "bg-purple-900/40 border border-purple-400/20 text-purple-100 rounded-br-none"
                        : "bg-slate-800/60 border border-slate-700/40 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* 3.5-second Companion Typing Indicator */}
              {isCompanionTyping && (
                <div className="flex flex-col items-start">
                  <div className="bg-slate-800/60 border border-slate-700/40 text-slate-300 px-4 py-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse delay-300" />
                    <span className="text-[11px] text-slate-400 ml-1">typing a quiet reply...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/30">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, maxLength))}
                  maxLength={maxLength}
                  disabled={isCompanionTyping || isInitialTyping || isLeaving}
                  placeholder="Share a quiet message..."
                  className="w-full bg-black/50 border border-white/10 rounded-full py-2.5 pl-4 pr-20 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-200/40 transition-colors disabled:opacity-50"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {inputText.length}/{maxLength}
                  </span>
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isCompanionTyping || isInitialTyping || isLeaving}
                    className="p-1.5 rounded-full bg-amber-200/20 text-amber-200 hover:bg-amber-200/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

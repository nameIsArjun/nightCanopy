"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Wind, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const GroundingAudioPlayer: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBreathingExpanded, setIsBreathingExpanded] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // 4-7-8 Breathing Loop logic
  useEffect(() => {
    const cyclePhase = () => {
      setBreathPhase((prev) => {
        if (prev === "inhale") {
          setBreathSecondsLeft(7);
          return "hold";
        } else if (prev === "hold") {
          setBreathSecondsLeft(8);
          return "exhale";
        } else {
          setBreathSecondsLeft(4);
          return "inhale";
        }
      });
    };

    const timer = setInterval(() => {
      setBreathSecondsLeft((sec) => {
        if (sec <= 1) {
          cyclePhase();
          return 1;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Procedural Web Audio API Ambient Noise Synthesizer
  const toggleAudio = () => {
    if (isPlayingAudio) {
      // Fade out and stop
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
        setTimeout(() => {
          noiseNodeRef.current?.stop();
          setIsPlayingAudio(false);
        }, 550);
      } else {
        setIsPlayingAudio(false);
      }
    } else {
      // Create Ambient Drone using low-pass filtered brown noise
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brown noise integration filter
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 2.5; // Gain multiplier
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter for deep nocturnal warmth
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 180; // Warm low rumble

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noiseNodeRef.current = noise;
        gainNodeRef.current = gain;

        setIsPlayingAudio(true);
      } catch (e) {
        console.error("Audio Context initialization failed:", e);
      }
    }
  };

  const toggleMute = () => {
    if (!gainNodeRef.current || !audioCtxRef.current) return;
    if (isMuted) {
      gainNodeRef.current.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
      setIsMuted(false);
    } else {
      gainNodeRef.current.gain.setValueAtTime(0.0001, audioCtxRef.current.currentTime);
      setIsMuted(true);
    }
  };

  // Breathing Ring Phase Configs
  const getPhaseText = () => {
    if (breathPhase === "inhale") return "Inhale slowly (4s)";
    if (breathPhase === "hold") return "Hold gently (7s)";
    return "Exhale softly (8s)";
  };

  const getRingScale = () => {
    if (breathPhase === "inhale") return 1.4;
    if (breathPhase === "hold") return 1.4;
    return 1.0;
  };

  const getRingDuration = () => {
    if (breathPhase === "inhale") return 4;
    if (breathPhase === "hold") return 0.5;
    return 8;
  };

  return (
    <>
      {/* Expanded Breathing Modal */}
      <AnimatePresence>
        {isBreathingExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm ambient-glass-card rounded-3xl p-6 text-center shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium tracking-widest text-amber-200/70 uppercase">
                4-7-8 Grounding Breath
              </span>
              <button
                onClick={() => setIsBreathingExpanded(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Breathing Ring Animation */}
            <div className="relative my-8 flex items-center justify-center h-44">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{
                  scale: getRingScale(),
                  opacity: breathPhase === "hold" ? 0.8 : 0.4,
                }}
                transition={{
                  duration: getRingDuration(),
                  ease: "easeInOut",
                }}
                className="w-28 h-28 rounded-full border-2 border-amber-200/50 bg-amber-200/5 shadow-[0_0_30px_rgba(253,230,138,0.2)] absolute"
              />

              {/* Inner core */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-light font-mono text-amber-100">
                  {breathSecondsLeft}s
                </span>
                <span className="text-xs text-gray-300 capitalize tracking-wider mt-1">
                  {breathPhase}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-light">
              {getPhaseText()} — synchronize your breathing to ease late-night restlessness.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grounding Bottom Player Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md ambient-glass rounded-full px-5 py-3 flex items-center justify-between border border-white/10 shadow-xl">
        {/* Breathing Guide Trigger */}
        <button
          onClick={() => setIsBreathingExpanded(!isBreathingExpanded)}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-8 h-8">
            <motion.div
              animate={{
                scale: breathPhase === "inhale" ? 1.35 : breathPhase === "exhale" ? 0.9 : 1.35,
              }}
              transition={{
                duration: breathPhase === "inhale" ? 4 : breathPhase === "exhale" ? 8 : 0.5,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border border-amber-200/40 bg-amber-200/10"
            />
            <Wind className="w-4 h-4 text-amber-200 group-hover:scale-110 transition-transform" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-200 flex items-center gap-1">
              4-7-8 Breathing
              {isBreathingExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-gray-400" />
              )}
            </span>
            <span className="text-[10px] text-gray-400 font-mono tracking-tight capitalize">
              {breathPhase} ({breathSecondsLeft}s)
            </span>
          </div>
        </button>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Ambient Audio Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-200 transition-colors"
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-200" />
                <span>Ambient Sound</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">Night Drone</span>
              </>
            )}
          </button>

          {isPlayingAudio && (
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full text-gray-400 hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

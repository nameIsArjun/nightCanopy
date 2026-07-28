"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Wind,
  ChevronUp,
  ChevronDown,
  Moon,
  CloudRain,
  Waves,
  Sparkles,
  Trees,
  Check,
  Music,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type SoundPresetId = "drone" | "rain" | "waves" | "chimes" | "forest";

export interface SoundPreset {
  id: SoundPresetId;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOUND_PRESETS: SoundPreset[] = [
  {
    id: "drone",
    name: "Night Canopy",
    subtitle: "Grounding Earth Rumble",
    description: "Deep warm brown noise drone with low-frequency sub-harmonics.",
    icon: Moon,
  },
  {
    id: "rain",
    name: "Midnight Rain",
    subtitle: "Nocturnal Raindrop Pitter-Patter",
    description: "Filtered soft pink noise simulating gentle rainfall on leaves.",
    icon: CloudRain,
  },
  {
    id: "waves",
    name: "Nocturnal Waves",
    subtitle: "Oceanic Moonlight Tides",
    description: "Dynamic LFO-swept lowpass noise echoing distant shoreline swells.",
    icon: Waves,
  },
  {
    id: "chimes",
    name: "Starlight Chimes",
    subtitle: "Harmonic Meditative Tones",
    description: "Harmonic pure sine pads at 432 Hz with shimmering vibrato.",
    icon: Sparkles,
  },
  {
    id: "forest",
    name: "Quiet Forest",
    subtitle: "Night Breeze & Crickets",
    description: "Highpass nocturnal wind paired with delicate procedural cricket chirps.",
    icon: Trees,
  },
];

export const GroundingAudioPlayer: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // 0 to 1
  const [selectedPresetId, setSelectedPresetId] = useState<SoundPresetId>("drone");

  const [isBreathingExpanded, setIsBreathingExpanded] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // 4-7-8 Breathing states
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);

  // Web Audio API references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<(AudioNode | { stop?: () => void })[]>([]);

  // 4-7-8 Breathing Timer Loop
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

  // Clean up all active audio nodes safely
  const stopCurrentNodes = () => {
    activeNodesRef.current.forEach((node) => {
      try {
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        if ("disconnect" in node && typeof node.disconnect === "function") {
          node.disconnect();
        }
      } catch (e) {
        // Ignore nodes already stopped
      }
    });
    activeNodesRef.current = [];
  };

  // Helper to construct AudioContext & Master Gain
  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Update master gain when volume or mute state changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0.0001 : volume * 0.15;
      masterGainRef.current.gain.linearRampToValueAtTime(
        targetGain,
        audioCtxRef.current.currentTime + 0.1
      );
    }
  }, [volume, isMuted]);

  // Start synthesizer engine for given preset ID
  const startPresetEngine = (presetId: SoundPresetId) => {
    stopCurrentNodes();

    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    const effectiveGain = isMuted ? 0.0001 : volume * 0.15;
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(effectiveGain, ctx.currentTime + 0.8);
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    if (presetId === "drone") {
      // Deep Brown Noise Drone + 55Hz sub-sine oscillator
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 160;

      const subOsc = ctx.createOscillator();
      subOsc.type = "sine";
      subOsc.frequency.value = 55; // A1 warm tone

      const subGain = ctx.createGain();
      subGain.gain.value = 0.3;

      subOsc.connect(subGain);
      subGain.connect(masterGain);

      noise.connect(filter);
      filter.connect(masterGain);

      noise.start();
      subOsc.start();

      activeNodesRef.current = [noise, subOsc, filter, subGain, masterGain];
    } else if (presetId === "rain") {
      // Midnight Rain: Pink noise through bandpass filter + gain flutter
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1400;
      filter.Q.value = 0.6;

      noise.connect(filter);
      filter.connect(masterGain);

      noise.start();

      activeNodesRef.current = [noise, filter, masterGain];
    } else if (presetId === "waves") {
      // Nocturnal Waves: Brown noise + sweeping LFO lowpass filter
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.025 * white) / 1.025;
        lastOut = data[i];
        data[i] *= 2.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 240;

      // LFO sweeping the filter cutoff between ~120 Hz and 480 Hz
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1; // 10 second wave cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 180; // filter range depth

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(masterGain);

      noise.start();
      lfo.start();

      activeNodesRef.current = [noise, filter, lfo, lfoGain, masterGain];
    } else if (presetId === "chimes") {
      // Starlight Chimes: Harmonic meditative sine wave oscillators at 432 Hz with vibrato
      const createHarmonic = (freq: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;

        const gainNode = ctx.createGain();
        gainNode.gain.value = gainVal;

        osc.connect(gainNode);
        gainNode.connect(masterGain);
        osc.start();

        return [osc, gainNode];
      };

      const [osc1, g1] = createHarmonic(216, 0.4); // A3
      const [osc2, g2] = createHarmonic(432, 0.35); // A4 432 Hz
      const [osc3, g3] = createHarmonic(648, 0.15); // E5 harmonic

      // Shimmer LFO
      const vibrato = ctx.createOscillator();
      vibrato.type = "sine";
      vibrato.frequency.value = 0.18;

      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 1.5;

      vibrato.connect(vibratoGain);
      vibratoGain.connect((osc2 as OscillatorNode).frequency);
      vibrato.start();

      activeNodesRef.current = [osc1, g1, osc2, g2, osc3, g3, vibrato, vibratoGain, masterGain];
    } else if (presetId === "forest") {
      // Quiet Forest: Soft highpass wind noise + procedural cricket chirps
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const wind = ctx.createBufferSource();
      wind.buffer = buffer;
      wind.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 750;
      windFilter.Q.value = 0.5;

      wind.connect(windFilter);
      windFilter.connect(masterGain);
      wind.start();

      // Procedural Cricket chirper
      const cricketOsc = ctx.createOscillator();
      cricketOsc.type = "sine";
      cricketOsc.frequency.value = 4600;

      const cricketGain = ctx.createGain();
      cricketGain.gain.value = 0.015;

      // Pulse modulator for cricket chirps
      const pulseLFO = ctx.createOscillator();
      pulseLFO.type = "square";
      pulseLFO.frequency.value = 12; // fast chirping pattern

      const pulseGain = ctx.createGain();
      pulseGain.gain.value = 0.015;

      pulseLFO.connect(pulseGain);
      cricketOsc.connect(cricketGain);
      cricketGain.connect(masterGain);

      cricketOsc.start();
      pulseLFO.start();

      activeNodesRef.current = [
        wind,
        windFilter,
        cricketOsc,
        cricketGain,
        pulseLFO,
        pulseGain,
        masterGain,
      ];
    }
  };

  // Toggle playback on/off
  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.linearRampToValueAtTime(
          0.0001,
          audioCtxRef.current.currentTime + 0.4
        );
        setTimeout(() => {
          stopCurrentNodes();
          setIsPlayingAudio(false);
        }, 450);
      } else {
        stopCurrentNodes();
        setIsPlayingAudio(false);
      }
    } else {
      startPresetEngine(selectedPresetId);
      setIsPlayingAudio(true);
    }
  };

  // Select a new preset
  const handleSelectPreset = (presetId: SoundPresetId) => {
    setSelectedPresetId(presetId);
    if (isPlayingAudio) {
      startPresetEngine(presetId);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Breathing Ring helpers
  const getPhaseText = () => {
    if (breathPhase === "inhale") return "Inhale slowly (4s)";
    if (breathPhase === "hold") return "Hold gently (7s)";
    return "Exhale softly (8s)";
  };

  const getRingScale = () => {
    if (breathPhase === "inhale" || breathPhase === "hold") return 1.4;
    return 1.0;
  };

  const getRingDuration = () => {
    if (breathPhase === "inhale") return 4;
    if (breathPhase === "hold") return 0.5;
    return 8;
  };

  const activePreset =
    SOUND_PRESETS.find((p) => p.id === selectedPresetId) || SOUND_PRESETS[0];
  const ActiveIcon = activePreset.icon;

  return (
    <>
      {/* Expanded 4-7-8 Breathing Guide Modal */}
      <AnimatePresence>
        {isBreathingExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm ambient-glass-card rounded-3xl p-6 text-center shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium tracking-widest text-amber-200/70 uppercase">
                4-7-8 Grounding Breath
              </span>
              <button
                onClick={() => setIsBreathingExpanded(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Breathing Ring Animation */}
            <div className="relative my-8 flex items-center justify-center h-44">
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

      {/* Soundscape Selector Popover Card */}
      <AnimatePresence>
        {isSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm ambient-glass-card rounded-3xl p-5 shadow-2xl border border-white/10 text-gray-200"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-amber-100">
                  Ambient Soundscapes
                </span>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Sound Presets List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {SOUND_PRESETS.map((preset) => {
                const IconComp = preset.icon;
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all border ${
                      isSelected
                        ? "bg-amber-200/10 border-amber-200/40 text-amber-100 shadow-md"
                        : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl border ${
                          isSelected
                            ? "bg-amber-200/20 border-amber-200/40 text-amber-200"
                            : "bg-white/5 border-white/10 text-gray-400"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium flex items-center gap-2">
                          {preset.name}
                          <span className="text-[10px] text-gray-400 font-normal">
                            • {preset.subtitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-light mt-0.5 line-clamp-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-200 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume Control Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white p-1"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-pink-300" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-amber-200" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-200" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full accent-amber-200 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grounding Bottom Player Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md ambient-glass rounded-full px-5 py-3 flex items-center justify-between border border-white/10 shadow-xl">
        {/* Breathing Guide Trigger */}
        <button
          onClick={() => {
            setIsBreathingExpanded(!isBreathingExpanded);
            if (isSelectorOpen) setIsSelectorOpen(false);
          }}
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

        {/* Ambient Sound Selector & Controls */}
        <div className="flex items-center gap-2">
          {/* Active Preset Selector Toggle */}
          <button
            onClick={() => {
              setIsSelectorOpen(!isSelectorOpen);
              if (isBreathingExpanded) setIsBreathingExpanded(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 transition-all group"
          >
            <ActiveIcon className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium text-amber-100/90">
              {activePreset.name}
            </span>
            <ChevronUp
              className={`w-3 h-3 text-gray-400 transition-transform ${
                isSelectorOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Play/Pause Main Button */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full border transition-all ${
              isPlayingAudio
                ? "bg-amber-200/20 border-amber-200/50 text-amber-100 shadow-[0_0_15px_rgba(253,230,138,0.2)]"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={isPlayingAudio ? "Pause Ambient Sound" : "Play Ambient Sound"}
          >
            {isPlayingAudio ? (
              <Pause className="w-3.5 h-3.5 text-amber-200" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

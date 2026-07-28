"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { AmbientDot, ThoughtStar, Reflection } from "@/types/canopy";

interface CanopyCanvasProps {
  onSelectStar: (reflection: Reflection) => void;
  onOpenChat?: (dot: AmbientDot) => void;
  newStarQueue?: Reflection[];
  onNewStarProcessed?: (id: string) => void;
  triggerSimulatedNodCount?: number;
}

const INITIAL_REFLECTIONS: Reflection[] = [
  {
    id: "star-1",
    text: "I wonder if anyone else is watching the quiet rainfall at 2 AM...",
    timestamp: "02:14 AM",
    authorTag: "Night Wanderer",
  },
  {
    id: "star-2",
    text: "Sometimes the late night is the only time the mind stops racing.",
    timestamp: "01:45 AM",
    authorTag: "Midnight Stargazer",
  },
  {
    id: "star-3",
    text: "Wishing peace to everyone staying awake with their thoughts right now.",
    timestamp: "03:02 AM",
    authorTag: "Quiet Soul",
  },
  {
    id: "star-4",
    text: "Leaving a small light here for whoever needs it tonight.",
    timestamp: "02:50 AM",
    authorTag: "Canopy Listener",
  },
  {
    id: "star-5",
    text: "The silence of the room makes the world feel vast and gentle.",
    timestamp: "02:30 AM",
    authorTag: "Moonlight Listener",
  },
  {
    id: "star-6",
    text: "There is a unique comfort in knowing you aren't the only one awake.",
    timestamp: "03:15 AM",
    authorTag: "Solitary Watcher",
  },
  {
    id: "star-7",
    text: "Hope tomorrow brings a little more clarity to whatever you're facing.",
    timestamp: "01:20 AM",
    authorTag: "Midnight Friend",
  },
  {
    id: "star-8",
    text: "Staring out the window listening to the wind against the glass.",
    timestamp: "02:05 AM",
    authorTag: "Nocturnal Thinker",
  },
  {
    id: "star-9",
    text: "Late night tea and quiet reflections... inhaling peace, exhaling noise.",
    timestamp: "03:40 AM",
    authorTag: "Quiet Traveler",
  },
  {
    id: "star-10",
    text: "Remember to be kind to yourself. You're doing the best you can.",
    timestamp: "02:55 AM",
    authorTag: "Gentle Presence",
  },
];

const SOFT_COLORS = [
  "rgba(147, 197, 253, ", // Soft cyan-blue
  "rgba(167, 139, 250, ", // Soft lavender
  "rgba(253, 230, 138, ", // Soft amber/warm white
  "rgba(110, 231, 183, ", // Soft emerald
  "rgba(244, 114, 182, ", // Soft rose
];

const USER_TAGS = [
  "Night Owl",
  "Silent Stargazer",
  "Midnight Dreamer",
  "Quiet Reader",
  "Insomnia Wanderer",
  "Canopy Companion",
];

export const CanopyCanvas: React.FC<CanopyCanvasProps> = ({
  onSelectStar,
  onOpenChat,
  newStarQueue = [],
  onNewStarProcessed,
  triggerSimulatedNodCount = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<AmbientDot[]>([]);
  const starsRef = useRef<ThoughtStar[]>([]);
  const requestRef = useRef<number | null>(null);

  // Initialize particles & stars
  const initCanvasState = useCallback((width: number, height: number) => {
    const dotCount = Math.floor(Math.min(50, Math.max(30, (width * height) / 25000)));
    const dots: AmbientDot[] = [];

    for (let i = 0; i < dotCount; i++) {
      const baseRadius = 2.5 + Math.random() * 3;
      const isTalkative = i % 3 === 0; // ~33% are Open to Talk
      dots.push({
        id: `dot-${i}`,
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius,
        radius: baseRadius,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: 0.2 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        color: isTalkative
          ? "rgba(147, 197, 253, "
          : SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)],
        intent: isTalkative ? "opentotalk" : "quiet",
        orbitPhase: Math.random() * Math.PI * 2,
        userTag: USER_TAGS[i % USER_TAGS.length],
      });
    }
    dotsRef.current = dots;

    // Render 6 floating stars from reflections pool
    const visibleReflections = INITIAL_REFLECTIONS.slice(0, 6);
    const stars: ThoughtStar[] = visibleReflections.map((ref, idx) => ({
      id: ref.id,
      x: (width * (0.15 + (idx * 0.15))) % (width - 60) + 30,
      y: (height * (0.2 + (idx % 3) * 0.22)) % (height - 120) + 60,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: 14 + Math.random() * 4,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.01,
      reflection: ref,
    }));
    starsRef.current = stars;
  }, []);

  // Trigger simulated incoming nod pulse on a random canvas dot
  useEffect(() => {
    if (triggerSimulatedNodCount <= 0 || dotsRef.current.length === 0) return;

    const randomIndex = Math.floor(Math.random() * dotsRef.current.length);
    const dot = dotsRef.current[randomIndex];
    if (dot) {
      dotsRef.current[randomIndex] = {
        ...dot,
        haloPulse: {
          currentRadius: dot.radius + 3,
          maxRadius: dot.radius + 45,
          alpha: 0.9,
        },
      };

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {}
      }
    }
  }, [triggerSimulatedNodCount]);

  // Process incoming new stars from Thought Vault submission or Parting Embers
  useEffect(() => {
    if (newStarQueue.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    newStarQueue.forEach((newRef) => {
      if (starsRef.current.some((s) => s.id === newRef.id)) return;

      const newStar: ThoughtStar = {
        id: newRef.id,
        x: width * 0.5 + (Math.random() - 0.5) * 120,
        y: height * 0.85,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.35 - Math.random() * 0.2,
        size: newRef.isEmber ? 18 : 16,
        twinklePhase: 0,
        twinkleSpeed: newRef.isEmber ? 0.03 : 0.02,
        reflection: newRef,
        isEmber: newRef.isEmber,
      };

      starsRef.current.unshift(newStar);
      if (onNewStarProcessed) {
        onNewStarProcessed(newRef.id);
      }
    });
  }, [newStarQueue, onNewStarProcessed]);

  // Main Draw & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initCanvasState(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    initCanvasState(canvas.clientWidth, canvas.clientHeight);

    // Draw 4-point star icon helper
    const drawStar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
      colorPrefix: string,
      alpha: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      context.beginPath();
      context.moveTo(cx, cy - outerRadius);

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
      context.lineTo(cx, cy - outerRadius);
      context.closePath();

      // Soft glow outline
      context.shadowColor = `${colorPrefix}0.8)`;
      context.shadowBlur = 12;
      context.fillStyle = `${colorPrefix}${alpha})`;
      context.fill();
      context.shadowBlur = 0;
    };

    const render = () => {
      const cWidth = canvas.clientWidth;
      const cHeight = canvas.clientHeight;

      ctx.clearRect(0, 0, cWidth, cHeight);

      // Render Ambient Dots
      dotsRef.current.forEach((dot) => {
        dot.x += dot.vx;
        dot.y += dot.vy;

        if (dot.x < 10) dot.vx = Math.abs(dot.vx);
        if (dot.x > cWidth - 10) dot.vx = -Math.abs(dot.vx);
        if (dot.y < 10) dot.vy = Math.abs(dot.vy);
        if (dot.y > cHeight - 10) dot.vy = -Math.abs(dot.vy);

        dot.pulsePhase += dot.pulseSpeed;
        dot.orbitPhase += 0.015;
        const breathFactor = Math.sin(dot.pulsePhase);
        dot.radius = dot.baseRadius + breathFactor * 0.8;
        const currentAlpha = Math.max(0.2, Math.min(0.85, dot.alpha + breathFactor * 0.15));

        // Draw Double Orbital Ring for "Open to Talk" dots
        if (dot.intent === "opentotalk") {
          const orbitPulse = Math.sin(dot.orbitPhase);
          const r1 = dot.radius + 6 + orbitPulse * 2;
          const r2 = dot.radius + 12 + Math.cos(dot.orbitPhase) * 3;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, r1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(147, 197, 253, ${0.25 + orbitPulse * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, r2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.15 - orbitPulse * 0.05})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Dot Core
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${dot.color}${currentAlpha})`;
        ctx.shadowColor = `${dot.color}0.7)`;
        ctx.shadowBlur = dot.intent === "opentotalk" ? 14 : 8;
        ctx.fill();

        // Draw Expanding Halo Pulse if triggered
        if (dot.haloPulse) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.haloPulse.currentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `${dot.color}${dot.haloPulse.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 14;
          ctx.stroke();

          dot.haloPulse.currentRadius += 1.2;
          dot.haloPulse.alpha -= 0.02;

          if (dot.haloPulse.alpha <= 0) {
            delete dot.haloPulse;
          }
        }

        ctx.shadowBlur = 0;
      });

      // Render Floating Thought Stars & Ember Stars
      starsRef.current.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.vy < -0.05) {
          star.vy *= 0.99;
        }

        if (star.x < 20) star.vx = Math.abs(star.vx);
        if (star.x > cWidth - 20) star.vx = -Math.abs(star.vx);
        if (star.y < 40) star.vy = Math.abs(star.vy);
        if (star.y > cHeight - 100) star.vy = -Math.abs(star.vy);

        star.twinklePhase += star.twinkleSpeed;
        const twinkleFactor = Math.sin(star.twinklePhase);
        const starAlpha = Math.max(0.4, Math.min(0.95, 0.7 + twinkleFactor * 0.25));

        const colorPrefix = star.isEmber
          ? "rgba(251, 146, 60, "
          : "rgba(253, 230, 138, ";

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size + (star.isEmber ? 8 : 4) + twinkleFactor * 2, 0, Math.PI * 2);
        ctx.fillStyle = `${colorPrefix}${starAlpha * (star.isEmber ? 0.25 : 0.12)})`;
        ctx.fill();

        if (star.isEmber) {
          // Extra pulsing ring around Ember Star
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size + 14 + Math.sin(star.twinklePhase * 1.5) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(244, 114, 182, ${starAlpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        drawStar(
          ctx,
          star.x,
          star.y,
          4,
          star.size,
          star.size / 2.5,
          colorPrefix,
          starAlpha
        );
      });

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initCanvasState]);

  // Click & Tap Interaction Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check Star Intersections
    for (const star of starsRef.current) {
      const dist = Math.hypot(clickX - star.x, clickY - star.y);
      if (dist < star.size + 16) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(50);
          } catch {}
        }
        onSelectStar(star.reflection);
        return;
      }
    }

    // Check Ambient Dot Intersections
    for (let i = 0; i < dotsRef.current.length; i++) {
      const dot = dotsRef.current[i];
      const hitRadius = dot.intent === "opentotalk" ? dot.radius + 24 : dot.radius + 18;
      const dist = Math.hypot(clickX - dot.x, clickY - dot.y);

      if (dist < hitRadius) {
        if (dot.intent === "opentotalk" && onOpenChat) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            try {
              navigator.vibrate([30, 40, 30]);
            } catch {}
          }
          onOpenChat(dot);
          return;
        }

        dotsRef.current[i] = {
          ...dot,
          haloPulse: {
            currentRadius: dot.radius + 2,
            maxRadius: dot.radius + 35,
            alpha: 0.8,
          },
        };

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(50);
          } catch {}
        }
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute inset-0 w-full h-full cursor-pointer touch-none z-0"
    />
  );
};

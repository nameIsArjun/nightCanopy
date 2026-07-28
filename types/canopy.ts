export interface AmbientDot {
  id: string;
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
  intent: "quiet" | "opentotalk";
  orbitPhase: number;
  userTag: string;
  haloPulse?: {
    currentRadius: number;
    maxRadius: number;
    alpha: number;
  };
}

export interface Reflection {
  id: string;
  text: string;
  timestamp: string;
  authorTag?: string;
}

export interface ThoughtStar {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;
  reflection: Reflection;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
}

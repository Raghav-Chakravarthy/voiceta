"use client";

import React, { useEffect, useState } from "react";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";
export type AvatarStyle = "tree" | "network" | "circle" | "professional";

interface AvatarProps {
  state: AvatarState;
  style: AvatarStyle;
  size?: number;
  volumeLevel?: number; // 0–1, from Vapi
}

// Distinct appearance per agent
const AGENT_LOOK: Record<AvatarStyle, {
  bg: string; ring: string;
  skin: string; skinShadow: string;
  hair: string; iris: string;
  shirt: string; mouth: string;
}> = {
  tree: {        // CMSC420 — warm academic
    bg: "#eef2ff", ring: "#6366f1",
    skin: "#f4c08a", skinShadow: "#d4956a",
    hair: "#2c1a0e", iris: "#4a3020",
    shirt: "#6366f1", mouth: "#b05a50",
  },
  network: {     // CMSC417 — cool techy
    bg: "#e0f2fe", ring: "#0284c7",
    skin: "#fddcb5", skinShadow: "#d4a870",
    hair: "#1a1a2e", iris: "#1e4d80",
    shirt: "#0284c7", mouth: "#b06060",
  },
  circle: {      // Telehealth — warm caring
    bg: "#ecfdf5", ring: "#059669",
    skin: "#c07840", skinShadow: "#8c5428",
    hair: "#1e0e04", iris: "#2c1810",
    shirt: "#059669", mouth: "#903030",
  },
  professional: { // Interview Coach — sharp
    bg: "#f1f5f9", ring: "#475569",
    skin: "#7c4a1a", skinShadow: "#5a3010",
    hair: "#0a0a0a", iris: "#1a0a00",
    shirt: "#1e293b", mouth: "#7a2020",
  },
};

// Human face SVG — clearly renders at any size
function Face({
  look, state,
}: {
  look: typeof AGENT_LOOK[AvatarStyle];
  state: AvatarState;
}) {
  // Mouth animation when speaking
  const [mouthPhase, setMouthPhase] = useState(0);
  useEffect(() => {
    if (state !== "speaking") { setMouthPhase(0); return; }
    const id = setInterval(() => setMouthPhase((p) => (p + 1) % 6), 130);
    return () => clearInterval(id);
  }, [state]);

  // Mouth openness: 0=smile, phases alternate open/closed
  const openness = state === "speaking"
    ? [2, 6, 10, 7, 4, 1][mouthPhase]
    : state === "idle" ? 1 : 2;

  // Blink animation
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const schedule = () => {
      const wait = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 120);
      }, wait);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  return (
    <svg viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Neck */}
      <rect x="42" y="80" width="16" height="16" rx="5" fill={look.skin} />

      {/* Shirt/shoulders */}
      <path d="M10 115 Q10 95 50 95 Q90 95 90 115 Z" fill={look.shirt} />
      {/* Collar V */}
      <path d="M42 95 L50 108 L58 95" fill={look.skin} />

      {/* Head */}
      <ellipse cx="50" cy="46" rx="30" ry="33" fill={look.skin} />

      {/* Hair — top cap */}
      <path
        d="M20 42 Q20 13 50 12 Q80 13 80 42 Q76 22 50 20 Q24 22 20 42 Z"
        fill={look.hair}
      />
      {/* Side hair / temples */}
      <ellipse cx="20.5" cy="50" rx="4.5" ry="9" fill={look.skin} />
      <ellipse cx="79.5" cy="50" rx="4.5" ry="9" fill={look.skin} />
      {/* Ear inner */}
      <ellipse cx="20.5" cy="50" rx="2.5" ry="5" fill={look.skinShadow} opacity="0.35" />
      <ellipse cx="79.5" cy="50" rx="2.5" ry="5" fill={look.skinShadow} opacity="0.35" />

      {/* Eyebrows */}
      <path d="M30 35 Q37.5 31 45 35" stroke={look.hair} strokeWidth="2.8"
        fill="none" strokeLinecap="round" />
      <path d="M55 35 Q62.5 31 70 35" stroke={look.hair} strokeWidth="2.8"
        fill="none" strokeLinecap="round" />

      {/* Eyes — whites */}
      <ellipse cx="37.5" cy="46" rx="7.5" ry={blink ? 1 : 6} fill="white" />
      <ellipse cx="62.5" cy="46" rx="7.5" ry={blink ? 1 : 6} fill="white" />

      {/* Irises */}
      {!blink && (
        <>
          <circle cx="37.5" cy="47" r="4.2" fill={look.iris} />
          <circle cx="62.5" cy="47" r="4.2" fill={look.iris} />
          {/* Pupils */}
          <circle cx="37.5" cy="47" r="2.2" fill="#050505" />
          <circle cx="62.5" cy="47" r="2.2" fill="#050505" />
          {/* Eye shine */}
          <circle cx="39.5" cy="45" r="1.2" fill="white" opacity="0.85" />
          <circle cx="64.5" cy="45" r="1.2" fill="white" opacity="0.85" />
        </>
      )}

      {/* Nose — subtle */}
      <path d="M47 57 Q50 65 53 57" stroke={look.skinShadow} strokeWidth="1.6"
        fill="none" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="46.2" cy="63.5" rx="2.2" ry="1.4" fill={look.skinShadow} opacity="0.22" />
      <ellipse cx="53.8" cy="63.5" rx="2.2" ry="1.4" fill={look.skinShadow} opacity="0.22" />

      {/* Mouth */}
      <path
        d={`M37 72 Q50 ${72 + openness + 3} 63 72`}
        stroke={look.mouth} strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
      {/* Teeth when mouth open enough */}
      {openness > 4 && (
        <ellipse cx="50" cy={72 + openness * 0.45 + 1} rx="9" ry={openness * 0.45 + 1}
          fill="white" opacity="0.9" />
      )}
      {/* Tongue hint when fully open */}
      {openness > 7 && (
        <ellipse cx="50" cy={72 + openness * 0.7 + 1} rx="5" ry="2"
          fill={look.mouth} opacity="0.5" />
      )}

      {/* Listening indicator — subtle ear glow */}
      {state === "listening" && (
        <>
          <circle cx="20.5" cy="50" r="5" fill={look.ring} opacity="0.25" />
          <circle cx="79.5" cy="50" r="5" fill={look.ring} opacity="0.25" />
        </>
      )}
    </svg>
  );
}

// ─── Animated rings (listening) ───────────────────────────────────────────────

function ListenRings({ color }: { color: string }) {
  return (
    <>
      {[1, 1.45, 1.9].map((scale, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            transform: `scale(${scale})`,
            opacity: 0,
            animation: "listenRipple 2s ease-out infinite",
            animationDelay: `${i * 0.55}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Waveform (speaking) ──────────────────────────────────────────────────────

function SpeakWave({ color }: { color: string }) {
  const heights = [4, 10, 16, 11, 20, 14, 8, 18, 12, 6];
  return (
    <div className="flex items-end gap-[3px]">
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 4,
            backgroundColor: color,
            animation: "waveBar 0.55s ease-in-out infinite alternate",
            animationDelay: `${i * 0.055}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function ThinkDots({ color }: { color: string }) {
  return (
    <div className="flex gap-2 items-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 10, height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            animation: "dotBounce 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Avatar({ state, style, size = 200 }: AvatarProps) {
  const look = AGENT_LOOK[style];

  // Shadow changes by state
  const shadow =
    state === "speaking"
      ? `0 0 0 4px ${look.ring}50, 0 8px 40px ${look.ring}30, 0 2px 12px rgba(0,0,0,0.12)`
      : state === "listening"
      ? `0 0 0 3px ${look.ring}35, 0 6px 24px rgba(0,0,0,0.1)`
      : `0 4px 24px rgba(0,0,0,0.1)`;

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%,100% { transform:scale(1); }
          50%      { transform:scale(1.022); }
        }
        @keyframes listenRipple {
          0%   { opacity:0.5; transform:scale(1); }
          100% { opacity:0;   transform:scale(1.9); }
        }
        @keyframes thinkPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.6; }
        }
        @keyframes dotBounce {
          0%,100% { transform:translateY(0);    opacity:0.5; }
          50%      { transform:translateY(-9px); opacity:1; }
        }
        @keyframes waveBar {
          from { transform:scaleY(0.3); }
          to   { transform:scaleY(1); }
        }
      `}</style>

      {/* Wrapper — extra bottom space for dots / wave */}
      <div className="flex flex-col items-center gap-4" style={{ width: size }}>

        {/* Avatar circle */}
        <div
          className="relative flex items-center justify-center rounded-full overflow-visible flex-shrink-0"
          style={{
            width: size,
            height: size,
            background: look.bg,
            boxShadow: shadow,
            transition: "box-shadow 0.4s ease",
            animation:
              state === "idle"     ? "breathe 3.5s ease-in-out infinite"  :
              state === "thinking" ? "thinkPulse 2s ease-in-out infinite" :
              undefined,
          }}
        >
          {/* Listening ripple rings — overflow outside circle */}
          {state === "listening" && (
            <div className="absolute inset-0 rounded-full overflow-visible pointer-events-none">
              <ListenRings color={look.ring} />
            </div>
          )}

          {/* The face — clips to circle */}
          <div
            className="rounded-full overflow-hidden"
            style={{ width: size, height: size }}
          >
            <Face look={look} state={state} />
          </div>
        </div>

        {/* State indicator below avatar */}
        <div style={{ height: 28, display: "flex", alignItems: "center" }}>
          {state === "thinking" && <ThinkDots color={look.ring} />}
          {state === "speaking" && <SpeakWave color={look.ring} />}
        </div>
      </div>
    </>
  );
}

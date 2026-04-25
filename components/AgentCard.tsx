"use client";

import React from "react";
import { Persona } from "@/lib/personas";
import Avatar from "./Avatar";

interface AgentCardProps {
  persona: Persona;
  selected: boolean;
  onSelect: () => void;
}

const accentBorderMap: Record<string, string> = {
  indigo: "border-indigo-400 ring-indigo-200",
  sky: "border-sky-400 ring-sky-200",
  emerald: "border-emerald-400 ring-emerald-200",
  slate: "border-slate-400 ring-slate-200",
};

export default function AgentCard({ persona, selected, onSelect }: AgentCardProps) {
  const borderClass = selected
    ? `border-2 ring-2 ${accentBorderMap[persona.accentColor]}`
    : "border border-gray-200 hover:border-gray-300";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-5 bg-white transition-all duration-200
        shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${borderClass}`}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-4">
        {/* Mini avatar — clip the extra space for waveform/dots */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: 56, height: 56 }}>
          <Avatar state="idle" style={persona.avatarStyle} size={56} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              {persona.name}
            </h3>
            {selected && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                ✓ Selected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{persona.description}</p>
        </div>
      </div>
    </button>
  );
}

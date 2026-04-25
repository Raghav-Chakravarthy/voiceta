"use client";

import React from "react";
import { AvatarState } from "./Avatar";

interface StatusPillProps {
  state: AvatarState;
}

const config: Record<AvatarState, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  idle: {
    label: "Ready",
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-100",
    textClass: "text-gray-500",
  },
  listening: {
    label: "Listening",
    dotClass: "bg-green-500 animate-pulse",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
  },
  thinking: {
    label: "Thinking",
    dotClass: "bg-amber-400 animate-pulse",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
  },
  speaking: {
    label: "Speaking",
    dotClass: "bg-blue-500 animate-pulse",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
};

export default function StatusPill({ state }: StatusPillProps) {
  const { label, dotClass, bgClass, textClass } = config[state];
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        transition-all duration-300 ${bgClass} ${textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </div>
  );
}

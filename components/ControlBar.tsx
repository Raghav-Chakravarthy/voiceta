"use client";

import React from "react";

interface ControlBarProps {
  micEnabled: boolean;
  onToggleMic: () => void;
  onDoneSpeaking: () => void;
  onEndSession: () => void;
  canDoneSpeaking: boolean; // true when there's interim transcript to send
  isProcessing: boolean;    // true when AI is thinking/speaking
}

function MicIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {enabled ? (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A1 1 0 0 1 10 18" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

export default function ControlBar({
  micEnabled,
  onToggleMic,
  onDoneSpeaking,
  onEndSession,
  canDoneSpeaking,
  isProcessing,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        disabled={isProcessing}
        aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
        className={`w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-200 shadow-sm focus:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-gray-400
          ${micEnabled
            ? "bg-gray-900 text-white hover:bg-gray-700"
            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <MicIcon enabled={micEnabled} />
      </button>

      {/* Done speaking — manually trigger turn */}
      <button
        onClick={onDoneSpeaking}
        disabled={!canDoneSpeaking || isProcessing}
        aria-label="Done speaking — send message"
        className={`flex items-center gap-2 px-5 h-12 rounded-full text-sm font-medium
          transition-all duration-200 shadow-sm focus:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-gray-400
          ${canDoneSpeaking && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-700"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
      >
        <CheckIcon />
        Done Speaking
      </button>

      {/* End session */}
      <button
        onClick={onEndSession}
        aria-label="End session"
        className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center
          transition-all duration-200 hover:bg-red-600 shadow-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
      >
        <PhoneOffIcon />
      </button>
    </div>
  );
}

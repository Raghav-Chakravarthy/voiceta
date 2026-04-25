"use client";

import React, { useRef, useEffect } from "react";

interface NotepadProps {
  notes: string;
  onChange: (val: string) => void;
  agentName: string;
}

export default function Notepad({ notes, onChange, agentName }: NotepadProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [notes]);

  function handleCopy() {
    navigator.clipboard.writeText(notes).catch(() => {});
  }

  function handleClear() {
    if (confirm("Clear all notes?")) onChange("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Notes
          </h3>
          <p className="text-[10px] text-gray-300 mt-0.5">{agentName} · auto-captured</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy notes"
            className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            onClick={handleClear}
            title="Clear notes"
            className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Notepad area */}
      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="text-gray-300 text-sm leading-relaxed">
            Key points will appear here as the conversation progresses. You can also type your own notes below.
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing your own notes here, or let Arlo fill them in…"
          className="w-full resize-none bg-transparent text-sm text-gray-700
            leading-relaxed focus:outline-none placeholder:text-gray-300
            font-[inherit] min-h-[120px]"
          spellCheck
        />
      </div>
    </div>
  );
}

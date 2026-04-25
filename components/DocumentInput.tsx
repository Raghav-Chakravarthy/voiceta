"use client";

import React, { useState } from "react";

export interface DocEntry {
  url: string;
  title: string;
  text: string;
  charCount: number;
}

interface DocumentInputProps {
  docs: DocEntry[];
  onChange: (docs: DocEntry[]) => void;
}

const MAX_DOCS = 3;

export default function DocumentInput({ docs, onChange }: DocumentInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const url = input.trim();
    if (!url) return;
    if (docs.length >= MAX_DOCS) return;
    if (docs.some((d) => d.url === url)) {
      setError("Already added.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fetch-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load document.");
        return;
      }

      onChange([...docs, { url, title: data.title, text: data.text, charCount: data.charCount }]);
      setInput("");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove(url: string) {
    onChange(docs.filter((d) => d.url !== url));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* URL input */}
        <input
          type="url"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a URL — lecture notes, Google Doc, course page…"
          disabled={loading || docs.length >= MAX_DOCS}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white
            placeholder:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || loading || docs.length >= MAX_DOCS}
          className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium
            hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors flex items-center gap-1.5 shrink-0"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
          Add
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 leading-snug">{error}</p>
      )}

      {/* Doc list */}
      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.url}
              className="flex items-start gap-2.5 bg-gray-50 border border-gray-100
                rounded-xl px-3.5 py-2.5"
            >
              {/* Doc icon */}
              <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{doc.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{doc.url}</p>
                <p className="text-[10px] text-green-600 mt-0.5">
                  ✓ {Math.round(doc.charCount / 5)} words loaded
                </p>
              </div>

              <button
                onClick={() => handleRemove(doc.url)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                aria-label="Remove document"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Supports Google Docs, lecture note pages, course websites. Max {MAX_DOCS} documents.
          Google Docs must be set to &quot;Anyone with the link can view.&quot;
        </p>
      )}
    </div>
  );
}

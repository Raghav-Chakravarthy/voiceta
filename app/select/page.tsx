"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PERSONAS, PersonaId } from "@/lib/personas";
import AgentCard from "@/components/AgentCard";
import DocumentInput, { DocEntry } from "@/components/DocumentInput";

export default function SelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PersonaId | null>(null);
  const [docs, setDocs] = useState<DocEntry[]>([]);

  const personas = Object.values(PERSONAS);

  function handleStart() {
    if (!selected) return;
    // Persist doc context in sessionStorage so the session page can read it
    if (docs.length > 0) {
      sessionStorage.setItem("arlo_doc_context", JSON.stringify(docs));
    } else {
      sessionStorage.removeItem("arlo_doc_context");
    }
    router.push(`/session?agent=${selected}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">Arlo</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-10">

          {/* ── Agent selection ── */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                Choose your agent
              </h2>
              <p className="text-gray-500 text-base">
                Select who you&apos;d like to talk to today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personas.map((persona) => (
                <AgentCard
                  key={persona.id}
                  persona={persona}
                  selected={selected === persona.id}
                  onSelect={() => setSelected(persona.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Document context (shown after selecting an agent) ── */}
          {selected && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm
              animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3 className="text-sm font-semibold text-gray-700">
                  Add study materials
                  <span className="ml-1.5 text-xs font-normal text-gray-400">optional</span>
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Paste links to lecture notes, course pages, or Google Docs.
                Arlo will use them as context during your session.
              </p>
              <DocumentInput docs={docs} onChange={setDocs} />
            </div>
          )}

          {/* ── Start button ── */}
          <div className="flex justify-center pb-4">
            <button
              onClick={handleStart}
              disabled={!selected}
              className={`px-10 py-4 rounded-2xl text-base font-medium transition-all duration-200
                shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-gray-900
                ${selected
                  ? "bg-gray-900 text-white hover:bg-gray-700 shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              {selected
                ? `Start session with ${PERSONAS[selected].shortName}`
                : "Select an agent to continue"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

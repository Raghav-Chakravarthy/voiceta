"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import Avatar, { AvatarState } from "@/components/Avatar";
import Transcript from "@/components/Transcript";
import Notepad from "@/components/Notepad";
import StatusPill from "@/components/StatusPill";
import { getPersona } from "@/lib/personas";
import { Message } from "@/lib/claude";
import { DocEntry } from "@/components/DocumentInput";

// Merge persona prompt + document context into the final system prompt
function buildSystemPrompt(basePrompt: string, docs: DocEntry[]): string {
  if (docs.length === 0) return basePrompt;

  const docSection = docs
    .map(
      (d, i) =>
        `[DOCUMENT ${i + 1}: ${d.title} — ${d.url}]\n${d.text}`
    )
    .join("\n\n---\n\n");

  return `${basePrompt}

--- REFERENCE MATERIALS ---
The student has shared the following documents as study context. When answering questions, draw on this material where relevant. If the student asks about something covered in these documents, refer to the specific content.

${docSection}
--- END REFERENCE MATERIALS ---`;
}

// Pull first sentence out of an agent response for auto-notes
function extractNote(text: string): string {
  const sentence = text.split(/(?<=[.?!])\s/)[0]?.trim() ?? text.trim();
  return sentence.length > 120 ? sentence.slice(0, 117) + "…" : sentence;
}

function SessionRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const agentId = params.get("agent") ?? "";
  const persona = getPersona(agentId);

  useEffect(() => {
    if (!persona) router.replace("/select");
  }, [persona, router]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Notes & panel tab
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"notes" | "transcript">("notes");

  // Document context loaded from sessionStorage (set on select page)
  const [docContext] = useState<DocEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem("arlo_doc_context");
      return raw ? (JSON.parse(raw) as DocEntry[]) : [];
    } catch {
      return [];
    }
  });

  // ── Refs ───────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  const agentSpeaking = useRef(false);
  const callActiveRef = useRef(false);
  const prevMsgCount = useRef(0);

  // Auto-append note when a new assistant message arrives
  useEffect(() => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length > prevMsgCount.current) {
      const latest = assistantMsgs[assistantMsgs.length - 1];
      const note = extractNote(latest.content);
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setNotes((prev) =>
        prev
          ? `${prev}\n• [${timestamp}] ${note}`
          : `• [${timestamp}] ${note}`
      );
      prevMsgCount.current = assistantMsgs.length;
    }
  }, [messages]);

  // ── Vapi setup ─────────────────────────────────────────────────────────────
  async function startCall() {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      setError("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set in .env.local.");
      return;
    }
    if (!persona) return;

    setConnecting(true);
    setError(null);

    try {
      const VapiSDK = (await import("@vapi-ai/web")).default;
      const vapi = new VapiSDK(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setCallActive(true);
        callActiveRef.current = true;
        setConnecting(false);
        setAvatarState("listening");
      });

      vapi.on("call-end", () => {
        setCallActive(false);
        callActiveRef.current = false;
        agentSpeaking.current = false;
        setAvatarState("idle");
        setVolumeLevel(0);
      });

      vapi.on("speech-start", () => {
        agentSpeaking.current = true;
        setAvatarState("speaking");
      });

      vapi.on("speech-end", () => {
        agentSpeaking.current = false;
        if (callActiveRef.current) setAvatarState("listening");
      });

      vapi.on("volume-level", (level: number) => {
        setVolumeLevel(level);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on("message", (msg: any) => {
        if (msg.type === "conversation-update" && Array.isArray(msg.conversation)) {
          const mapped: Message[] = msg.conversation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((m: any) => m.role === "user" || m.role === "assistant")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((m: any) => ({
              role: m.role as "user" | "assistant",
              content: typeof m.content === "string" ? m.content : m.message ?? "",
            }));
          setMessages(mapped);
        }

        if (
          msg.type === "transcript" &&
          msg.role === "user" &&
          msg.transcriptType === "final" &&
          !agentSpeaking.current
        ) {
          setAvatarState("thinking");
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on("error", (err: any) => {
        console.error("Vapi error:", err);
        setError(
          err?.message?.includes("mic") || err?.error?.includes("mic")
            ? "Microphone access denied. Please allow mic access in your browser and try again."
            : `Something went wrong: ${err?.message ?? "unknown error"}`
        );
        setConnecting(false);
        setCallActive(false);
        setAvatarState("idle");
      });

      await vapi.start({
        name: persona.name,
        firstMessage: persona.firstMessage,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          messages: [{
            role: "system",
            content: buildSystemPrompt(persona.systemPrompt, docContext),
          }],
        },
        voice: {
          provider: "11labs",
          voiceId: persona.voiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        },
      });
    } catch (err) {
      console.error("Failed to start Vapi:", err);
      setError("Failed to start the call. Check your Vapi key and try again.");
      setConnecting(false);
    }
  }

  function stopCall() {
    vapiRef.current?.stop();
    vapiRef.current = null;
    setCallActive(false);
    callActiveRef.current = false;
    setAvatarState("idle");
    setVolumeLevel(0);
  }

  function toggleMute() {
    if (!vapiRef.current) return;
    const next = !muted;
    setMuted(next);
    vapiRef.current.setMuted(next);
  }

  function handleEndSession() {
    stopCall();
    router.push("/select");
  }

  useEffect(() => () => stopCall(), []);

  if (!persona) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
        <Link
          href="/select"
          className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">{persona.name}</span>
          <StatusPill state={avatarState} />
          {docContext.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-600
              bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {docContext.length} doc{docContext.length > 1 ? "s" : ""} loaded
            </span>
          )}
        </div>

        {/* Tab toggle in header for mobile */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              activeTab === "notes" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              activeTab === "transcript" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
            }`}
          >
            Transcript
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* ── Avatar panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">

          <div className="flex flex-col items-center gap-5">
            <Avatar
              state={avatarState}
              style={persona.avatarStyle}
              size={220}
              volumeLevel={volumeLevel}
            />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">{persona.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{persona.shortName}</p>
            </div>
          </div>

          {error && (
            <div className="w-full max-w-sm bg-red-50 border border-red-200 text-red-700
              text-sm px-4 py-3 rounded-xl text-center leading-snug">
              {error}
            </div>
          )}

          {/* Controls */}
          {!callActive && !connecting ? (
            <button
              onClick={startCall}
              className="flex items-center gap-2.5 px-8 py-4 bg-gray-900 text-white
                rounded-2xl text-base font-medium shadow-md hover:bg-gray-700
                transition-all duration-200 focus:outline-none focus-visible:ring-2
                focus-visible:ring-offset-2 focus-visible:ring-gray-900"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.65 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Start Conversation
            </button>
          ) : connecting ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Connecting…
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Mute */}
              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className={`w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-200 shadow-sm focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400
                  ${muted ? "bg-gray-200 text-gray-500 hover:bg-gray-300" : "bg-gray-900 text-white hover:bg-gray-700"}`}
              >
                {muted ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>

              {/* End call */}
              <button
                onClick={handleEndSession}
                aria-label="End call"
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center
                  justify-center transition-all duration-200 hover:bg-red-600 shadow-sm
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A1 1 0 0 1 10 18"/>
                  <line x1="23" y1="1" x2="1" y2="23"/>
                </svg>
              </button>
            </div>
          )}

          {/* Mic level bar */}
          {callActive && !muted && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-75"
                  style={{
                    width: 3,
                    height: 4 + i * 2,
                    backgroundColor: volumeLevel * 8 > i ? "#22c55e" : "#d1d5db",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Notes + Transcript ── */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col"
          style={{ minHeight: "320px" }}>

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors
                ${activeTab === "notes"
                  ? "text-gray-800 border-b-2 border-gray-800 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors
                ${activeTab === "transcript"
                  ? "text-gray-800 border-b-2 border-gray-800 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Transcript
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "notes" ? (
              <Notepad
                notes={notes}
                onChange={setNotes}
                agentName={persona.shortName}
              />
            ) : (
              <div className="h-full overflow-hidden p-4">
                <Transcript
                  messages={messages}
                  agentName={persona.shortName}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    }>
      <SessionRoom />
    </Suspense>
  );
}

# Arlo

Talk naturally with specialized AI agents in a calm, minimal video-call style room.

## What it does

Arlo lets you have a real spoken conversation with an AI agent — no typing, no prompts. Pick an agent, click Start, and just talk. The agent listens, thinks, and responds in a natural human voice. It knows when you're done speaking and won't cut you off.

**Agents:**
- **CMSC420 TA** — Advanced Data Structures (trees, heaps, graphs, spatial indexing, complexity)
- **CMSC417 TA** — Computer Networks (TCP, DNS, routing, congestion control, protocols)
- **Telehealth Intake** — Calm, structured pre-visit intake assistant
- **Interview Coach** — Behavioral and technical interview practice

**Features:**
- Voice conversation with natural turn-taking — no button to press when done
- Human-sounding ElevenLabs voices via Vapi
- Visual avatar that animates while listening, thinking, and speaking
- Auto-captured session notes + full transcript
- Paste document URLs (Google Docs, lecture notes, course pages) as context so the agent knows your specific course material

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your API keys

**Vapi** (handles voice pipeline — STT, LLM, TTS, turn-taking)
1. Sign up at [vapi.ai](https://vapi.ai) — free $10 credit on signup
2. Go to Account → copy your **Public Key**

**Anthropic** (Claude powers the AI responses)
1. Get a key at [console.anthropic.com](https://console.anthropic.com)

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=pk_...
```

### 4. Run locally

```bash
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:3000`).

> **Note:** Use Chrome or Edge — they have the best Web Speech API support.

---

## How it works

### Voice pipeline
Vapi chains together three services into a seamless real-time call:
1. **Deepgram Nova-2** — streaming speech-to-text with smart VAD (knows when you're done)
2. **Claude Haiku** — fast, concise AI responses tuned for spoken conversation
3. **ElevenLabs** — natural-sounding TTS voices, one per agent

### Avatar states
Each agent has a distinct human face avatar that reacts in real time:
- **Idle** — gentle breathing animation
- **Listening** — ripple rings expand outward
- **Thinking** — face dims, dots bounce below
- **Speaking** — mouth opens and closes, waveform pulses

### Document context
On the agent selection page, paste up to 3 URLs before starting a session. Arlo fetches the text and injects it into the agent's context — so it can answer questions about your specific lecture notes or class materials.

Supported sources:
- Google Docs (set to "Anyone with link can view")
- Google Slides
- Any public HTML page (course websites, lecture notes, wikis)

### Notes & transcript
The session room has a right panel with two tabs:
- **Notes** — auto-captures a key point from each agent response, plus free-form typing area
- **Transcript** — full back-and-forth conversation log

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS |
| Voice pipeline | Vapi (`@vapi-ai/web`) |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| TTS | ElevenLabs (via Vapi) |
| STT | Deepgram Nova-2 (via Vapi) |
| Document parsing | Cheerio (server-side HTML extraction) |

---

## File structure

```
app/
  page.tsx                 # Landing page
  select/page.tsx          # Agent + document selection
  session/page.tsx         # Live call room
  api/chat/route.ts        # Claude API endpoint (fallback)
  api/fetch-doc/route.ts   # Document URL fetcher

components/
  Avatar.tsx               # Animated human face avatar (4 styles, 4 states)
  AgentCard.tsx            # Selectable agent card
  DocumentInput.tsx        # URL input for study materials
  Notepad.tsx              # Auto-capture + freeform notes panel
  Transcript.tsx           # Conversation log
  StatusPill.tsx           # Idle / Listening / Thinking / Speaking indicator
  ControlBar.tsx           # Mic / End call controls

lib/
  personas.ts              # Agent definitions, system prompts, voice IDs
  claude.ts                # /api/chat client helper
  speech.ts                # Browser Web Speech API utilities
  turnTaking.ts            # Pause detection logic (fallback)

types/
  speech.d.ts              # Web Speech API type declarations
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Yes | Vapi public key — enables voice calls |
| `ANTHROPIC_API_KEY` | Optional | Anthropic key for the `/api/chat` fallback route |

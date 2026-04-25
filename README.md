# VoiceTA

A voice-first AI agent application. Talk naturally to visual AI avatars in a minimal, Google Meet–style call room.

## Use Cases
- CMSC420 TA — Advanced Data Structures tutoring
- CMSC417 TA — Computer Networks tutoring  
- Telehealth Intake Assistant — structured pre-visit intake
- Interview Coach — behavioral and technical interview practice

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_key_here
```

Get a key at: https://console.anthropic.com/

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Landing page** — `/` — value prop + start button
2. **Agent selection** — `/select` — pick an AI persona
3. **Session room** — `/session?agent=<id>` — voice conversation with visual avatar

### Voice turn-taking

- Listens continuously while mic is enabled
- Waits ~2s after speech pauses before sending
- Waits longer (~3.5s) if the sentence sounds incomplete (ends with "and", "so", "because", etc.)
- Responds faster (~0.8s) for direct questions
- "Done Speaking" button for manual trigger
- Text input fallback if browser doesn't support SpeechRecognition

### Avatar states
- **Idle** — subtle breathing animation
- **Listening** — animated glow ring
- **Thinking** — pulsing dots
- **Speaking** — waveform bars

## Tech stack
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Claude API (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk`
- Web Speech API (SpeechRecognition + speechSynthesis) — no external voice services

## Demo script

**CMSC420 TA**
> "I'm trying to optimize nearest neighbor search in 2D space. Should I use a hash map?"

Expected: The TA will probe your reasoning and guide you toward KD-trees or spatial indexing rather than just answering.

---

**Telehealth Intake**
> "I've had a headache since yesterday and I'm not sure what's causing it."

Expected: The assistant will calmly acknowledge and ask one structured follow-up question (onset, severity, location, etc.) without diagnosing.

## File structure

```
app/
  page.tsx              # Landing page
  select/page.tsx       # Agent selection
  session/page.tsx      # Call room
  api/chat/route.ts     # Claude API endpoint

components/
  Avatar.tsx            # Visual avatar with states
  AgentCard.tsx         # Selectable agent card
  Transcript.tsx        # Conversation transcript
  ControlBar.tsx        # Mic / Done / End controls
  StatusPill.tsx        # Status indicator

lib/
  personas.ts           # Agent definitions + system prompts
  turnTaking.ts         # Pause detection logic
  speech.ts             # Browser speech utilities
  claude.ts             # API client helper

types/
  speech.d.ts           # Web Speech API type declarations
```

// Turn-taking logic: decides when to send the user's speech to the AI.
// Balances not interrupting mid-thought with not waiting forever.

const UNFINISHED_ENDINGS = [
  " and",
  " so",
  " because",
  " like",
  " um",
  " uh",
  " i think",
  " for example",
  " basically",
  " what i mean is",
  " but",
  " or",
  " when",
  " if",
];

const DIRECT_QUESTION_PATTERNS = [
  "?",
  "can you explain",
  "what do you think",
  "how would",
  "why does",
  "what is",
  "could you",
  "what are",
  "how does",
  "tell me",
];

const BASE_PAUSE_MS = 2000;       // default pause before sending
const UNFINISHED_PAUSE_MS = 3500; // longer wait if thought seems incomplete
const QUESTION_PAUSE_MS = 800;    // faster response for direct questions
const MIN_TRANSCRIPT_LENGTH = 3;  // ignore accidental one-word blips

export function shouldWaitLonger(transcript: string): boolean {
  const lower = transcript.toLowerCase().trimEnd();
  return UNFINISHED_ENDINGS.some((ending) => lower.endsWith(ending));
}

export function isDirectQuestion(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return DIRECT_QUESTION_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isTooShort(transcript: string): boolean {
  return transcript.trim().split(/\s+/).length < MIN_TRANSCRIPT_LENGTH;
}

export function getPauseDelay(transcript: string): number {
  if (isDirectQuestion(transcript)) return QUESTION_PAUSE_MS;
  if (shouldWaitLonger(transcript)) return UNFINISHED_PAUSE_MS;
  return BASE_PAUSE_MS;
}

// Creates a debounced turn-taking timer.
// Returns a function that schedules the callback after the appropriate delay,
// cancelling any previously scheduled call.
export function createTurnTimer(onReady: (transcript: string) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function schedule(transcript: string) {
    if (timer) clearTimeout(timer);
    if (isTooShort(transcript)) return;

    const delay = getPauseDelay(transcript);
    timer = setTimeout(() => {
      timer = null;
      onReady(transcript);
    }, delay);
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function flush(transcript: string) {
    cancel();
    if (!isTooShort(transcript)) {
      onReady(transcript);
    }
  }

  return { schedule, cancel, flush };
}

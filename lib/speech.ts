// Browser speech utilities — wraps Web Speech API for STT and TTS.
// All functions are safe to import in Next.js (they check for window).

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

// Returns the SpeechRecognition constructor, normalized across browsers.
export function getSpeechRecognitionClass():
  | typeof SpeechRecognition
  | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface SpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

// Speaks text aloud and returns a promise that resolves when done.
export function speak(
  text: string,
  options: SpeechSynthesisOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel(); // stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    if (options.voice) utterance.voice = options.voice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      // "interrupted" errors are expected when cancelled; don't treat as failure
      if (e.error === "interrupted") resolve();
      else reject(e);
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Returns a pleasant-sounding English voice if available, else null (uses default).
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer natural-sounding en-US voices
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Alex") ||
        v.name.includes("Natural") ||
        v.name.includes("Premium"))
  );
  return preferred ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
}

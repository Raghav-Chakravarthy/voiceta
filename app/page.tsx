import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-white to-white pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        {/* Logo / wordmark */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-gray-900">Arlo</span>
        </div>

        {/* Hero headline */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
          Talk to an AI,{" "}
          <br />
          <span className="text-gray-400">naturally.</span>
        </h1>

        <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-md">
          Talk naturally with specialized AI agents in a simple video-call style room.
        </p>

        <Link
          href="/select"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 text-white
            rounded-2xl text-base font-medium shadow-lg hover:bg-gray-700
            transition-all duration-200 focus:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-gray-900 mb-8"
        >
          Start a session
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <p className="text-sm text-gray-400">
          Built for tutoring · interviews · telehealth intake · coaching · support
        </p>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-300 tracking-wide">
        Powered by Claude
      </div>
    </main>
  );
}

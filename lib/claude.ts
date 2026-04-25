// Client-side helper for calling our own /api/chat endpoint.

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  personaId: string;
  message: string;
  history: Message[];
}

export interface ChatResponse {
  response: string;
}

export async function sendMessage(req: ChatRequest): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data: ChatResponse = await res.json();
  return data.response;
}

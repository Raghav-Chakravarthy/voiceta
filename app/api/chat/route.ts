import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPersona } from "@/lib/personas";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { personaId, message, history } = await req.json();

    if (!personaId || !message) {
      return NextResponse.json(
        { error: "personaId and message are required" },
        { status: 400 }
      );
    }

    const persona = getPersona(personaId);
    if (!persona) {
      return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
    }

    // Keep last 10 turns (20 messages) for context without blowing up token count
    const recentHistory = Array.isArray(history) ? history.slice(-20) : [];

    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001", // Fast model — ideal for real-time spoken interaction
      max_tokens: 300, // Keep responses concise for speech
      system: persona.systemPrompt,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/claude";

interface TranscriptProps {
  messages: Message[];
  agentName: string;
}

export default function Transcript({ messages, agentName }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-4">
        Start talking — the transcript will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
        >
          <span className="text-xs text-gray-400 px-1">
            {msg.role === "user" ? "You" : agentName}
          </span>
          <div
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-gray-900 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

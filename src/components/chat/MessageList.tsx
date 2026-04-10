"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/types";

interface Props {
  messages: Message[];
  streaming: boolean;
}

export function MessageList({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
        <p className="text-4xl">💬</p>
        <p className="text-sm">
          Ask anything about the startups in the knowledge base
        </p>
        <p className="text-xs text-gray-300">
          e.g. &ldquo;Which startups are working on carbon capture?&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const isAssistant = msg.role === "assistant";
        return (
          <MessageBubble
            key={i}
            message={msg}
            isStreaming={isLast && isAssistant && streaming}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

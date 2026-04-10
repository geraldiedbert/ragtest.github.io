"use client";

import type { Message } from "@/lib/types";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-white border border-gray-200 text-gray-800 shadow-sm"
        }`}
      >
        {message.content}
        {isStreaming && (
          <span className="ml-1 inline-block h-3.5 w-0.5 animate-pulse bg-current opacity-70" />
        )}
      </div>
    </div>
  );
}

"use client";

import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { FilterState } from "@/lib/types";

interface Props {
  filters?: FilterState;
}

export function ChatView({ filters }: Props) {
  const { messages, sendMessage, streaming, error, clearChat } =
    useChat(filters);

  return (
    <div className="flex h-[70vh] flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Answers are grounded in the startup knowledge base
        </p>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear chat
          </button>
        )}
      </div>

      <MessageList messages={messages} streaming={streaming} />

      {error && (
        <p className="rounded bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  );
}

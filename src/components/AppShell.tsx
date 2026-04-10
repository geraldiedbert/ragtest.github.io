"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { SearchView } from "./search/SearchView";
import { ChatView } from "./chat/ChatView";

type Mode = "search" | "chat";

export function AppShell() {
  const [mode, setMode] = useState<Mode>("search");

  // Sync mode from URL hash on load
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Mode;
    if (hash === "chat" || hash === "search") setMode(hash);
  }, []);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    window.history.replaceState(null, "", `#${newMode}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Startup Knowledge Base
            </h1>
            <p className="text-xs text-gray-500">
              Explore {" "}
              <span className="font-medium text-indigo-600">6,000+</span>{" "}
              startup pitch decks
            </p>
          </div>
          <ModeToggle mode={mode} onSwitch={switchMode} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {mode === "search" ? <SearchView /> : <ChatView />}
      </main>
    </div>
  );
}

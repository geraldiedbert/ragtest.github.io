"use client";

type Mode = "search" | "chat";

interface Props {
  mode: Mode;
  onSwitch: (m: Mode) => void;
}

export function ModeToggle({ mode, onSwitch }: Props) {
  return (
    <div
      role="tablist"
      className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm"
    >
      <button
        role="tab"
        aria-selected={mode === "search"}
        onClick={() => onSwitch("search")}
        className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
          mode === "search"
            ? "bg-indigo-600 text-white"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Search
      </button>
      <button
        role="tab"
        aria-selected={mode === "chat"}
        onClick={() => onSwitch("chat")}
        className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
          mode === "chat"
            ? "bg-indigo-600 text-white"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Chat
      </button>
    </div>
  );
}

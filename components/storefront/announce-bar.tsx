"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnnounceMessage } from "@/lib/types";

export function AnnounceBar({ messages }: { messages: AnnounceMessage[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 6000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;
  const m = messages[i];

  return (
    <div className="bg-foreground text-background text-xs">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3">
        {messages.length > 1 && (
          <button
            onClick={() => setI((n) => (n - 1 + messages.length) % messages.length)}
            aria-label="Anterior"
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
        <span className="uppercase tracking-[0.14em] text-center">{m.text}</span>
        {messages.length > 1 && (
          <button
            onClick={() => setI((n) => (n + 1) % messages.length)}
            aria-label="Siguiente"
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnnounceMessage } from "@/lib/types";
import { Tooltip } from "@/components/ui/tooltip";

export function AnnounceBar({ messages }: { messages: AnnounceMessage[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 6000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (!messages || messages.length === 0) return null;
  const m = messages[i % messages.length] ?? messages[0];
  if (!m?.text) return null;

  return (
    <div className="bg-foreground text-background text-xs">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3">
        {messages.length > 1 && (
          <Tooltip content="Anterior">
            <button
              onClick={() => setI((n) => (n - 1 + messages.length) % messages.length)}
              aria-label="Anterior"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          </Tooltip>
        )}
        <span className="uppercase tracking-[0.14em] text-center">{m.text}</span>
        {messages.length > 1 && (
          <Tooltip content="Siguiente">
            <button
              onClick={() => setI((n) => (n + 1) % messages.length)}
              aria-label="Siguiente"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

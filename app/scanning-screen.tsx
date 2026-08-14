"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./motion";

// Prompts genéricos de compra (representativos, multinicho) para el "show" de
// anticipación mientras corre el scan real. No son los prompts reales (se generan
// en el server); es teatro de espera con sentido.
const DEMO_PROMPTS = [
  "best gentle cleanser for sensitive skin",
  "most reliable espresso machine under $500",
  "top project management tool for small teams",
  "best running shoes for flat feet",
  "which brands make the best vitamin C serum",
  "best noise-cancelling headphones for travel",
  "affordable standing desk that actually lasts",
  "best natural sunscreen with no white cast",
];

const ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Claude"];

export function ScanningScreen({ domain }: { domain: string }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => n + 1), 1400);
    return () => clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <div className="animate-fade-in w-full max-w-md text-center">
        <p className="text-lg text-zinc-300">Scanning {domain}…</p>
        <p className="mt-2 text-sm text-zinc-500">
          Asking the AI engines the buying questions your customers ask.
        </p>
      </div>
    );
  }

  const current = DEMO_PROMPTS[i % DEMO_PROMPTS.length];
  // Las "ya respondidas": hasta 3 que realmente aparecieron antes (ninguna en i=0).
  const done = Array.from({ length: Math.min(i, 3) }, (_, k) => DEMO_PROMPTS[(i - 1 - k) % DEMO_PROMPTS.length]);

  return (
    <div className="animate-fade-in w-full max-w-lg text-center">
      <p className="text-sm text-zinc-500">Scanning</p>
      <p className="text-xl font-medium text-zinc-100">{domain}</p>

      {/* Engines "pingeando" en secuencia */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {ENGINES.map((e, k) => {
          const active = k === i % ENGINES.length;
          return (
            <span
              key={e}
              className={`rounded-full border px-3 py-1 text-xs transition-all duration-500 ${
                active
                  ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.02] text-zinc-600"
              }`}
            >
              {e}
            </span>
          );
        })}
      </div>

      {/* Prompt "en curso" + las respondidas acumulándose */}
      <div className="mt-8 flex min-h-[7rem] flex-col items-center gap-2">
        <div key={current} className="animate-fade-up flex items-center gap-3 text-zinc-200">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
          <span className="text-sm">Asking: “{current}”</span>
        </div>
        {done.map((p, k) => (
          <div
            key={`${p}-${k}`}
            className="flex items-center gap-2 text-sm text-zinc-500"
            style={{ opacity: 1 - k * 0.28 }}
          >
            <span className="text-emerald-400">✓</span>
            <span className="truncate">{p}</span>
          </div>
        ))}
      </div>

      {/* Barra de progreso con shimmer */}
      <div className="mx-auto mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/5">
        <div className="scan-shimmer h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
      </div>
    </div>
  );
}

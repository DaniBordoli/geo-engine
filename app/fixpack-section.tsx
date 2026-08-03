"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFixPackState,
  trackCheckoutClick,
  regenerateFixPack,
  type FixPackState,
} from "./fixpack-actions";
import type { ScanReport } from "@/lib/scan";
import type { FixItem, FixPack } from "@/lib/fixpack/types";
import { fixPackToMarkdown } from "@/lib/fixpack/markdown";
import { analytics } from "@/lib/analytics/client";

const LABEL: Record<FixItem["category"], string> = {
  "citable-content": "Citable content",
  "schema-markup": "Schema markup",
  "off-site-action": "Off-site actions",
};

function Item({ item, i }: { item: FixItem; i: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">{i + 1}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
          {LABEL[item.category]}
        </span>
        <span className="ml-auto text-xs text-zinc-600">priority {item.priority}</span>
      </div>
      <h4 className="mt-2 font-medium text-zinc-100">{item.title}</h4>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="text-zinc-400">Gap:</span> {item.gap}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="text-zinc-400">Cause:</span> {item.cause}
      </p>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
        {item.body}
      </pre>
    </div>
  );
}

export function PaidView({
  pack,
  domain,
  brand,
}: {
  pack: FixPack;
  domain: string;
  brand: string;
}) {
  return (
    <div className="animate-fade-in mt-12 w-full max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-lg font-medium text-emerald-400">
          Fix pack unlocked · {pack.items.length} actions
        </h3>
        <button
          onClick={() => {
            const blob = new Blob([fixPackToMarkdown(pack, domain)], {
              type: "text/markdown",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `fixpack-${brand}.md`;
            a.click();
          }}
          className="ml-auto rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:border-white/30"
        >
          Download .md
        </button>
      </div>
      <div className="space-y-4">
        {pack.items.map((item, i) => (
          <Item key={i} item={item} i={i} />
        ))}
      </div>
    </div>
  );
}

// ~3 min de "generating" (45 × 4s) antes de cortar el polling y mostrar fallback.
const MAX_POLLS = 45;
const POLL_MS = 4000;

export function FixPackSection({ report, email }: { report: ScanReport; email: string }) {
  const scanId = report.scanId;
  const [state, setState] = useState<FixPackState | null>(null);
  const [tookTooLong, setTookTooLong] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef(0);

  const refresh = useCallback(async () => {
    if (!scanId) return;
    setState(await getFixPackState(scanId, email));
  }, [scanId, email]);

  // Chequeo inicial.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll mientras se genera (post-pago); no pollea en locked. Tope duro para no
  // girar infinito si la generación se cortó (F1.b): a los N intentos → fallback.
  useEffect(() => {
    if (state?.status !== "generating" || tookTooLong) return;
    if (pollCount.current >= MAX_POLLS) {
      setTookTooLong(true);
      return;
    }
    pollRef.current = setTimeout(() => {
      pollCount.current += 1;
      refresh();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [state, refresh, tookTooLong]);

  if (!scanId) return null;

  // Retry (F1.c): resetea el contador y re-dispara la generación (idempotente).
  const retryGeneration = () => {
    pollCount.current = 0;
    setTookTooLong(false);
    void regenerateFixPack(scanId).then(refresh);
  };

  if (state?.status === "ready") {
    return <PaidView pack={state.pack} domain={report.domain} brand={report.brand} />;
  }

  // Teaser dinámico: usa un prompt perdido real si lo hay (P2.3).
  const teaserGap = report.lostPrompts[0]?.prompt;

  return (
    <div className="mt-12 w-full max-w-3xl">
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
        <h3 className="text-xl font-semibold text-zinc-100">
          The fix pack: how to win these citations back
        </h3>
        <p className="mt-2 max-w-xl text-zinc-400">
          For every question where you&apos;re invisible: ready-to-publish citable
          content, schema markup, and off-site actions — prioritized by impact. Semrush
          tells you you&apos;re losing; this fixes it.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
            {LABEL["citable-content"]} · example
          </span>
          <h4 className="mt-2 font-medium text-zinc-100">
            {teaserGap
              ? `Citable content for: “${teaserGap}”`
              : "Citable comparison guide for your lost question"}
          </h4>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="text-zinc-400">Cause:</span> absent from the sources the
            LLM reads for this query.
          </p>
        </div>
        <div className="mt-2 space-y-2">
          {["Schema markup (JSON-LD)", "Prioritized off-site actions"].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500 blur-[1.5px]"
            >
              🔒 {t}
            </div>
          ))}
        </div>

        {state?.status === "generating" ? (
          tookTooLong ? (
            <div className="mt-6">
              <p className="text-zinc-300">
                This is taking longer than expected — we&apos;ll email you the fix pack
                when it&apos;s ready.
              </p>
              <button
                onClick={retryGeneration}
                className="mt-3 rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 active:scale-[0.97]"
              >
                Retry now
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 text-zinc-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              Your payment is confirmed. We&apos;re generating your fix pack…
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                // Síncrono dentro del gesto (P1.1): no lo bloquea el popup blocker.
                if (state?.status === "locked") {
                  analytics("CheckoutClick");
                  void trackCheckoutClick(scanId);
                  window.open(state.checkoutUrl, "_blank");
                }
              }}
              disabled={state?.status !== "locked"}
              className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
            >
              Unlock fix pack — US$49
            </button>
            <button
              onClick={refresh}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Already paid → refresh
            </button>
          </div>
        )}

        {state?.status === "error" && (
          <p className="mt-3 text-sm text-red-400">{state.error}</p>
        )}
      </div>
    </div>
  );
}

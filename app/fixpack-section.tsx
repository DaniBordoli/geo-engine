"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFixPackState, type FixPackState } from "./fixpack-actions";
import type { ScanReport } from "@/lib/scan";
import type { FixItem, FixPack } from "@/lib/fixpack/types";
import { fixPackToMarkdown } from "@/lib/fixpack/markdown";

const LABEL: Record<FixItem["category"], string> = {
  "citable-content": "Contenido citable",
  "schema-markup": "Schema markup",
  "off-site-action": "Acciones off-site",
};

function Item({ item, i }: { item: FixItem; i: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">{i + 1}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
          {LABEL[item.category]}
        </span>
        <span className="ml-auto text-xs text-zinc-600">prioridad {item.priority}</span>
      </div>
      <h4 className="mt-2 font-medium text-zinc-100">{item.title}</h4>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="text-zinc-400">Gap:</span> {item.gap}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="text-zinc-400">Causa:</span> {item.cause}
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
          Fix pack desbloqueado · {pack.items.length} acciones
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
          Descargar .md
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

export function FixPackSection({ report, email }: { report: ScanReport; email: string }) {
  const scanId = report.scanId;
  const [state, setState] = useState<FixPackState | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!scanId) return;
    setState(await getFixPackState(scanId, email));
  }, [scanId, email]);

  // Chequeo inicial.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll mientras se genera (post-pago); no pollea en locked.
  useEffect(() => {
    if (state?.status !== "generating") return;
    pollRef.current = setTimeout(refresh, 4000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [state, refresh]);

  if (!scanId) return null;

  if (state?.status === "ready") {
    return <PaidView pack={state.pack} domain={report.domain} brand={report.brand} />;
  }

  // Teaser dinámico: usa un prompt perdido real si lo hay (P2.3).
  const teaserGap = report.lostPrompts[0]?.prompt;

  return (
    <div className="mt-12 w-full max-w-3xl">
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
        <h3 className="text-xl font-semibold text-zinc-100">
          El fix pack: cómo recuperar estas citaciones
        </h3>
        <p className="mt-2 max-w-xl text-zinc-400">
          Por cada prompt donde sos invisible: contenido citable listo para publicar,
          schema markup y acciones off-site, priorizados por impacto. Semrush te dice
          que perdés; esto lo arregla.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
            {LABEL["citable-content"]} · ejemplo
          </span>
          <h4 className="mt-2 font-medium text-zinc-100">
            {teaserGap
              ? `Contenido citable para: “${teaserGap}”`
              : "Guía comparativa citable para tu prompt perdido"}
          </h4>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="text-zinc-400">Causa:</span> ausente en las fuentes que el
            LLM lee para esta consulta.
          </p>
        </div>
        <div className="mt-2 space-y-2">
          {["Schema markup (JSON-LD)", "Acciones off-site priorizadas"].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500 blur-[1.5px]"
            >
              🔒 {t}
            </div>
          ))}
        </div>

        {state?.status === "generating" ? (
          <div className="mt-6 flex items-center gap-3 text-zinc-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Tu pago se confirmó. Estamos generando tu fix pack…
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                // Síncrono dentro del gesto (P1.1): no lo bloquea el popup blocker.
                if (state?.status === "locked") window.open(state.checkoutUrl, "_blank");
              }}
              disabled={state?.status !== "locked"}
              className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
            >
              Desbloquear fix pack — US$49
            </button>
            <button
              onClick={refresh}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Ya pagué → actualizar
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

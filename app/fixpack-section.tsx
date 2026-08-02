"use client";

import { useState } from "react";
import { getFixPackAction } from "./fixpack-actions";
import type { ScanReport } from "@/lib/scan";
import type { FixItem, FixPack } from "@/lib/fixpack/types";
import { fixPackToMarkdown } from "@/lib/fixpack/markdown";

const LABEL: Record<FixItem["category"], string> = {
  "citable-content": "Contenido citable",
  "schema-markup": "Schema markup",
  "off-site-action": "Acciones off-site",
};

// Un item de muestra (estático, sin costo) para el teaser del estado bloqueado.
const TEASER: Pick<FixItem, "category" | "title" | "cause"> = {
  category: "citable-content",
  title: "Guía comparativa citable para tu prompt perdido",
  cause: "Ausente en las fuentes que el LLM lee para esta consulta.",
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

export function FixPackSection({ report, email }: { report: ScanReport; email: string }) {
  const [pack, setPack] = useState<FixPack | null>(null);
  const [status, setStatus] = useState<"locked" | "loading" | "error">("locked");
  const [hint, setHint] = useState<string | null>(null);

  if (!report.scanId) return null;

  async function check(afterPayment: boolean) {
    setStatus("loading");
    setHint(afterPayment ? "Confirmando el pago y generando tu fix pack…" : null);
    const res = await getFixPackAction(report.scanId!, email);
    if (res.ok) {
      setPack(res.pack);
      return;
    }
    if (res.locked) {
      setStatus("locked");
      if (afterPayment) {
        setHint("Todavía no confirmamos el pago. Esperá unos segundos y reintentá.");
      } else {
        window.open(res.checkoutUrl, "_blank");
        setHint("Abrimos el checkout en otra pestaña. Cuando pagues, volvé y tocá “Ya pagué”.");
      }
    } else {
      setStatus("error");
      setHint(res.error);
    }
  }

  if (pack) {
    const md = fixPackToMarkdown(pack, report.domain);
    return (
      <div className="mt-12 w-full max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-lg font-medium text-emerald-400">
            Fix pack desbloqueado · {pack.items.length} acciones
          </h3>
          <button
            onClick={() => {
              const blob = new Blob([md], { type: "text/markdown" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `fixpack-${report.brand}.md`;
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

  return (
    <div className="mt-12 w-full max-w-3xl">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
        <h3 className="text-xl font-semibold text-zinc-100">
          El fix pack: cómo recuperar estas citaciones
        </h3>
        <p className="mt-2 max-w-xl text-zinc-400">
          Por cada prompt donde sos invisible: contenido citable listo para publicar,
          schema markup y acciones off-site, priorizados por impacto. Semrush te dice
          que perdés; esto lo arregla.
        </p>

        {/* Teaser: un item de muestra + filas bloqueadas */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
            {LABEL[TEASER.category]} · ejemplo
          </span>
          <h4 className="mt-2 font-medium text-zinc-100">{TEASER.title}</h4>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="text-zinc-400">Causa:</span> {TEASER.cause}
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => check(false)}
            disabled={status === "loading"}
            className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
          >
            {status === "loading" ? "Procesando…" : "Desbloquear fix pack — US$49"}
          </button>
          <button
            onClick={() => check(true)}
            disabled={status === "loading"}
            className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-60"
          >
            Ya pagué → ver fix pack
          </button>
        </div>
        {hint && <p className="mt-3 text-sm text-zinc-400">{hint}</p>}
      </div>
    </div>
  );
}

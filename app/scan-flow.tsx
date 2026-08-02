"use client";

import { useState, useTransition } from "react";
import { runScanAction } from "./actions";
import type { ScanReport } from "@/lib/scan";
import { ReportView } from "./report-view";
import { FixPackSection } from "./fixpack-section";

type Step = "domain" | "email" | "report";

export function ScanFlow() {
  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [pending, startTransition] = useTransition();

  function submitDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setStep("email");
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await runScanAction({ domain, email });
      if (res.ok) {
        setReport(res.report);
        setStep("report");
      } else {
        setError(res.error);
      }
    });
  }

  if (step === "report" && report) {
    return (
      <div className="flex w-full flex-col items-center">
        <ReportView report={report} />
        <FixPackSection report={report} email={email} />
        <button
          onClick={() => {
            setReport(null);
            setDomain("");
            setEmail("");
            setStep("domain");
          }}
          className="mt-10 text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← escanear otro dominio
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
        ¿Te ve la IA?
      </h1>
      <p className="mx-auto mt-4 max-w-md text-zinc-400">
        Escaneá tu visibilidad en respuestas de ChatGPT y Perplexity, y descubrí
        quién te está ganando las citaciones.
      </p>

      {step === "domain" && (
        <form onSubmit={submitDomain} className="mx-auto mt-8 flex max-w-md gap-2">
          <input
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="tumarca.com"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white"
          >
            Escanear
          </button>
        </form>
      )}

      {step === "email" && (
        <form onSubmit={submitEmail} className="mx-auto mt-8 max-w-md">
          <p className="mb-3 text-sm text-zinc-400">
            Dejá tu email para ver el reporte de{" "}
            <span className="text-zinc-200">{domain}</span>.
          </p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@empresa.com"
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
            >
              {pending ? "Escaneando…" : "Ver reporte"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

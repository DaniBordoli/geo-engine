"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { runScanAction, trackShareAction } from "./actions";
import { analytics } from "@/lib/analytics/client";
import type { Attribution, ScanReport } from "@/lib/scan";
import { ReportView } from "./report-view";
import { FixPackSection } from "./fixpack-section";

type Step = "domain" | "email" | "report";

// Copia el link del reporte público (/r/[token]) — el mecanismo viral.
function ShareReportButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = `${window.location.origin}/r/${token}`;
        analytics("Share");
        void trackShareAction(token);
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copiá tu link:", url);
        }
      }}
      className="mt-10 rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-white/30"
    >
      {copied ? "¡Link copiado!" : "🔗 Compartí tu resultado"}
    </button>
  );
}

export function ScanFlow() {
  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [pending, startTransition] = useTransition();
  const attribution = useRef<Attribution>({});

  // Capturá origen (UTM + referrer) al entrar, para atribuir conversión→fuente.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    attribution.current = {
      source: q.get("utm_source"),
      medium: q.get("utm_medium"),
      campaign: q.get("utm_campaign"),
      referrer: document.referrer || null,
    };
  }, []);

  function submitDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setStep("email");
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await runScanAction({ domain, email, attribution: attribution.current });
      if (res.ok) {
        analytics("Scan");
        setReport(res.report);
        setStep("report");
      } else {
        setError(res.error);
      }
    });
  }

  if (step === "report" && report) {
    return (
      <div className="animate-fade-in flex w-full flex-col items-center">
        <ReportView report={report} />
        {report.reportToken && <ShareReportButton token={report.reportToken} />}
        <FixPackSection report={report} email={email} />
        {report.dashboardToken && (
          <a
            href={`/dashboard/${report.dashboardToken}`}
            className="mt-6 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Ver tu dashboard (historial + tendencia) →
          </a>
        )}
        <button
          onClick={() => {
            setReport(null);
            setDomain("");
            setEmail("");
            setStep("domain");
          }}
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← escanear otro dominio
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl text-center">
      <div
        className="animate-fade-up mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400"
        style={{ animationDelay: "0ms" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Diagnóstico gratis · ~60 segundos
      </div>

      <h1
        className="animate-fade-up mt-6 text-5xl font-bold tracking-tight sm:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        <span className="bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-transparent">
          ¿Te ve la IA?
        </span>
      </h1>
      <p
        className="animate-fade-up mx-auto mt-4 max-w-md text-lg text-zinc-400"
        style={{ animationDelay: "150ms" }}
      >
        Escaneá tu visibilidad en respuestas de IA y descubrí quién te está
        ganando las citaciones.
      </p>

      <div
        className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-2"
        style={{ animationDelay: "220ms" }}
      >
        {["ChatGPT", "Perplexity", "Gemini", "Claude"].map((e) => (
          <span
            key={e}
            className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-500"
          >
            {e}
          </span>
        ))}
      </div>

      {step === "domain" && (
        <form
          onSubmit={submitDomain}
          className="animate-fade-up mx-auto mt-8 flex max-w-md gap-2"
          style={{ animationDelay: "300ms" }}
        >
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
        <form onSubmit={submitEmail} className="animate-fade-in mx-auto mt-8 max-w-md">
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

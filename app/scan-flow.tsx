"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { runScanAction, trackShareAction } from "./actions";
import { analytics } from "@/lib/analytics/client";
import type { Attribution, ScanReport } from "@/lib/scan";
import { ReportView } from "./report-view";
import { FixPackSection } from "./fixpack-section";
import { ScanningScreen } from "./scanning-screen";

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
          window.prompt("Copy your link:", url);
        }
      }}
      className="mt-10 rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-white/30"
    >
      {copied ? "Link copied!" : "🔗 Share your result"}
    </button>
  );
}

export function ScanFlow() {
  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  // Overrides opcionales de la detección de vertical (Auto por default).
  const [market, setMarket] = useState<"auto" | "en" | "es">("auto");
  const [category, setCategory] = useState("");
  const [showOpts, setShowOpts] = useState(false);
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
      const res = await runScanAction({
        domain,
        email,
        lang: market === "auto" ? undefined : market,
        category: category.trim() || undefined,
        attribution: attribution.current,
      });
      if (res.ok) {
        analytics("Scan");
        setReport(res.report);
        setStep("report");
      } else {
        setError(res.error);
      }
    });
  }

  // Mientras corre el scan real (~30-40s): pantalla de anticipación (D1).
  if (pending) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-8">
        <ScanningScreen domain={domain} />
      </div>
    );
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
            See your dashboard (history + trend) →
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
          ← scan another store
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
        Free scan · ~60 seconds
      </div>

      <h1
        className="animate-fade-up mt-6 text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        Is your store{" "}
        <span className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
          invisible
        </span>{" "}
        to ChatGPT shoppers?
      </h1>
      <p
        className="animate-fade-up mx-auto mt-5 max-w-lg text-lg leading-relaxed text-zinc-400"
        style={{ animationDelay: "150ms" }}
      >
        Shoppers don&apos;t Google anymore — they ask ChatGPT and Perplexity what to
        buy. We show you exactly which questions you&apos;re invisible for, who&apos;s
        winning instead, and how to get recommended.
      </p>

      <div
        className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-2"
        style={{ animationDelay: "220ms" }}
      >
        {["ChatGPT", "Perplexity", "Gemini", "Claude"].map((e) => (
          <span
            key={e}
            className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400"
          >
            {e}
          </span>
        ))}
      </div>

      {step === "domain" && (
        <form
          onSubmit={submitDomain}
          className="animate-fade-up mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
          style={{ animationDelay: "300ms" }}
        >
          <input
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourbrand.com"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 transition hover:bg-white active:scale-[0.97]"
          >
            Scan free
          </button>
        </form>
      )}

      {step === "domain" && (
        <div
          className="animate-fade-up mx-auto mt-3 max-w-md text-left"
          style={{ animationDelay: "360ms" }}
        >
          <button
            type="button"
            onClick={() => setShowOpts((s) => !s)}
            className="mx-auto block text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            {showOpts ? "Auto-detecting market & category ▲" : "Auto-detecting market & category · customize ▾"}
          </button>
          {showOpts && (
            <div className="animate-fade-in mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as "auto" | "en" | "es")}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-violet-400/50"
              >
                <option value="auto">Language: Auto</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional, e.g. specialty coffee)"
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-violet-400/50"
              />
            </div>
          )}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={submitEmail} className="animate-fade-in mx-auto mt-8 max-w-md">
          <p className="mb-3 text-sm text-zinc-400">
            Drop your email to see the report for{" "}
            <span className="text-zinc-200">{domain}</span>.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 transition hover:bg-white active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
            >
              {pending ? "Scanning…" : "See report"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

"use client";

import type { ScanReport } from "@/lib/scan";
import { CountUp, useMounted } from "./motion";

const pctText = (n: number) => `${Math.round(n * 100)}%`;
const pct = (x: number) => pctText(x);

function StatCard({
  label,
  value,
  tone = "neutral",
  hint,
  delay,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "bad";
  hint?: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-xl border border-white/10 bg-white/[0.03] p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={`mt-2 text-4xl font-semibold tabular-nums ${
          tone === "bad" ? "text-red-400" : "text-zinc-100"
        }`}
      >
        <CountUp value={value} format={pctText} />
      </div>
      {hint && <div className="mt-1 text-sm text-zinc-500">{hint}</div>}
    </div>
  );
}

export function ReportView({ report }: { report: ScanReport }) {
  const { score } = report;
  const mounted = useMounted();
  const brandLow = score.shareOfVoice < 0.15;
  const topRival = score.leaderboard[0];

  // Ranking real de la marca entre las nombradas por la IA (para el golpe de "puesto").
  const brandsAhead = score.leaderboard.filter(
    (c) => c.shareOfVoice > score.shareOfVoice,
  ).length;
  const rank = brandsAhead + 1;
  const totalBrands = score.leaderboard.length + 1;

  // Leaderboard con TU propia barra (en rojo) intercalada en su puesto real: se ve
  // el abismo, no solo a los que ganan.
  const ranked = [
    ...score.leaderboard.map((c) => ({ name: c.name, sov: c.shareOfVoice, you: false })),
    { name: "You", sov: score.shareOfVoice, you: true },
  ].sort((a, b) => b.sov - a.sov);

  return (
    <div className="w-full max-w-3xl">
      {/* Encabezado */}
      <div
        className="animate-fade-up mb-6 flex flex-wrap items-center gap-3"
        style={{ animationDelay: "40ms" }}
      >
        <h2 className="text-lg font-medium text-zinc-200">{report.domain}</h2>
        {report.mock && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300">
            simulated data (no API keys)
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-500">
          {report.promptCount} prompts · {report.engineIds.join(" + ")}
        </span>
      </div>

      {/* El cachetazo — dos golpes: share-of-voice gigante + invisibilidad visceral */}
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
        <div className="text-sm text-zinc-400">Your share-of-voice in AI answers</div>
        <div
          className={`mt-1 text-7xl font-bold tabular-nums ${
            brandLow ? "text-red-400" : "text-emerald-400"
          }`}
        >
          <CountUp value={score.shareOfVoice} durationMs={1100} format={pctText} />
        </div>

        {/* Golpe #2 */}
        <div
          className="animate-fade-up mt-6 border-t border-white/10 pt-6"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-6xl font-bold tabular-nums text-red-400">
              <CountUp value={score.invisibleRate} durationMs={1100} format={pctText} />
            </span>
            <span className="text-lg text-zinc-300">
              of buying questions never mention you
            </span>
          </div>
          {topRival && (
            <p className="mt-3 text-zinc-400">
              <span className="font-semibold text-zinc-200">{topRival.name}</span> is
              winning them with {pct(topRival.shareOfVoice)} share-of-voice.
            </p>
          )}
        </div>
      </div>

      {/* Stats de soporte (sin repetir SoV/invisible del hero) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Citation rate"
          value={score.citationRate}
          hint="questions that cite you as a source"
          delay={200}
        />
        <div
          className="animate-fade-up rounded-xl border border-white/10 bg-white/[0.03] p-5"
          style={{ animationDelay: "280ms" }}
        >
          <div className="text-xs uppercase tracking-wide text-zinc-500">Your rank</div>
          <div
            className={`mt-2 text-4xl font-semibold tabular-nums ${
              rank > 3 ? "text-red-400" : "text-zinc-100"
            }`}
          >
            #{rank}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            of {totalBrands} brands named by AI
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {score.leaderboard.length > 0 && (
        <div className="animate-fade-up mt-8" style={{ animationDelay: "320ms" }}>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
            Who&apos;s beating you
          </h3>
          <div className="space-y-2">
            {ranked.map((c, i) => {
              const w = Math.max(2, Math.round(c.sov * 100));
              return (
                <div key={`${c.name}-${i}`} className="flex items-center gap-3">
                  <div
                    className={`w-28 shrink-0 truncate text-sm ${
                      c.you ? "font-semibold text-red-400" : "text-zinc-300"
                    }`}
                  >
                    {c.name}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`bar-grow h-full rounded-full ${
                        c.you ? "bg-red-400" : "bg-zinc-400"
                      }`}
                      style={{ width: mounted ? `${w}%` : "0%", transitionDelay: `${350 + i * 60}ms` }}
                    />
                  </div>
                  <div
                    className={`w-12 shrink-0 text-right text-sm tabular-nums ${
                      c.you ? "font-semibold text-red-400" : "text-zinc-400"
                    }`}
                  >
                    {pct(c.sov)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prompts perdidos */}
      {report.lostPrompts.length > 0 && (
        <div className="animate-fade-up mt-8" style={{ animationDelay: "400ms" }}>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
            Questions where you&apos;re invisible
          </h3>
          <ul className="space-y-2">
            {report.lostPrompts.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-zinc-400"
              >
                <span className="text-zinc-600">{p.engine}</span> — “{p.prompt}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

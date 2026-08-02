import type { ScanReport } from "@/lib/scan";

const pct = (x: number) => `${Math.round(x * 100)}%`;

function StatCard({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "bad";
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={`mt-2 text-4xl font-semibold tabular-nums ${
          tone === "bad" ? "text-red-400" : "text-zinc-100"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-sm text-zinc-500">{hint}</div>}
    </div>
  );
}

export function ReportView({ report }: { report: ScanReport }) {
  const { score } = report;
  const brandLow = score.shareOfVoice < 0.15;
  const topRival = score.leaderboard[0];

  return (
    <div className="w-full max-w-3xl">
      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-medium text-zinc-200">{report.domain}</h2>
        {report.mock && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300">
            datos simulados (sin API keys)
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-500">
          {report.promptCount} prompts · {report.engineIds.join(" + ")}
        </span>
      </div>

      {/* El cachetazo */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
        <div className="text-sm text-zinc-400">Tu share-of-voice en respuestas de IA</div>
        <div
          className={`mt-1 text-7xl font-bold tabular-nums ${
            brandLow ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {pct(score.shareOfVoice)}
        </div>
        <p className="mt-3 max-w-xl text-zinc-400">
          Sos <span className="font-semibold text-zinc-200">invisible en {pct(score.invisibleRate)}</span>{" "}
          de los prompts de compra.{" "}
          {topRival && (
            <>
              <span className="font-semibold text-zinc-200">{topRival.name}</span> te está
              ganando con {pct(topRival.shareOfVoice)} de share-of-voice.
            </>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Share of voice" value={pct(score.shareOfVoice)} tone={brandLow ? "bad" : "neutral"} />
        <StatCard label="Tasa de citación" value={pct(score.citationRate)} hint="prompts que te citan como fuente" />
        <StatCard label="Invisible" value={pct(score.invisibleRate)} tone={score.invisibleRate > 0.5 ? "bad" : "neutral"} hint="prompts donde no aparecés" />
      </div>

      {/* Leaderboard */}
      {score.leaderboard.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
            Quién te está ganando
          </h3>
          <div className="space-y-2">
            {score.leaderboard.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-28 shrink-0 truncate text-sm text-zinc-300">{c.name}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-zinc-400"
                    style={{ width: `${Math.max(2, Math.round(c.shareOfVoice * 100))}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                  {pct(c.shareOfVoice)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts perdidos */}
      {report.lostPrompts.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
            Prompts donde sos invisible
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

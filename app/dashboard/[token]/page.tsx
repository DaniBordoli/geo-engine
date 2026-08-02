import { notFound } from "next/navigation";
import { getDashboard, type ScanPoint } from "@/lib/dashboard";
import { ReScanButton } from "./rescan-button";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

// Sparkline de share-of-voice (0–1) a lo largo de los scans.
function Sparkline({ points }: { points: ScanPoint[] }) {
  const vals = points
    .map((p) => p.shareOfVoice)
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return null;

  const w = 260;
  const h = 52;
  const pad = 5;
  const coords = vals.map((v, i) => {
    const x = vals.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (vals.length - 1);
    const y = h - pad - v * (h - 2 * pad);
    return [x, y] as const;
  });
  const last = coords[coords.length - 1];

  return (
    <svg width={w} height={h} className="text-emerald-400">
      <polyline
        points={coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />
    </svg>
  );
}

function Delta({ points }: { points: ScanPoint[] }) {
  const vals = points.map((p) => p.shareOfVoice).filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  const d = vals[vals.length - 1] - vals[vals.length - 2];
  if (Math.abs(d) < 0.005) return <span className="text-sm text-zinc-500">sin cambios</span>;
  const up = d > 0;
  return (
    <span className={`text-sm ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(d * 100))}pts vs. scan previo
    </span>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getDashboard(token);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-100">Tu dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">{data.email}</p>

      {data.domains.length === 0 && (
        <p className="mt-10 text-zinc-500">Todavía no hay scans.</p>
      )}

      <div className="mt-10 space-y-8">
        {data.domains.map(({ domain, points }, i) => {
          const latest = points[points.length - 1];
          return (
            <section
              key={domain}
              className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-medium text-zinc-100">{domain}</h2>
                {latest.paid && (
                  <a
                    href={`/fixpack/${latest.id}`}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300 hover:border-emerald-400/60"
                  >
                    ver fix pack →
                  </a>
                )}
                <div className="ml-auto">
                  <ReScanButton token={token} domain={domain} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Share of voice
                  </div>
                  <div className="text-4xl font-semibold tabular-nums text-zinc-100">
                    {pct(latest.shareOfVoice)}
                  </div>
                  <Delta points={points} />
                </div>
                <Sparkline points={points} />
              </div>

              <table className="mt-6 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-600">
                    <th className="py-1 font-normal">Fecha</th>
                    <th className="py-1 font-normal">Share of voice</th>
                    <th className="py-1 font-normal">Citación</th>
                    <th className="py-1 font-normal">Invisible</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  {[...points].reverse().map((p) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="py-1.5">
                        {p.createdAt.slice(0, 10)} {p.createdAt.slice(11, 16)}
                      </td>
                      <td className="py-1.5 tabular-nums">{pct(p.shareOfVoice)}</td>
                      <td className="py-1.5 tabular-nums">{pct(p.citationRate)}</td>
                      <td className="py-1.5 tabular-nums">{pct(p.invisibleRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </main>
  );
}

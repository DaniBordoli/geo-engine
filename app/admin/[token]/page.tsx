import crypto from "node:crypto";
import { notFound } from "next/navigation";
import { getAdminData } from "@/lib/admin";

// Gate: comparación en tiempo constante contra ADMIN_TOKEN (como el webhook).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

const FUNNEL = [
  ["scan_started", "Scans"],
  ["report_viewed", "Reporte visto"],
  ["report_shared", "Compartido"],
  ["checkout_clicked", "Checkout"],
  ["paid", "Pagó"],
] as const;

const pct = (a: number, b: number) => (b === 0 ? "—" : `${Math.round((a / b) * 100)}%`);

export default async function AdminPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = process.env.ADMIN_TOKEN;
  if (!admin || !safeEqual(token, admin)) notFound();

  const data = await getAdminData();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-100">Admin · funnel</h1>
      <p className="mt-1 text-sm text-zinc-500">Últimos 30 días</p>

      {!data && <p className="mt-10 text-zinc-500">Sin DATABASE_URL — nada que mostrar.</p>}

      {data && (
        <div className="mt-10 space-y-10">
          {/* Funnel total */}
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">Funnel</h2>
            <div className="space-y-2">
              {FUNNEL.map(([type, label], i) => {
                const count = data.funnel.find((f) => f.type === type)?.count ?? 0;
                const prev =
                  i === 0
                    ? count
                    : data.funnel.find((f) => f.type === FUNNEL[i - 1][0])?.count ?? 0;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5"
                  >
                    <span className="w-32 text-sm text-zinc-300">{label}</span>
                    <span className="text-lg font-semibold tabular-nums text-zinc-100">
                      {count}
                    </span>
                    {i > 0 && (
                      <span className="ml-auto text-xs text-zinc-500">
                        {pct(count, prev)} del paso previo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Por fuente */}
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
              Conversión por fuente
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-600">
                  <th className="py-1 font-normal">Fuente</th>
                  <th className="py-1 font-normal">Scans</th>
                  <th className="py-1 font-normal">Pagos</th>
                  <th className="py-1 font-normal">scan→paid</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {data.bySource.map((r) => (
                  <tr key={r.source} className="border-t border-white/5">
                    <td className="py-1.5">{r.source}</td>
                    <td className="py-1.5 tabular-nums">{r.scans}</td>
                    <td className="py-1.5 tabular-nums">{r.paid}</td>
                    <td className="py-1.5 tabular-nums">{pct(r.paid, r.scans)}</td>
                  </tr>
                ))}
                {data.bySource.length === 0 && (
                  <tr>
                    <td className="py-2 text-zinc-500" colSpan={4}>
                      Todavía no hay scans.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Scans por día */}
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-500">
              Scans por día
            </h2>
            <div className="space-y-1">
              {data.scansByDay.map((d) => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-zinc-500">{d.day}</span>
                  <div
                    className="h-4 rounded bg-emerald-400/70"
                    style={{ width: `${Math.min(100, d.count * 12)}%`, minWidth: "8px" }}
                  />
                  <span className="tabular-nums text-zinc-400">{d.count}</span>
                </div>
              ))}
              {data.scansByDay.length === 0 && (
                <p className="text-zinc-500">Sin scans en el período.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

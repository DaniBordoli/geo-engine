import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { brandFromDomain } from "@/lib/scan";
import { FixPackView } from "./fixpack-view";

// Página estable por scan: entrada durable al fix pack tras el pago. El redirect
// de Lemon aterriza acá (ver buildCheckoutUrl). Lee el scan sólo para el dominio;
// el estado (locked | generating | ready) lo resuelve el client con
// getFixPackState — el mismo que usa la sección del reporte en la home.
export default async function FixPackPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← geo-engine
      </a>
      <FixPackView
        scanId={scan.id}
        domain={scan.domain}
        brand={brandFromDomain(scan.domain)}
      />
    </main>
  );
}

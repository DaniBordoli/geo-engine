import { after } from "next/server";
import { notFound } from "next/navigation";
import { getReportByToken, getScanIdByReportToken } from "@/lib/report-read";
import { track } from "@/lib/analytics/events";
import { ReportView } from "@/app/report-view";

// Reporte público read-only (/r/[token]): cualquiera con el link ve el cachetazo,
// sin gate de email. Es el mecanismo viral. Sin paywall/fix pack acá.
export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getReportByToken(token);
  if (!report) notFound();

  // Funnel: report_viewed post-respuesta (no demora el render).
  after(async () => {
    const scanId = await getScanIdByReportToken(token);
    await track("report_viewed", { scanId: scanId ?? undefined });
  });

  return (
    <main className="relative flex flex-1 flex-col items-center px-6 py-16">
      <div className="aurora" aria-hidden />
      <ReportView report={report} />

      <div className="mt-14 text-center">
        <p className="text-zinc-400">¿Querés ver cómo te ve la IA a vos?</p>
        <a
          href="/"
          className="mt-3 inline-block rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white"
        >
          Escaneá tu tienda gratis
        </a>
      </div>
    </main>
  );
}

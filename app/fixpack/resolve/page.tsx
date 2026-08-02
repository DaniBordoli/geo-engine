import { redirect } from "next/navigation";
import { resolveScanIdByOrder } from "@/app/fixpack-actions";
import { ResolveView } from "./resolve-view";

// Aterrizaje del redirect post-pago de Lemon (configurado a nivel producto como
// /fixpack/resolve?order=[order_id]). Resuelve el scan desde el order id y manda
// a la página estable /fixpack/[scanId]. Si el webhook order_created todavía no
// persistió el order id (carrera), delega en el client que pollea.
export default async function ResolvePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  if (!order) redirect("/");

  const scanId = await resolveScanIdByOrder(order);
  if (scanId) redirect(`/fixpack/${scanId}`);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <ResolveView order={order} />
    </main>
  );
}

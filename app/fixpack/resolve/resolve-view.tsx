"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveScanIdByOrder } from "@/app/fixpack-actions";
import { analytics } from "@/lib/analytics/client";

// Cuánto reintentamos que el webhook order_created persista el order id antes de
// rendirnos. ~30s cubre de sobra el lag entre el redirect y el webhook.
const MAX_POLLS = 10;
const POLL_MS = 3000;

export function ResolveView({ order }: { order: string }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  const polls = useRef(0);

  // Se llega acá sólo por el redirect post-pago de Lemon → buen proxy de "Paid".
  useEffect(() => {
    analytics("Paid");
  }, []);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const scanId = await resolveScanIdByOrder(order);
      if (!active) return;
      if (scanId) {
        router.replace(`/fixpack/${scanId}`);
        return;
      }
      polls.current += 1;
      if (polls.current >= MAX_POLLS) {
        setGaveUp(true);
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    const id = setTimeout(tick, POLL_MS);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [order, router]);

  if (gaveUp) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">
          No pudimos encontrar tu compra
        </h1>
        <p className="mt-3 text-zinc-400">
          Si acabás de pagar, puede tardar unos segundos. Volvé a intentar, o
          entrá a tu dashboard desde el link que te enviamos por email.
        </p>
        <button
          onClick={() => {
            polls.current = 0;
            setGaveUp(false);
          }}
          className="mt-6 rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-zinc-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
      Confirmando tu pago y preparando tu fix pack…
    </div>
  );
}

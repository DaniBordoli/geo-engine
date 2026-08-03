"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFixPackState,
  regenerateFixPack,
  type FixPackState,
} from "@/app/fixpack-actions";
import { PaidView } from "@/app/fixpack-section";

// Cuántas veces reintentamos mientras el estado sigue "locked": cubre la carrera
// entre el redirect de Lemon y el webhook order_created que marca scans.paid. Si
// tras esto sigue sin pagar, mostramos el checkout como fallback (nunca pagó /
// entró directo a la URL).
const LOCKED_MAX_POLLS = 5;
// Tope del "generating" (F1.b): ~3 min (60 × 3s) antes de cortar y ofrecer retry,
// para que el que pagó NUNCA quede con el spinner girando si la generación se cortó.
const GENERATING_MAX_POLLS = 60;
const POLL_MS = 3000;

export function FixPackView({
  scanId,
  domain,
  brand,
}: {
  scanId: string;
  domain: string;
  brand: string;
}) {
  const [state, setState] = useState<FixPackState | null>(null);
  const [tookTooLong, setTookTooLong] = useState(false);
  const lockedPolls = useRef(0);
  const genPolls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setState(await getFixPackState(scanId));
  }, [scanId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const retryGeneration = () => {
    genPolls.current = 0;
    setTookTooLong(false);
    void regenerateFixPack(scanId).then(refresh);
  };

  // Poll: siempre mientras se genera (pago confirmado, esperamos al LLM); y unas
  // pocas veces en "locked" para absorber el lag del webhook tras el redirect.
  useEffect(() => {
    if (!state) return;
    if (state.status === "generating" && genPolls.current >= GENERATING_MAX_POLLS) {
      setTookTooLong(true);
      return;
    }
    const keepPolling =
      (state.status === "generating" && !tookTooLong) ||
      (state.status === "locked" && lockedPolls.current < LOCKED_MAX_POLLS);
    if (!keepPolling) return;
    timer.current = setTimeout(() => {
      if (state.status === "locked") lockedPolls.current += 1;
      if (state.status === "generating") genPolls.current += 1;
      refresh();
    }, POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, refresh, tookTooLong]);

  if (state?.status === "ready") {
    return <PaidView pack={state.pack} domain={domain} brand={brand} />;
  }

  const confirmingPayment =
    state?.status === "locked" && lockedPolls.current < LOCKED_MAX_POLLS;

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold text-zinc-100">Fix pack — {domain}</h1>

      {(!state || (state.status === "generating" && !tookTooLong) || confirmingPayment) && (
        <div className="mt-6 flex items-center gap-3 text-zinc-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          {state?.status === "generating"
            ? "Your payment is confirmed. We're generating your fix pack…"
            : confirmingPayment
              ? "Confirming your payment…"
              : "Loading…"}
        </div>
      )}

      {state?.status === "generating" && tookTooLong && (
        <div className="mt-6">
          <p className="text-zinc-300">
            This is taking longer than expected — we&apos;ll email you the fix pack when
            it&apos;s ready.
          </p>
          <button
            onClick={retryGeneration}
            className="mt-3 rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 active:scale-[0.97]"
          >
            Retry now
          </button>
        </div>
      )}

      {state?.status === "locked" && !confirmingPayment && (
        <div className="mt-6">
          <p className="text-zinc-400">
            This fix pack isn&apos;t unlocked yet.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={state.checkoutUrl}
              className="rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 hover:bg-white"
            >
              Unlock fix pack — US$49
            </a>
            <button
              onClick={() => {
                lockedPolls.current = 0;
                refresh();
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Already paid → refresh
            </button>
          </div>
        </div>
      )}

      {state?.status === "error" && (
        <p className="mt-6 text-sm text-red-400">{state.error}</p>
      )}
    </div>
  );
}

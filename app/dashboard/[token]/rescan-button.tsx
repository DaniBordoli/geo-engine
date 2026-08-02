"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reScanAction } from "../../dashboard-actions";

export function ReScanButton({ token, domain }: { token: string; domain: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await reScanAction(token, domain);
            if (res.ok) router.refresh();
            else setError(res.error ?? "Error");
          })
        }
        disabled={pending}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:border-white/30 disabled:opacity-60"
      >
        {pending ? "Re-escaneando…" : "Re-escanear"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}

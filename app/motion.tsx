"use client";

import { useEffect, useRef, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

// Devuelve true tras el primer paint (para disparar transiciones de entrada).
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// Cuenta desde 0 hasta `value` con ease-out. Respeta prefers-reduced-motion.
export function CountUp({
  value,
  durationMs = 900,
  format,
}: {
  value: number;
  durationMs?: number;
  format: (n: number) => string;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    const start = performance.now();
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setN(value * ease(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    setN(0);
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs, reduced]);

  return <>{format(n)}</>;
}

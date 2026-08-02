// Wrapper fino de analytics de CLIENTE (hoy Plausible, cookieless). Cambiar de
// proveedor (ej. Umami) = tocar solo este archivo. No-op si Plausible no cargó
// (sin NEXT_PUBLIC_PLAUSIBLE_DOMAIN). No mandes PII en props.
type Props = Record<string, string | number | boolean>;

type PlausibleFn = (event: string, options?: { props?: Props }) => void;

export function analytics(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (typeof plausible === "function") {
    plausible(event, props ? { props } : undefined);
  }
}

import { ScanFlow } from "./scan-flow";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="aurora" aria-hidden />
      <ScanFlow />
      <a
        href="/faq"
        className="mt-12 text-xs text-zinc-600 transition hover:text-zinc-400"
      >
        How it works · FAQ
      </a>
    </main>
  );
}

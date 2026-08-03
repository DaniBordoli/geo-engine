import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — geo-engine",
  description: "How geo-engine measures and fixes your AI-search visibility.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What does geo-engine actually do?",
    a: "People increasingly ask AI (ChatGPT, Perplexity, Gemini) what to buy instead of Googling. geo-engine scans your store, runs the real buying questions your customers ask those AIs, and shows you how often you get recommended vs your competitors — then gives you the specific changes to start showing up.",
  },
  {
    q: "How is this different from SEO / Semrush / Ahrefs?",
    a: "SEO is about ranking on Google's list of links. This is about being named inside the AI's answer — a different game. Tools like Semrush now measure AI visibility, but they don't fix it. We do both: we show you where you're invisible and hand you the work to fix it.",
  },
  {
    q: "How does the scan work? Where does the data come from?",
    a: "We ask the AI engines a set of real category buying questions (“best gentle cleanser for sensitive skin”, etc.) and check which brands they recommend. Your share-of-voice is the % of those questions where you show up. It's live data from the engines, not a guess.",
  },
  {
    q: "Which AI engines do you check?",
    a: "ChatGPT today, with more engines (like Perplexity) being added. We only tell you what we actually query.",
  },
  {
    q: "Is the result accurate?",
    a: "It's a real, representative snapshot — not a universal guarantee. AI answers shift over time, so we re-run the same set of category questions on each scan and chart your share-of-voice, letting you track whether you're gaining or losing ground. More signal than any dashboard that just guesses.",
  },
  {
    q: "What do I get if I pay (the fix pack)?",
    a: "A prioritized set of concrete fixes: content written to be citable by AI (clear answers, comparison tables, Q&A), the structured data (schema) to add, and an off-site action list (where to earn mentions). You get the work, ready to ship — not just a score.",
  },
  {
    q: "Do you guarantee I'll show up in ChatGPT?",
    a: "No — and be wary of anyone who does. AI answers aren't something anyone controls. We improve your odds with the changes that actually matter, and you track the trend. We're a coach, not a magic pill.",
  },
  {
    q: "Do you make the changes to my site automatically?",
    a: "No. We give you the drafts and the exact steps; you (or your team) ship them. You stay in control of your site.",
  },
  {
    q: "Isn't this just adding schema / llms.txt like other Shopify apps?",
    a: "Those optimize blindly. We start from measured gaps — which specific questions you lose and who beats you — and fix those. Measurement-driven, not one-click-and-hope.",
  },
  {
    q: "What niches and languages do you support?",
    a: "Any store, any language. We detect your category and market from your site and ask the right buying questions in the right language.",
  },
  {
    q: "How much does it cost?",
    a: "The scan is free. The fix pack is a one-time US$49.",
  },
  {
    q: "Is my data safe?",
    a: "We read your public website and store your scan results and the email you give us — that's it. We never ask for account passwords, and payments run through Lemon Squeezy (a merchant of record), so your card details never touch our servers. We use your email only to send you your report. Analytics is cookieless.",
  },
];

export default function FaqPage() {
  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="aurora" aria-hidden />
      <a href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
        ← geo-engine
      </a>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">
        Frequently asked questions
      </h1>

      <div className="mt-10 space-y-8">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h2 className="text-lg font-medium text-zinc-100">{q}</h2>
            <p className="mt-2 leading-relaxed text-zinc-400">{a}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 border-t border-white/10 pt-8 text-center">
        <a
          href="/"
          className="inline-block rounded-lg bg-zinc-100 px-5 py-3 font-medium text-zinc-900 transition hover:bg-white active:scale-[0.97]"
        >
          Scan your store — free
        </a>
      </div>
    </main>
  );
}

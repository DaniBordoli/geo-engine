import { ImageResponse } from "next/og";
import { getReportByToken } from "@/lib/report-read";

export const alt = "Tu visibilidad en respuestas de IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const pct = (x: number) => `${Math.round(x * 100)}%`;

// OG image del reporte: el "cachetazo" para pegar en X/Slack. Sin PII.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getReportByToken(token);

  const low = !report || report.score.shareOfVoice < 0.15;
  const sov = report ? pct(report.score.shareOfVoice) : "—";
  const invisible = report ? pct(report.score.invisibleRate) : "—";
  const top = report?.score.leaderboard[0]?.name;
  const domain = report?.domain ?? "geo-engine";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#08080a",
          color: "#ededed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#a1a1aa" }}>
          geo-engine · visibilidad en IA
        </div>
        <div style={{ fontSize: 40, marginTop: 8, color: "#e4e4e7" }}>{domain}</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 32, color: "#a1a1aa" }}>
            Share-of-voice en respuestas de IA
          </div>
          <div
            style={{
              fontSize: 200,
              fontWeight: 800,
              lineHeight: 1,
              color: low ? "#f87171" : "#34d399",
            }}
          >
            {sov}
          </div>
        </div>

        <div style={{ fontSize: 40, marginTop: 32, color: "#d4d4d8" }}>
          Invisible en {invisible} de los prompts de compra
          {top ? ` · ${top} te gana` : ""}
        </div>
      </div>
    ),
    { ...size },
  );
}

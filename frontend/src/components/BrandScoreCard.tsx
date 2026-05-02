import { type BrandResult } from "../api/client";

const BRAND_COLORS: Record<string, string> = {
  Brooks: "#4a7c59",
  Nike:   "#c8940a",
  Adidas: "#6b7280",
  Hoka:   "#9ca3af",
};

interface Props {
  result: BrandResult;
  rank: number;
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score >= 0 ? "+" : "") + score.toFixed(2);
}

export default function BrandScoreCard({ result, rank }: Props) {
  const color = BRAND_COLORS[result.brandName] || "#6b7280";

  const scoreClass = !result.isVisible
    ? "neutral"
    : result.sentimentScore !== null && result.sentimentScore < 0
      ? "negative"
      : "positive";

  return (
    <div className={`brand-card ${result.isVisible ? "visible" : "not-visible"}`}>
      <div className="brand-dot" style={{ background: color }} />
      <span className="brand-name">{result.brandName}</span>
      <span className={`score-num ${scoreClass}`}>
        {result.isVisible ? formatScore(result.sentimentScore) : "—"}
      </span>
      <span className="visibility-info">
        {result.isVisible ? `visible · #${rank}` : "not mentioned"}
      </span>
    </div>
  );
}

import { type BrandResult } from "../api/client";

const BRAND_COLORS: Record<string, string> = {
  Brooks:       "#4a7c59",
  Nike:         "#c8940a",
  Adidas:       "#6b7280",
  Hoka:         "#9ca3af",
  ASICS:        "#3b82f6",
  "New Balance": "#7c3aed",
  Saucony:      "#dc2626",
  Mizuno:       "#0891b2",
  Salomon:      "#d97706",
  Altra:        "#059669",
  Puma:         "#db2777",
  Reebok:       "#4f46e5",
  "Under Armour": "#1d4ed8",
  Newton:       "#b45309",
};

// Generate a stable color for unknown brands based on name hash
function brandColor(name: string): string {
  if (BRAND_COLORS[name]) return BRAND_COLORS[name];
  const palette = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[hash % palette.length];
}

interface Props {
  result: BrandResult;
  rank: number;
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score >= 0 ? "+" : "") + score.toFixed(2);
}

export default function BrandScoreCard({ result, rank }: Props) {
  const color = brandColor(result.brandName);

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

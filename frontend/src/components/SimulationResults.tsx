import { type Simulation, type BrandResult, type BrandAttribute } from "../api/client";
import BrandScoreCard from "./BrandScoreCard";

interface Props {
  simulation: Simulation;
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score >= 0 ? "+" : "") + score.toFixed(2);
}

function extractBrandQuotes(rawResponse: string, brandName: string): string[] {
  const passages = rawResponse
    .split(/(?<=[.!?])\s+|\n+/)
    .map(part => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const brandLower = brandName.toLowerCase();
  const quotes = passages.filter(
    passage => passage.toLowerCase().includes(brandLower) && passage.length >= 24
  );

  return [...new Set(quotes)].slice(0, 3);
}

function attributeScore(attribute: BrandAttribute): number {
  if (attribute.sentiment === "positive") return 5;
  if (attribute.sentiment === "negative") return 1;
  return 3;
}

function attributeScoreLabel(attribute?: BrandAttribute): string {
  if (!attribute) return "—";
  return `${attributeScore(attribute)}/5`;
}

function ComparisonTable({ brands }: { brands: BrandResult[] }) {
  const visible = [...brands]
    .filter(b => b.isVisible)
    .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));

  if (visible.length === 0) return null;

  return (
    <div className="comparison-section">
      <div className="attributes-label">Brand Comparison</div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="ct-row-label" />
              {visible.map(b => (
                <th key={b.brandName} className="ct-brand-col">{b.brandName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ct-row-label">Score</td>
              {visible.map(b => {
                const cls = b.sentimentScore === null
                  ? "ct-neutral"
                  : b.sentimentScore < 0 ? "ct-negative" : "ct-positive";
                return (
                  <td key={b.brandName} className={`ct-cell ${cls}`}>
                    {formatScore(b.sentimentScore)}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="ct-row-label">Sentiment</td>
              {visible.map(b => (
                <td key={b.brandName} className="ct-cell">
                  {b.sentimentLabel ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="ct-row-label">Rank</td>
              {visible.map((b, i) => (
                <td key={b.brandName} className="ct-cell">#{i + 1}</td>
              ))}
            </tr>
            <tr>
              <td className="ct-row-label">Mentions</td>
              {visible.map(b => (
                <td key={b.brandName} className="ct-cell">{b.mentionCount}</td>
              ))}
            </tr>
            {visible.some(b => b.attributes.length > 0) && (
              <tr>
                <td className="ct-row-label">Driving attributes</td>
                {visible.map(b => (
                  <td key={b.brandName} className="ct-cell ct-attrs-cell">
                    {b.attributes.length > 0 ? (
                      <div className="ct-attrs">
                        {b.attributes.map((a, i) => (
                          <span key={i} className={`attr-tag ${a.sentiment}`}>{a.text}</span>
                        ))}
                      </div>
                    ) : "—"}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttributeComparisonTable({ brands }: { brands: BrandResult[] }) {
  const visible = [...brands]
    .filter(b => b.isVisible)
    .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));

  const attributeNames = [...new Set(
    visible.flatMap(brand => brand.attributes.map(attribute => attribute.text))
  )].sort((a, b) => {
    const countA = visible.filter(brand => brand.attributes.some(attribute => attribute.text === a)).length;
    const countB = visible.filter(brand => brand.attributes.some(attribute => attribute.text === b)).length;
    return countB - countA || a.localeCompare(b);
  }).slice(0, 10);

  if (visible.length === 0 || attributeNames.length === 0) return null;

  return (
    <div className="comparison-section">
      <div className="attributes-label">Attribute Comparison</div>
      <div className="comparison-scroll">
        <table className="comparison-table attribute-table">
          <thead>
            <tr>
              <th className="ct-row-label">Attribute</th>
              {visible.map(b => (
                <th key={b.brandName} className="ct-brand-col">{b.brandName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributeNames.map(attributeName => (
              <tr key={attributeName}>
                <td className="ct-row-label ct-attribute-name">{attributeName}</td>
                {visible.map(brand => {
                  const attribute = brand.attributes.find(
                    item => item.text.toLowerCase() === attributeName.toLowerCase()
                  );

                  return (
                    <td key={brand.brandName} className="ct-cell ct-attribute-cell">
                      {attribute ? (
                        <span className={`attribute-score-badge ${attribute.sentiment}`}>
                          {attributeScoreLabel(attribute)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="attribute-scale-note">1/5 is weak or negative, 3/5 is neutral, and 5/5 is strongest or most positive.</div>
    </div>
  );
}

function BrooksGapAnalysis({
  brands,
  rawResponse,
}: {
  brands: BrandResult[];
  rawResponse: string;
}) {
  const visible = [...brands]
    .filter(b => b.isVisible)
    .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));
  const brooks = brands.find(b => b.brandName === "Brooks");
  const topBrand = visible[0];

  if (!brooks || !topBrand) return null;

  const brooksRank = brooks.isVisible
    ? visible.findIndex(b => b.brandName === "Brooks") + 1
    : 0;
  const mentionGap = Math.max(0, topBrand.mentionCount - brooks.mentionCount);
  const attributeGap = Math.max(0, topBrand.attributes.length - brooks.attributes.length);
  const scoreGap =
    brooks.sentimentScore !== null && topBrand.sentimentScore !== null
      ? topBrand.sentimentScore - brooks.sentimentScore
      : null;

  const reasons: string[] = [];
  if (!brooks.isVisible) {
    reasons.push("Brooks is not being surfaced in the visible brand set, so it has no chance to win the top slot in this response.");
  } else if (brooksRank > 1) {
    reasons.push(`Brooks is ranked #${brooksRank}, behind ${topBrand.brandName}.`);
  }
  if (mentionGap > 0) {
    reasons.push(`Brooks is mentioned ${mentionGap} fewer times than ${topBrand.brandName}, so it has less top-of-mind presence.`);
  }
  if (scoreGap !== null && scoreGap > 0.15) {
    reasons.push(`The lead brand is carrying a stronger sentiment signal by about ${scoreGap.toFixed(2)}, which can push it higher in the ranking.`);
  }
  if (attributeGap > 0) {
    reasons.push(`Brooks has ${attributeGap} fewer extracted attributes than ${topBrand.brandName}, so the model has less detail to reinforce why it stands out.`);
  }

  const actions = [
    "Lead with a sharper product promise: cushion, stability, wide-fit comfort, or lightweight daily training.",
    "Add more distinctive proof points in copy and reviews so the model sees Brooks as the most specific solution.",
    "Use current running-shoe themes that are resonating online, like maximal cushioning, recovery-day comfort, stability support, and sustainability/material stories.",
    "Pair Brooks with role-based intent terms such as marathon training, long runs, foot support, and podiatrist-friendly recommendations."
  ];

  const quotes = extractBrandQuotes(rawResponse, "Brooks");

  return (
    <div className="analysis-section analysis-gap-section">
      <div className="attributes-label">
        {brooks.isVisible && brooksRank === 1 ? "Why Brooks is on top" : "Why Brooks is not on top"}
      </div>
      <div className="gap-summary">
        <div className="gap-stat">
          <span className="gap-stat-value">#{brooks.isVisible ? brooksRank || "-" : "—"}</span>
          <span className="gap-stat-label">Brooks rank</span>
        </div>
        <div className="gap-stat">
          <span className="gap-stat-value">{mentionGap}</span>
          <span className="gap-stat-label">mention gap</span>
        </div>
        <div className="gap-stat">
          <span className="gap-stat-value">{attributeGap}</span>
          <span className="gap-stat-label">attribute gap</span>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="gap-copy">
          <div className="gap-copy-label">What the current data suggests</div>
          <ul className="gap-list">
            {reasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {quotes.length > 0 && (
        <div className="gap-copy">
          <div className="gap-copy-label">Representative quotes</div>
          <div className="quote-list">
            {quotes.map((quote, index) => (
              <blockquote key={`${quote}-${index}`} className="brand-quote">
                “{quote}”
              </blockquote>
            ))}
          </div>
          <div className="quote-note">These are excerpts from the current AI response, not external reviews.</div>
        </div>
      )}

      <div className="gap-copy">
        <div className="gap-copy-label">Trend-aligned ways to improve</div>
        <ul className="gap-list">
          {actions.map(action => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SimulationResults({ simulation }: Props) {
  const visibleBrands = [...simulation.brandResults]
    .filter(b => b.isVisible)
    .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));

  const invisibleBrands = [...simulation.brandResults]
    .filter(b => !b.isVisible)
    .sort((a, b) => a.brandName.localeCompare(b.brandName));

  const sorted = [...visibleBrands, ...invisibleBrands];

  const getRank = (brandName: string) => {
    const idx = visibleBrands.findIndex(b => b.brandName === brandName);
    return idx === -1 ? 0 : idx + 1;
  };

  return (
    <div className="results-inline">
      <div className="brand-grid">
        {sorted.map(result => (
          <BrandScoreCard
            key={result.brandName}
            result={result}
            rank={getRank(result.brandName)}
          />
        ))}
      </div>

      <ComparisonTable brands={simulation.brandResults} />

      <AttributeComparisonTable brands={simulation.brandResults} />

      <BrooksGapAnalysis brands={simulation.brandResults} rawResponse={simulation.rawResponse} />

    </div>
  );
}

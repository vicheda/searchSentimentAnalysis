import { useState } from "react";
import { type Simulation, type BrandResult } from "../api/client";
import BrandScoreCard from "./BrandScoreCard";

interface Props {
  simulation: Simulation;
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score >= 0 ? "+" : "") + score.toFixed(2);
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

export default function SimulationResults({ simulation }: Props) {
  const [showRaw, setShowRaw] = useState(false);

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

    </div>
  );
}

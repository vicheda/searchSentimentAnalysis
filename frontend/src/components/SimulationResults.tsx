import { useState } from "react";
import { type Simulation } from "../api/client";
import BrandScoreCard from "./BrandScoreCard";

const BRAND_ORDER = ["Brooks", "Nike", "Adidas", "Hoka"];

interface Props {
  simulation: Simulation;
}

export default function SimulationResults({ simulation }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const sorted = BRAND_ORDER.map(name =>
    simulation.brandResults.find(b => b.brandName === name)!
  ).filter(Boolean);

  const visibleByOrder = [...sorted]
    .filter(b => b.isVisible)
    .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));

  const getRank = (brandName: string) => {
    const idx = visibleByOrder.findIndex(b => b.brandName === brandName);
    return idx === -1 ? 0 : idx + 1;
  };

  const brooks = sorted.find(b => b.brandName === "Brooks");
  const brooksAttrs = brooks?.attributes ?? [];

  return (
    <div className="results">
      <p className="prompt-display">"{simulation.prompt}"</p>

      <div className="brand-grid">
        {sorted.map(result => (
          <BrandScoreCard
            key={result.brandName}
            result={result}
            rank={getRank(result.brandName)}
          />
        ))}
      </div>

      {brooksAttrs.length > 0 && (
        <div className="attributes-section">
          <div className="attributes-label">Brooks — driving attributes</div>
          <div className="attributes">
            {brooksAttrs.map((a, i) => (
              <span key={i} className={`attr-tag ${a.sentiment}`}>{a.text}</span>
            ))}
          </div>
        </div>
      )}

      <div className="raw-section">
        <button className="toggle-raw" onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? "Hide" : "Show"} AI response
        </button>
        {showRaw && (
          <div className="raw-response">
            <pre>{simulation.rawResponse}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

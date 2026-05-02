import { type Simulation, type BrandResult } from "../api/client";

interface Props {
  simulations: Simulation[];
  currentId?: string;
  onSelect: (sim: Simulation) => void;
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score >= 0 ? "+" : "") + score.toFixed(2);
}

function getBrooks(sim: Simulation): BrandResult | undefined {
  return sim.brandResults.find(b => b.brandName === "Brooks");
}

function BrooksSummary({ simulations }: { simulations: Simulation[] }) {
  const allBrooks = simulations.map(getBrooks).filter(Boolean) as BrandResult[];
  const visible = allBrooks.filter(b => b.isVisible);
  const scores = visible.map(b => b.sentimentScore).filter((s): s is number => s !== null);

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const visibilityRate = simulations.length > 0 ? visible.length / simulations.length : 0;

  const attrFreq: Record<string, { count: number; sentiment: string }> = {};
  for (const b of allBrooks) {
    for (const a of b.attributes ?? []) {
      if (!attrFreq[a.text]) attrFreq[a.text] = { count: 0, sentiment: a.sentiment };
      attrFreq[a.text].count++;
    }
  }
  const topAttrs = Object.entries(attrFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const rankCounts: Record<number, number> = {};
  for (const sim of simulations) {
    const ordered = [...sim.brandResults]
      .filter(b => b.isVisible)
      .sort((a, b) => (a.firstMentionIndex ?? Infinity) - (b.firstMentionIndex ?? Infinity));
    const rank = ordered.findIndex(b => b.brandName === "Brooks");
    if (rank !== -1) rankCounts[rank + 1] = (rankCounts[rank + 1] ?? 0) + 1;
  }
  const maxRankCount = Math.max(...Object.values(rankCounts), 1);

  return (
    <div className="brooks-summary">
      <div className="summary-title">Brooks — Performance Summary</div>

      <div className="summary-stats">
        <div className="summary-stat">
          <div className={`stat-value ${avgScore !== null && avgScore < 0 ? "neg" : ""}`}>
            {avgScore !== null ? formatScore(avgScore) : "—"}
          </div>
          <div className="stat-label">avg sentiment</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{Math.round(visibilityRate * 100)}%</div>
          <div className="stat-label">visibility rate</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{simulations.length}</div>
          <div className="stat-label">total searches</div>
        </div>
      </div>

      {topAttrs.length > 0 && (
        <div className="summary-block">
          <div className="summary-section-label">Top attributes</div>
          <div className="attributes">
            {topAttrs.map(([text, { count, sentiment }]) => (
              <span key={text} className={`attr-tag ${sentiment}`}>
                {text}<span className="attr-count"> ×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(rankCounts).length > 0 && (
        <div className="summary-block">
          <div className="summary-section-label">Ranking breakdown</div>
          <div className="rank-bars">
            {Object.entries(rankCounts)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([rank, count]) => (
                <div key={rank} className="rank-bar-row">
                  <span className="rank-label">#{rank}</span>
                  <div className="rank-bar-wrap">
                    <div
                      className="rank-bar-fill"
                      style={{ width: `${(count / maxRankCount) * 100}%` }}
                    />
                  </div>
                  <span className="rank-count">{count}×</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimulationHistory({ simulations, currentId, onSelect }: Props) {
  if (simulations.length === 0) {
    return (
      <div className="history-empty">No searches yet. Run a simulation to get started.</div>
    );
  }

  return (
    <div className="history-layout">
      <BrooksSummary simulations={simulations} />

      <div className="history-list-panel">
        <div className="view-label">Recent searches</div>
        <div className="history-list">
          {simulations.map(sim => {
            const brooks = getBrooks(sim);
            const visibleBrands = sim.brandResults.filter(b => b.isVisible);
            const isActive = sim.id === currentId;

            return (
              <button
                key={sim.id}
                className={`history-card${isActive ? " active" : ""}`}
                onClick={() => onSelect(sim)}
              >
                <div className="hc-top">
                  <span className="hc-prompt">{sim.prompt}</span>
                  <span className={`hc-score ${brooks?.sentimentLabel ?? ""}`}>
                    Brooks {brooks?.isVisible ? formatScore(brooks.sentimentScore) : "—"}
                  </span>
                </div>
                <div className="hc-bottom">
                  <span className="hc-brands-text">
                    {visibleBrands.length > 0
                      ? visibleBrands.map(b => b.brandName).join(", ")
                      : "no brands detected"}
                  </span>
                  <span className="hc-time">
                    {new Date(sim.createdAt).toLocaleDateString()}{" "}
                    {new Date(sim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { type Simulation } from "../api/client";
import SimulationResults from "./SimulationResults";

interface Props {
  simulations: Simulation[];
}

export default function SimulationHistory({ simulations }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (simulations.length === 0) return null;

  return (
    <div className="history">
      <h2>Past simulations</h2>
      <div className="history-list">
        {simulations.map(sim => {
          const brooks = sim.brandResults.find(b => b.brandName === "Brooks");
          const isExpanded = expanded === sim.id;

          return (
            <div key={sim.id} className="history-item">
              <div
                className="history-row"
                onClick={() => setExpanded(isExpanded ? null : sim.id)}
              >
                <span className="history-prompt">{sim.prompt}</span>
                <span className="history-meta">
                  {brooks?.isVisible
                    ? <span className={`small-label ${brooks.sentimentLabel}`}>
                        Brooks {brooks.sentimentScore !== null ? (brooks.sentimentScore >= 0 ? "+" : "") + brooks.sentimentScore.toFixed(2) : "—"}
                      </span>
                    : <span className="small-label">Brooks: not mentioned</span>
                  }
                  <span className="history-time">
                    {new Date(sim.createdAt).toLocaleDateString()}{" "}
                    {new Date(sim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="expand-icon">{isExpanded ? "▲" : "▼"}</span>
                </span>
              </div>
              {isExpanded && (
                <div className="history-expanded">
                  <SimulationResults simulation={sim} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

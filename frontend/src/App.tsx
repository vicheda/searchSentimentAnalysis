import { useEffect, useState } from "react";
import { type Simulation, runSimulation, getSimulations } from "./api/client";
import PromptInput from "./components/PromptInput";
import SimulationResults from "./components/SimulationResults";
import SimulationHistory from "./components/SimulationHistory";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Simulation | null>(null);
  const [history, setHistory] = useState<Simulation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSimulations().then(setHistory).catch(() => {});
  }, []);

  const handleSubmit = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const sim = await runSimulation(prompt);
      setCurrent(sim);
      setHistory(prev => [sim, ...prev]);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="header-title">AI Search Sentiment</span>
      </header>

      <main className="app-main">
        <section className="input-section">
          <PromptInput onSubmit={handleSubmit} loading={loading} />
          {error && <div className="error-banner">{error}</div>}
        </section>

        {current && (
          <section className="results-section">
            <SimulationResults simulation={current} />
          </section>
        )}

        {history.length > 0 && (
          <section className="history-section">
            <div className="view-label">History</div>
            <SimulationHistory simulations={history} />
          </section>
        )}
      </main>
    </div>
  );
}

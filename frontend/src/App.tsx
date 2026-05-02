import { useEffect, useRef, useState } from "react";
import { type Simulation, runSimulation, getSimulations } from "./api/client";
import PromptInput from "./components/PromptInput";
import SimulationResults from "./components/SimulationResults";
import SimulationHistory from "./components/SimulationHistory";
import "./App.css";

const CHARS_PER_TICK = 6;
const TICK_MS = 15;

const EXAMPLE_QUERIES = [
  "Best running shoes for marathon training?",
  "What shoes do podiatrists recommend?",
  "Best running shoes for wide feet?",
  "Trail running shoes for beginners?",
];

type View = "home" | "results" | "history";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Simulation | null>(null);
  const [history, setHistory] = useState<Simulation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getSimulations().then(setHistory).catch(() => {});
    return () => stopStream();
  }, []);

  const stopStream = () => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
  };

  const startStream = (sim: Simulation) => {
    stopStream();
    const full = sim.rawResponse;
    let idx = 0;
    setStreamedText("");
    setIsStreaming(true);

    streamTimer.current = setInterval(() => {
      idx = Math.min(idx + CHARS_PER_TICK, full.length);
      setStreamedText(full.slice(0, idx));
      if (idx >= full.length) {
        stopStream();
        setIsStreaming(false);
      }
    }, TICK_MS);
  };

  const handleSubmit = async (prompt: string) => {
    stopStream();
    setView("results");
    setLoading(true);
    setError(null);
    setCurrent(null);
    setStreamedText("");
    setIsStreaming(false);
    setShowResponse(false);

    try {
      const sim = await runSimulation(prompt);
      setCurrent(sim);
      setHistory(prev => [sim, ...prev]);
      startStream(sim);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (sim: Simulation) => {
    stopStream();
    setView("results");
    setCurrent(sim);
    setStreamedText(sim.rawResponse);
    setIsStreaming(false);
    setShowResponse(false);
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === "home") {
    return (
      <div className="home-view">
        <div className="home-center">
          <div className="home-logo">AI Search Sentiment</div>
          <div className="home-sub">See how AI answers position your brand</div>
          <PromptInput onSubmit={handleSubmit} loading={loading} />
          <div className="home-chips">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} className="chip" onClick={() => handleSubmit(q)} disabled={loading}>
                {q}
              </button>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <button className="home-history-link" onClick={() => setView("history")}>
            View history ({history.length})
          </button>
        )}
      </div>
    );
  }

  // ── HISTORY ───────────────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <div className="shell">
        <header className="top-bar">
          <span className="logo-btn" onClick={() => setView(current ? "results" : "home")}>
            AI Search Sentiment
          </span>
          <div className="top-bar-right">
            <span className="tab-active">History</span>
            <button className="tab-btn" onClick={() => setView(current ? "results" : "home")}>
              {current ? "← Results" : "← Home"}
            </button>
          </div>
        </header>
        <SimulationHistory
          simulations={history}
          currentId={current?.id}
          onSelect={handleHistorySelect}
        />
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  return (
    <div className="shell">
      <header className="top-bar">
        <span className="logo-btn" onClick={() => setView("home")}>
          AI Search Sentiment
        </span>
        <div className="header-search">
          <PromptInput onSubmit={handleSubmit} loading={loading} compact />
        </div>
        <div className="top-bar-right">
          <button className="tab-btn" onClick={() => setView("history")}>
            History {history.length > 0 && `(${history.length})`}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="results-layout">
        {/* LEFT — brand analysis */}
        <div className="results-left">
          {current && (
            <p className="results-query">"{current.prompt}"</p>
          )}
          {loading && !current && (
            <div className="thinking-dots"><span /><span /><span /></div>
          )}
          {!loading && current && (
            <div className="panel-card panel-main-card">
              <div className="panel-label">Brand Analysis</div>
              <SimulationResults simulation={current} />
            </div>
          )}
        </div>

        {/* RIGHT — AI response */}
        <div className="results-right">
          {(loading || (!current && isStreaming)) && (
            <div className="panel-card panel-loading">
              <div className="thinking-dots"><span /><span /><span /></div>
              <span className="panel-loading-label">Analyzing brands…</span>
            </div>
          )}
          {!loading && current && (
            <div className="panel-card">
              <div className="panel-label">AI Response</div>
              <button
                className="toggle-response-btn"
                onClick={() => setShowResponse(prev => !prev)}
              >
                {showResponse ? "Hide AI response" : "Show AI response"}
              </button>
              {showResponse && (
                <div className="response-prose response-prose-card">
                  <p className="response-text">{streamedText || current.rawResponse}</p>
                  {isStreaming && <span className="stream-cursor">▋</span>}
                </div>
              )}
              {!showResponse && null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

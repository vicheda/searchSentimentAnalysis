import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  loading: boolean;
  compact?: boolean;
}

export default function PromptInput({ onSubmit, loading, compact = false }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      if (compact) setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (compact) {
    return (
      <div className="compact-search">
        <input
          className="compact-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask another question…"
          disabled={loading}
        />
        <button
          className="compact-btn"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? "…" : "→"}
        </button>
      </div>
    );
  }

  return (
    <div className="home-search-box">
      <input
        className="home-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. What are the best running shoes for marathon training?"
        disabled={loading}
      />
      <button
        className="home-search-btn"
        onClick={handleSubmit}
        disabled={loading || !value.trim()}
      >
        {loading ? "…" : "Search"}
      </button>
    </div>
  );
}

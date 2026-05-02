import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

export default function PromptInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="prompt-input">
      <h2>Ask a question...</h2>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. What are the best running shoes for marathon training?"
        rows={4}
        disabled={loading}
      />
      <div className="btn-row">
        <button
          className="run-btn"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? "Analyzing..." : "Run simulation →"}
        </button>
      </div>
    </div>
  );
}

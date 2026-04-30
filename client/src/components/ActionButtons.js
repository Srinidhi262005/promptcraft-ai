import React from "react";

function ActionButtons({ onImprove, onAnalyze, onClear, loading }) {
  return (
    <div className="buttons">
      <button onClick={onImprove} disabled={loading}>
        Improve Prompt
      </button>
      <button onClick={onAnalyze} disabled={loading}>
        Analyze Prompt
      </button>
      <button onClick={onClear} disabled={loading}>
        Clear Input
      </button>
    </div>
  );
}

export default ActionButtons;

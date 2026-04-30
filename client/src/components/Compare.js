import React from "react";

function Compare({ originalPrompt, improvedPrompt }) {
  if (!originalPrompt || !improvedPrompt) {
    return null;
  }

  return (
    <section>
      <h2>Before vs After</h2>
      <div className="compare-grid">
        <div>
          <h3>Original</h3>
          <pre>{originalPrompt}</pre>
        </div>
        <div>
          <h3>Improved</h3>
          <pre>{improvedPrompt}</pre>
        </div>
      </div>
    </section>
  );
}

export default Compare;

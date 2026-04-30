import React from "react";

function Output({ title, value, onCopy }) {
  if (!value) return null;

  return (
    <section className="output-section">
      <div className="output-header">
        <h2>{title}</h2>
        <button onClick={() => onCopy(value)}>Copy</button>
      </div>
      <pre className="output-box">{value}</pre>
    </section>
  );
}

export default Output;

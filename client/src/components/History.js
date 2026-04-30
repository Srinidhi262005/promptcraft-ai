import React from "react";

function History({ items, onReuse }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="history-section">
      <h2>History</h2>
      <div className="history-list">
        {items.map((item) => (
          <article key={item.id} className="history-item">
            <div className="history-meta">
              <span>{new Date(item.timestamp).toLocaleString()}</span>
              <button onClick={() => onReuse(item)}>Reuse</button>
            </div>
            <p>
              <strong>Prompt:</strong> {item.prompt}
            </p>
            <p>
              <strong>Improved:</strong> {item.improvedPrompt || "Not generated"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default History;

import React, { useEffect, useRef } from "react";

function Templates({ templates = [], onSelect }) {
  const selectRef = useRef(null);

  useEffect(() => {
    const el = selectRef.current;
    const computed = el ? window.getComputedStyle(el) : null;
    // #region agent log
    fetch("http://127.0.0.1:7383/ingest/49cae652-fb53-4435-a7d8-84a32192deb8", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a05d4d" },
      body: JSON.stringify({
        sessionId: "a05d4d",
        runId: "ui-redesign",
        hypothesisId: "H1",
        location: "client/src/components/Templates.js:11",
        message: "Templates dropdown mounted",
        data: {
          templateCount: templates.length,
          selectColor: computed?.color,
          selectBackground: computed?.backgroundColor,
          selectBorder: computed?.borderColor,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [templates.length]);

  return (
    <section>
      <h2>Templates</h2>
      <select
        ref={selectRef}
        aria-label="Prompt templates"
        defaultValue=""
        onChange={(e) => {
          const selectedId = Number(e.target.value);
          const selected = templates.find((t) => t.id === selectedId);
          if (selected) {
            onSelect?.(selected.prompt);
          }
        }}
      >
        <option value="" disabled>
          Choose a category template
        </option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.category}: {template.title}
          </option>
        ))}
      </select>
    </section>
  );
}

export default Templates;

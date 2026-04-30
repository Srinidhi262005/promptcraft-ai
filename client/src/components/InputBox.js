import React from "react";

function InputBox({ value, onChange }) {
  return (
    <section className="input-section">
      <h2>Your Prompt</h2>
      <textarea
        id="userPrompt"
        placeholder="Example: help me write a professional cold email for a frontend internship."
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}

export default InputBox;

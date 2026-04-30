import React, { useEffect, useState } from "react";
import { improvePrompt, analyzePrompt } from "./api";
import Header from "./components/Header";
import InputBox from "./components/InputBox";
import ActionButtons from "./components/ActionButtons";
import Output from "./components/Output";
import History from "./components/History";
import Templates from "./components/Templates";
import Compare from "./components/Compare";
import templatesData from "./data/templates";

const HISTORY_KEY = "promptcraft_history";
const HISTORY_LIMIT = 10;

function App() {
  const [prompt, setPrompt] = useState("");
  const [improved, setImproved] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, HISTORY_LIMIT));
      }
    } catch {
      // Ignore invalid or unavailable localStorage
    }
  }, []);

  const saveHistory = (entry) => {
    const next = [entry, ...history.filter((item) => item.id !== entry.id)].slice(
      0,
      HISTORY_LIMIT
    );
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const handleClear = () => {
    setPrompt("");
    setImproved("");
    setAnalysis("");
    setError("");
  };

  const handleImprove = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt before improving.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanPrompt = prompt.trim();
      const result = await improvePrompt(cleanPrompt);
      setImproved(result);
      setAnalysis("");
      saveHistory({
        id: `${Date.now()}`,
        prompt: cleanPrompt,
        improvedPrompt: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || "Failed to improve prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt before analyzing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanPrompt = prompt.trim();
      const result = await analyzePrompt(cleanPrompt);
      setAnalysis(result);
      setImproved("");
    } catch (err) {
      setError(err.message || "Failed to analyze prompt.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setError("");
    } catch {
      setError("Copy failed. Your browser may not support clipboard access.");
    }
  };

  const handleReuseFromHistory = (item) => {
    setPrompt(item.prompt || "");
    setImproved(item.improvedPrompt || "");
    setAnalysis("");
    setError("");
  };

  return (
    <div className="container">
      <Header />
      <Templates templates={templatesData} onSelect={setPrompt} />
      <InputBox value={prompt} onChange={setPrompt} />
      <ActionButtons
        onImprove={handleImprove}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        loading={loading}
      />
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="status-text">Generating response...</p>}
      <Output title="Improved Prompt" value={improved} onCopy={copyToClipboard} />
      <Output title="Prompt Analysis" value={analysis} onCopy={copyToClipboard} />
      <Compare originalPrompt={prompt} improvedPrompt={improved} />
      <History items={history} onReuse={handleReuseFromHistory} />
    </div>
  );
}

export default App;

const API_BASE_URL = process.env.REACT_APP_API_URL || "";

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Ignore JSON parse errors and fall back to generic message.
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || "Request failed.");
  }

  return data;
}

export async function improvePrompt(prompt) {
  const data = await postJson("/improve-prompt", { prompt });
  return data?.data?.improved || data?.improved || "";
}

export async function analyzePrompt(prompt) {
  const data = await postJson("/analyze-prompt", { prompt });
  return data?.data?.analysis || data?.analysis || "";
}

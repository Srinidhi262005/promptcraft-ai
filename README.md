# PromptCraft AI - Smart Prompt Builder

PromptCraft AI is a full-stack web application that turns basic user prompts into structured, professional prompts using prompt engineering.

## Features

- Prompt Improver (`Role + Task + Constraints + Format`)
- Prompt Analyzer (finds missing clarity, role, constraints, and format)
- Prompt Templates (Resume, Coding, AI Projects, Business Ideas)
- Prompt History (last 10 entries in `localStorage` with timestamp)
- Before vs After Comparison view
- One-click copy for AI output

## Tech Stack

- Frontend: React, CSS
- Backend: Node.js, Express
- AI: Hosted LLM via OpenRouter (no local install)
- Storage: Browser `localStorage` (history)

## File Structure

```text
promptcraft-ai/
  client/
    src/
      components/
        ActionButtons.js
        Compare.js
        Header.js
        History.js
        InputBox.js
        Output.js
        Templates.js
      data/
        templates.js
      App.js
      api.js
      index.css
      index.js
    package.json
  server/
    routes/
      prompt.js
    .env.example
    index.js
    package.json
  package.json
  README.md
```

## Setup Instructions

1. Install dependencies in all projects:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

2. Configure environment:

- Copy `server/.env.example` to `server/.env`
- Configure OpenRouter:

```env
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

3. Run frontend + backend together:

```bash
npm run dev
```

4. Open app:

- [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `POST /improve-prompt`
  - Body: `{ "prompt": "your raw prompt" }`
  - Returns: `{ "improved": "structured prompt" }`

- `POST /analyze-prompt`
  - Body: `{ "prompt": "your raw prompt" }`
  - Returns: `{ "analysis": "feedback text" }`

## Deployment Guidance

### Frontend

- Deploy `client` to Vercel or Netlify.
- Set `REACT_APP_API_URL` to your deployed backend URL (for production).

### Backend

- Deploy `server` to Render, Railway, or Fly.io.
- Set env vars:
  - `OPENROUTER_BASE_URL`
  - `OPENROUTER_MODEL`
  - `OPENROUTER_API_KEY`
  - `PORT` (platform-provided if required)

### Full Production Flow

Frontend -> `api.js` -> Backend Express API -> OpenRouter -> Response -> UI

// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// In-memory history (could be replaced with DB)
const promptHistory = [];

// Simple middleware to attach history to request
app.use((req, res, next) => {
  req.promptHistory = promptHistory;
  next();
});

// Route handlers
const promptRouter = require('./routes/prompt');
app.use('/', promptRouter);

app.listen(port, () => {
  console.log(`PromptCraft AI backend listening on port ${port}`);
});

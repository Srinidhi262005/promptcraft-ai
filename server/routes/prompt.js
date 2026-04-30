const express = require('express');
const router = express.Router();
const { z } = require('zod');

function debugLog(hypothesisId, location, message, data = {}) {
  // #region agent log
  fetch('http://127.0.0.1:7383/ingest/49cae652-fb53-4435-a7d8-84a32192deb8', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a05d4d' },
    body: JSON.stringify({
      sessionId: 'a05d4d',
      runId: 'switch-openrouter',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

const promptSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

function sendSuccess(res, payload, status = 200) {
  return res.status(status).json({
    success: true,
    data: payload,
  });
}

function sendError(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: details || null,
    },
  });
}

function toPublicError(error) {
  const message = String(error?.message || 'Unknown error');
  debugLog('H4', 'server/routes/prompt.js:23', 'Mapping public error', {
    message,
  });

  if (message.toLowerCase().includes('api key')) {
    return {
      status: 401,
      code: 'AUTH_MISSING_KEY',
      error: 'Missing or invalid provider API key. Set OPENROUTER_API_KEY in server/.env.',
      details: message,
    };
  }

  if (message.toLowerCase().includes('failed to fetch')) {
    return {
      status: 500,
      code: 'PROVIDER_UNREACHABLE',
      error:
        'Cannot reach hosted model API. Check internet access and OPENROUTER_BASE_URL.',
      details: message,
    };
  }

  return {
    status: 500,
    code: 'PROVIDER_ERROR',
    error: 'AI request failed. Check backend logs and provider settings.',
    details: message,
  };
}

async function callProvider(systemPrompt, userPrompt) {
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
  const apiKey = process.env.OPENROUTER_API_KEY;

  debugLog('H1', 'server/routes/prompt.js:58', 'Provider config selected', {
    baseUrl,
    model,
    hasApiKey: Boolean(apiKey),
  });

  if (!apiKey) {
    throw new Error('OpenRouter API key missing');
  }

  const maxAttempts = 2;
  let response = null;
  let data = {};
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      try {
        data = await response.json();
        debugLog('H3', 'server/routes/prompt.js:131', 'Provider response parsed', {
          ok: response.ok,
          status: response.status,
          hasChoices: Array.isArray(data?.choices),
          attempt,
        });
      } catch {
        debugLog('H3', 'server/routes/prompt.js:139', 'Provider returned non-JSON', {
          ok: response.ok,
          status: response.status,
          attempt,
        });
      }

      clearTimeout(timeout);
      break;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      debugLog('H6', 'server/routes/prompt.js:150', 'Provider request attempt failed', {
        attempt,
        errorName: String(error?.name || ''),
        errorMessage: String(error?.message || ''),
      });
      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }

  if (!response && lastError) {
    throw lastError;
  }

  if (!response.ok) {
    const detail =
      data?.error?.message || data?.error || `Provider request failed with status ${response.status}`;
    throw new Error(String(detail));
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Provider returned an empty response.');
  }

  return content.trim();
}

function localImprovePrompt(rawPrompt) {
  const clean = rawPrompt.trim();
  return [
    'Role:',
    'You are an expert assistant for this domain.',
    '',
    'Task:',
    clean,
    '',
    'Constraints:',
    '- Be specific and actionable',
    '- Include assumptions if context is missing',
    '- Keep the answer clear and structured',
    '',
    'Output Format:',
    '- Short summary',
    '- Step-by-step response',
    '- Final recommendations',
  ].join('\n');
}

function localAnalyzePrompt(rawPrompt) {
  const text = rawPrompt.trim();
  const lower = text.toLowerCase();
  const suggestions = [];

  if (!/(act as|you are|role)/.test(lower)) {
    suggestions.push('Missing clear role (who the AI should act as).');
  }
  if (text.length < 30) {
    suggestions.push('Prompt is short; add more context and goals.');
  }
  if (!/(format|table|json|bullet|steps)/.test(lower)) {
    suggestions.push('Missing output format instruction.');
  }
  if (!/(limit|constraint|avoid|must|should)/.test(lower)) {
    suggestions.push('Missing constraints and quality boundaries.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Prompt is fairly clear. Add examples for even better results.');
  }

  return ['Prompt Analysis:', ...suggestions.map((s, i) => `${i + 1}. ${s}`)].join('\n');
}

router.post('/improve-prompt', async (req, res) => {
  try {
    const validated = promptSchema.safeParse(req.body || {});
    if (!validated.success) {
      debugLog('H7', 'server/routes/prompt.js:190', 'Validation failed on improve', {
        issues: validated.error.issues.length,
      });
      return sendError(res, 400, 'VALIDATION_ERROR', 'Please provide a valid prompt.');
    }
    const prompt = validated.data.prompt;

    debugLog('H2', 'server/routes/prompt.js:121', 'Improve endpoint input received', {
      hasPrompt: Boolean(prompt?.trim()),
      promptLength: String(prompt || '').length,
    });

    let improved = '';
    try {
      improved = await callProvider(
        'Act as an expert prompt engineer. Improve the given prompt by adding role, task, constraints, and output format in a professional structure.',
        prompt.trim()
      );
    } catch (providerError) {
      if (String(providerError?.message || '').toLowerCase().includes('api key missing')) {
        debugLog('H5', 'server/routes/prompt.js:181', 'Using local improve fallback', {
          reason: 'missing_api_key',
        });
        improved = localImprovePrompt(prompt);
      } else {
        throw providerError;
      }
    }

    // Store in history if needed (req.promptHistory is attached via middleware in index.js)
    if (req.promptHistory) {
      req.promptHistory.push({ original: prompt, improved, timestamp: new Date() });
    }

    return sendSuccess(res, { improved });
  } catch (error) {
    console.error('Error improving prompt with provider:', error.message);
    const publicErr = toPublicError(error);
    return sendError(
      res,
      publicErr.status,
      publicErr.code,
      publicErr.error,
      publicErr.details
    );
  }
});

// Optional analyze-prompt route for the frontend functionality
router.post('/analyze-prompt', async (req, res) => {
    try {
      const validated = promptSchema.safeParse(req.body || {});
      if (!validated.success) {
        debugLog('H7', 'server/routes/prompt.js:239', 'Validation failed on analyze', {
          issues: validated.error.issues.length,
        });
        return sendError(res, 400, 'VALIDATION_ERROR', 'Please provide a valid prompt.');
      }
      const prompt = validated.data.prompt;

      debugLog('H2', 'server/routes/prompt.js:153', 'Analyze endpoint input received', {
        hasPrompt: Boolean(prompt?.trim()),
        promptLength: String(prompt || '').length,
      });

      let analysis = '';
      try {
        analysis = await callProvider(
          'Act as an expert prompt engineer. Analyze the given prompt and identify missing pieces: role, task clarity, constraints, context, and desired output format. Return concise improvement suggestions.',
          prompt.trim()
        );
      } catch (providerError) {
        if (String(providerError?.message || '').toLowerCase().includes('api key missing')) {
          debugLog('H5', 'server/routes/prompt.js:221', 'Using local analyze fallback', {
            reason: 'missing_api_key',
          });
          analysis = localAnalyzePrompt(prompt);
        } else {
          throw providerError;
        }
      }

      return sendSuccess(res, { analysis });
    } catch (error) {
      console.error('Error analyzing prompt with provider:', error.message);
      const publicErr = toPublicError(error);
      return sendError(
        res,
        publicErr.status,
        publicErr.code,
        publicErr.error,
        publicErr.details
      );
    }
  });

module.exports = router;

const ApiError = require('../utils/ApiError');

// Timeout configuration
const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 60000;
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Returns a list of candidate models to try in order.
 * This list is designed to bypass known broken/invalid model configurations and fall back dynamically.
 */
const getModelCandidates = () => {
  const models = [];

  // 1. User-configured model from environment (if valid and not known-broken)
  if (process.env.OPENROUTER_MODEL) {
    const envModel = process.env.OPENROUTER_MODEL.trim();
    if (envModel && envModel !== 'meta-llama/llama-4-scout:free') {
      models.push(envModel);
    }
  }

  // 2. OpenRouter free model router (highly reliable dynamic free model selector)
  models.push('openrouter/free');

  // 3. Specific stable free models if the router has issues
  models.push('meta-llama/llama-3.3-70b-instruct:free');
  models.push('google/gemma-4-31b-it:free');
  models.push('meta-llama/llama-3.2-3b-instruct:free');

  // Remove any duplicates
  return Array.from(new Set(models));
};

const buildSystemPrompt = () => `You are an expert municipal complaint triage assistant.

You MUST respond with valid JSON only – no markdown, no explanation, no code fences.
Use this exact shape:
{"priority":"Low|Medium|High","department":"string","summary":"string","autoResponse":"string"}

Rules:
- High: safety, outages, emergencies, severe infrastructure failure
- Medium: service disruption, moderate public impact
- Low: minor issues, cosmetic problems, low urgency
- department: best matching department (Public Works, Water & Sanitation, Electricity, Health & Safety, Traffic & Transport, Environment, IT & Digital Services, Customer Support, General Administration)
- summary: 1-2 concise sentences
- autoResponse: professional empathetic reply (3-5 sentences)

Respond with ONLY the JSON object. No other text.`;

const parseAnalysisJson = (rawContent) => {
  // Strip markdown fences and extra whitespace
  let cleaned = rawContent.trim();

  // Find first '{' and last '}' to extract JSON block in case model outputs text outside code blocks
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  } else {
    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  const parsed = JSON.parse(cleaned);
  const { priority, department, summary, autoResponse } = parsed;

  if (!priority || !VALID_PRIORITIES.includes(priority)) {
    throw new ApiError(502, 'AI response missing or invalid priority field');
  }
  if (!department?.trim() || !summary?.trim() || !autoResponse?.trim()) {
    throw new ApiError(502, 'AI response missing required fields');
  }

  return {
    priority,
    department: department.trim(),
    summary: summary.trim(),
    autoResponse: autoResponse.trim(),
  };
};

/**
 * Call OpenRouter with a specific model. Returns parsed analysis or throws.
 */
const callOpenRouter = async ({ model, title, description, category, apiKey, baseURL, timeoutMs }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const appUrl = process.env.APP_URL || 'http://localhost:5000';

  console.log(`[AI] Calling model: ${model} (timeout: ${timeoutMs}ms)`);
  const startTime = Date.now();

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': appUrl,
        'X-Title': 'Smart Complaint Management API',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          {
            role: 'user',
            content: `Category: ${category}\nTitle: ${title}\nDescription: ${description}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI] Response status: ${response.status} (${elapsed}ms)`);

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[AI] Failed to parse JSON response:', parseErr.message);
      }
    } else {
      const text = await response.text();
      console.warn('[AI] Non-JSON response received (first 200 chars):', text.substring(0, 200));
    }

    if (!response.ok) {
      console.error(`[AI] Error from ${model}:`, JSON.stringify(data?.error || data || 'Unknown Error'));
      if (response.status === 401 || response.status === 403) {
        throw new ApiError(401, 'AI authentication failed. Check OPENROUTER_API_KEY.');
      }
      if (response.status === 429) {
        throw new ApiError(429, 'AI rate limit exceeded. Try again later.');
      }
      throw new ApiError(502, data?.error?.message || `AI service request failed with status ${response.status}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    console.log(`[AI] Raw content (first 300 chars):`, content?.substring(0, 300));

    if (!content) {
      throw new ApiError(502, 'AI returned an empty response');
    }

    return parseAnalysisJson(content);
  } finally {
    clearTimeout(timeoutId);
  }
};

const analyzeComplaint = async ({ title, description, category }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  if (!apiKey) {
    throw new ApiError(503, 'AI service is not configured. Set OPENROUTER_API_KEY in .env');
  }

  const opts = { title, description, category, apiKey, baseURL };
  const models = getModelCandidates();
  console.log(`[AI] Candidate models to try: ${models.join(', ')}`);

  let lastError = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await callOpenRouter({ ...opts, model, timeoutMs: AI_TIMEOUT_MS });
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Model ${model} failed: ${err.message}`);

      // If it is a client-side/auth config issue (unrelated to the model itself), fail early
      if (err instanceof ApiError && [401, 403, 503].includes(err.statusCode)) {
        throw err;
      }
    }
  }

  // If we exhausted all models, handle the final error
  console.error('[AI] All candidate models failed to analyze complaint.');
  if (lastError instanceof ApiError) {
    throw lastError;
  }
  if (lastError && lastError.name === 'AbortError') {
    throw new ApiError(504, 'AI analysis timed out. Please try again.');
  }
  if (lastError instanceof SyntaxError) {
    throw new ApiError(502, 'AI returned an invalid response format');
  }
  throw new ApiError(502, lastError?.message || 'Failed to analyze complaint with AI');
};

module.exports = { analyzeComplaint };

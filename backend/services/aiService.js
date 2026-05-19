const ApiError = require('../utils/ApiError');

// Primary free model – good at instruction-following & JSON output
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout:free';
// Fallback model if primary fails / hangs
const FALLBACK_MODEL = 'google/gemma-3-12b-it:free';

const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 60000;
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

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
  const cleaned = rawContent
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed = JSON.parse(cleaned);
  const { priority, department, summary, autoResponse } = parsed;

  if (!VALID_PRIORITIES.includes(priority)) {
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
        // NOTE: response_format omitted – many free models don't support it
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

    const data = await response.json();

    if (!response.ok) {
      console.error(`[AI] Error from ${model}:`, JSON.stringify(data?.error || data));
      if (response.status === 401 || response.status === 403) {
        throw new ApiError(502, 'AI authentication failed. Check OPENROUTER_API_KEY.');
      }
      if (response.status === 429) {
        throw new ApiError(503, 'AI rate limit exceeded. Try again later.');
      }
      throw new ApiError(502, data?.error?.message || 'AI service request failed');
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

  // Try primary model first
  try {
    return await callOpenRouter({ ...opts, model: PRIMARY_MODEL, timeoutMs: AI_TIMEOUT_MS });
  } catch (primaryError) {
    // If it's a client-side config error, don't bother retrying with fallback
    if (primaryError instanceof ApiError && [401, 403, 503].includes(primaryError.statusCode)) {
      throw primaryError;
    }

    console.warn(`[AI] Primary model (${PRIMARY_MODEL}) failed: ${primaryError.message}`);
    console.log(`[AI] Trying fallback model: ${FALLBACK_MODEL}`);

    // Try fallback model
    try {
      return await callOpenRouter({ ...opts, model: FALLBACK_MODEL, timeoutMs: AI_TIMEOUT_MS });
    } catch (fallbackError) {
      console.error(`[AI] Fallback model (${FALLBACK_MODEL}) also failed: ${fallbackError.message}`);

      // Return the most meaningful error
      if (fallbackError instanceof ApiError) throw fallbackError;
      if (primaryError instanceof ApiError) throw primaryError;

      if (fallbackError.name === 'AbortError' || primaryError.name === 'AbortError') {
        throw new ApiError(504, 'AI analysis timed out after trying multiple models. Please try again.');
      }
      if (fallbackError instanceof SyntaxError) {
        throw new ApiError(502, 'AI returned an invalid response format');
      }
      throw new ApiError(502, fallbackError.message || 'Failed to analyze complaint');
    }
  }
};

module.exports = { analyzeComplaint };

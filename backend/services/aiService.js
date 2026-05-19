const ApiError = require('../utils/ApiError');

// Free model on OpenRouter (no credits needed). Override in .env: OPENROUTER_MODEL=openai/gpt-4.1-mini
const AI_MODEL = process.env.OPENROUTER_MODEL || 'baidu/cobuddy:free';
const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000;
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

const buildSystemPrompt = () => `You are an expert municipal complaint triage assistant.

Return valid JSON only with this exact shape:
{"priority":"Low|Medium|High","department":"string","summary":"string","autoResponse":"string"}

Rules:
- High: safety, outages, emergencies, severe infrastructure failure
- Medium: service disruption, moderate public impact
- Low: minor issues, cosmetic problems, low urgency
- department: best matching department (Public Works, Water & Sanitation, Electricity, Health & Safety, Traffic & Transport, Environment, IT & Digital Services, Customer Support, General Administration)
- summary: 1-2 concise sentences
- autoResponse: professional empathetic reply (3-5 sentences)`;

const parseAnalysisJson = (rawContent) => {
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

const analyzeComplaint = async ({ title, description, category }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  if (!apiKey) {
    throw new ApiError(503, 'AI service is not configured. Set OPENROUTER_API_KEY in .env');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
        'X-Title': 'Smart Complaint Management API',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
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

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ApiError(502, 'AI authentication failed. Check OPENROUTER_API_KEY.');
      }
      if (response.status === 429) {
        throw new ApiError(503, 'AI rate limit exceeded. Try again later.');
      }
      throw new ApiError(502, data?.error?.message || 'AI service request failed');
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new ApiError(502, 'AI returned an empty response');
    }

    return parseAnalysisJson(content);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'AI analysis timed out. Please try again.');
    }
    if (error instanceof SyntaxError) {
      throw new ApiError(502, 'AI returned an invalid response format');
    }
    throw new ApiError(502, error.message || 'Failed to analyze complaint');
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = { analyzeComplaint };

import env from '../config/env.js';
import { buildChallengeGenerationPrompt, buildChatSystemPrompt, buildTranslationPrompt } from './aiPromptService.js';

const categoryRules = {
  EDUCATION: ['school', 'college', 'student', 'teacher', 'education', 'learning', 'classroom', 'library'],
  HEALTHCARE: ['hospital', 'health', 'doctor', 'medicine', 'clinic', 'patient', 'ambulance'],
  AGRICULTURE: ['farmer', 'farming', 'crop', 'agriculture', 'irrigation', 'soil', 'seed'],
  WATER: ['water', 'drinking water', 'well', 'river', 'pipeline', 'irrigation', 'water supply'],
  SANITATION: ['toilet', 'waste', 'garbage', 'drainage', 'sanitation', 'sewer'],
  ENVIRONMENT: ['pollution', 'forest', 'environment', 'plastic', 'air pollution', 'climate'],
  ENERGY: ['electricity', 'solar', 'energy', 'power', 'street light'],
  TRANSPORT: ['road', 'traffic', 'transport', 'bus', 'bridge', 'vehicle'],
  ACCESSIBILITY: ['disabled', 'wheelchair', 'accessibility', 'blind', 'barrier'],
  RURAL_LIVELIHOOD: ['livelihood', 'employment', 'income', 'village', 'rural', 'job'],
};

const expertiseMap = {
  WATER: ['Civil Engineering', 'Environmental Engineering', 'IoT', 'Water Technology'],
  AGRICULTURE: ['Agricultural Engineering', 'IoT', 'AI/ML', 'Environmental Science'],
  HEALTHCARE: ['Healthcare Technology', 'Computer Science', 'Biomedical Engineering', 'Data Science'],
  EDUCATION: ['Computer Science', 'Education Technology', 'AI/ML', 'Psychology'],
  ENERGY: ['Electrical Engineering', 'Renewable Energy', 'IoT', 'Energy Management'],
  ENVIRONMENT: ['Environmental Science', 'Civil Engineering', 'Data Science', 'Renewable Energy'],
  SANITATION: ['Civil Engineering', 'Environmental Engineering', 'Public Health'],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAIConfig = () => ({
  provider: String(env.ai?.provider || process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  apiKey: env.ai?.apiKey || '',
  model: env.ai?.model || process.env.AI_MODEL || 'gemini-3.6-flash',
});

const fetchWithTimeout = async (url, options, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const callGemini = async ({ system, messages, model, apiKey }) => {
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(message.content || '') }],
  }));

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.45 },
      }),
    },
    env.ai.timeoutMs,
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'AI provider request failed.');
    error.status = response.status;
    throw error;
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) throw new Error('AI provider returned an empty response.');
  return text.trim();
};

const callOpenAI = async ({ system, messages, model, apiKey }) => {
  const input = [
    { role: 'system', content: system },
    ...messages.map((message) => ({ role: message.role, content: String(message.content || '') })),
  ];

  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input, store: false }),
  }, env.ai.timeoutMs);

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'AI provider request failed.');
    error.status = response.status;
    throw error;
  }

  const text = payload?.output_text || payload?.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('') || '';
  if (!text) throw new Error('AI provider returned an empty response.');
  return text.trim();
};

export const isAIConfigured = () => Boolean(getAIConfig().apiKey);

export const generateText = async ({ system, messages, retries = 1 }) => {
  const { provider, apiKey, model } = getAIConfig();
  if (!apiKey) {
    const error = new Error('AI provider is not configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (provider === 'openai') return await callOpenAI({ system, messages, model, apiKey });
      if (provider === 'gemini') return await callGemini({ system, messages, model, apiKey });
      const error = new Error(`Unsupported AI provider: ${provider}`);
      error.code = 'AI_PROVIDER_UNSUPPORTED';
      throw error;
    } catch (error) {
      lastError = error;
      const retryable = !error.status || error.status === 408 || error.status === 429 || error.status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(350 * 2 ** attempt);
    }
  }
  throw lastError;
};

const extractJson = (text) => {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned an invalid structured response.');
  return JSON.parse(match[0]);
};

export const generateChallengeDraft = async ({ problem, role }) => {
  const text = await generateText({
    system: 'You generate accurate civic challenge drafts. Follow the JSON-only instruction in the user prompt.',
    messages: [{ role: 'user', content: buildChallengeGenerationPrompt({ problem, role }) }],
  });
  const draft = extractJson(text);
  return {
    title: String(draft.title || '').trim(),
    description: String(draft.description || '').trim(),
    expectedSolution: String(draft.expectedSolution || '').trim(),
  };
};

export const translateAIResponse = async ({ text, targetLanguage }) => {
  const result = await generateText({
    system: 'You are a precise translator for the Societal Innovation AI Assistant. Preserve meaning and formatting.',
    messages: [{ role: 'user', content: buildTranslationPrompt({ text, targetLanguage }) }],
    retries: 1,
  });
  return result;
};

export const generateChatResponse = async ({ role, context, history, message }) => {
  const safeHistory = Array.isArray(history)
    ? history.slice(-12).map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content || '').slice(0, 2200),
      }))
    : [];
  safeHistory.push({ role: 'user', content: String(message || '').slice(0, 4000) });

  return generateText({
    system: buildChatSystemPrompt({ role, context }),
    messages: safeHistory,
    retries: 1,
  });
};

export const analyzeProblem = async ({ title, description, category }) => {
  const text = `${title} ${description}`.toLowerCase();
  let detectedCategory = category;
  if (!detectedCategory || detectedCategory === 'OTHER') {
    let bestCategory = 'OTHER';
    let bestScore = 0;
    for (const [key, keywords] of Object.entries(categoryRules)) {
      const score = keywords.reduce((total, keyword) => total + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; bestCategory = key; }
    }
    detectedCategory = bestCategory;
  }
  const urgentWords = ['emergency', 'critical', 'death', 'danger', 'immediate', 'severe', 'urgent', 'life threatening'];
  const highWords = ['shortage', 'unsafe', 'serious', 'major', 'problem'];
  const urgentScore = urgentWords.filter((word) => text.includes(word)).length;
  const highScore = highWords.filter((word) => text.includes(word)).length;
  let priority = 'MEDIUM';
  if (urgentScore >= 2) priority = 'CRITICAL';
  else if (urgentScore === 1 || highScore >= 2) priority = 'HIGH';
  else if (highScore === 0) priority = 'LOW';
  const keywords = [...new Set(text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter((word) => word.length > 4))].slice(0, 12);
  const requiredExpertise = expertiseMap[detectedCategory] || ['Technology', 'Innovation', 'Research'];
  const confidence = Math.min(98, 65 + Math.min(keywords.length * 2, 20) + (detectedCategory !== 'OTHER' ? 10 : 0));
  return {
    category: detectedCategory,
    priority,
    confidence,
    keywords,
    requiredExpertise,
    reasoning: `The challenge was classified under ${detectedCategory} based on its description, detected keywords and domain indicators.`,
    analyzedAt: new Date(),
  };
};


export const generateUniversityMatchSummary = async ({ problem, matches }) => {
  const compactMatches = (Array.isArray(matches) ? matches : []).slice(0, 5).map((match) => ({
    university: match.university?.name,
    score: match.score,
    factors: (match.factors || []).map((factor) => ({
      label: factor.label,
      score: factor.score,
      matches: (factor.matches || []).slice(0, 4),
    })),
    reasons: (match.reasons || []).slice(0, 6),
  }));

  return generateText({
    system:
      "You are a civic innovation matching assistant. Use only the supplied deterministic scores and profile matches. Do not invent university capabilities. Return concise plain text with a recommended university, its score, and two or three evidence-based reasons. Mention that the percentage comes from deterministic profile matching, while your text is an explanation.",
    messages: [{
      role: "user",
      content: JSON.stringify({
        problem: {
          title: problem?.title,
          category: problem?.category,
          description: problem?.description,
          requiredExpertise: problem?.aiAnalysis?.requiredExpertise || [],
          keywords: problem?.aiAnalysis?.keywords || [],
        },
        matches: compactMatches,
      }),
    }],
    retries: 1,
  });
};

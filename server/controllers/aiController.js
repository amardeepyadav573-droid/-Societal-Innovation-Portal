import asyncHandler from '../utils/asyncHandler.js';
import { buildAIContext } from '../services/aiContextService.js';
import {
  generateChatResponse,
  generateChallengeDraft,
  generateUniversityMatchSummary,
  isAIConfigured,
  translateAIResponse,
} from '../services/aiService.js';
import Problem from '../models/Problem.js';

const friendlyAIError = (error) => {
  if (error?.code === 'AI_NOT_CONFIGURED') return 'The AI assistant is not configured on the server yet.';
  if (error?.status === 429) return 'The AI is temporarily busy. Please try again in a moment.';
  if (error?.status === 408 || error?.name === 'AbortError') return 'The AI took too long to respond. Please try again.';
  return 'The AI is temporarily unavailable. Please try again.';
};

export const chat = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ success: false, message: friendlyAIError({ code: 'AI_NOT_CONFIGURED' }) });
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });
  if (message.length > 4000) return res.status(400).json({ success: false, message: 'Message is too long.' });

  const context = await buildAIContext({
    user: req.user,
    currentPage: req.body?.context?.currentPage || '',
    challengeId: req.body?.context?.challengeId || '',
  });

  const response = await generateChatResponse({
    role: req.user.role,
    context,
    history: req.body?.history,
    message,
  });

  res.json({ success: true, data: { message: response, context } });
});

export const generateChallenge = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ success: false, message: friendlyAIError({ code: 'AI_NOT_CONFIGURED' }) });
  const problem = String(req.body?.problem || '').trim();
  if (!problem) return res.status(400).json({ success: false, message: 'Please describe your problem first.' });
  if (problem.length > 6000) return res.status(400).json({ success: false, message: 'Problem description is too long.' });

  const draft = await generateChallengeDraft({ problem, role: req.user.role });
  if (!draft.title || !draft.description) return res.status(502).json({ success: false, message: 'The AI returned an incomplete challenge draft. Please try again.' });
  res.json({ success: true, data: { draft } });
});

export const translate = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ success: false, message: friendlyAIError({ code: 'AI_NOT_CONFIGURED' }) });
  const text = String(req.body?.text || '').trim();
  const targetLanguage = req.body?.targetLanguage === 'hi' ? 'hi' : 'en';
  if (!text) return res.status(400).json({ success: false, message: 'Text is required.' });
  if (text.length > 7000) return res.status(400).json({ success: false, message: 'Response is too long to translate.' });
  const translated = await translateAIResponse({ text, targetLanguage });
  res.json({ success: true, data: { translated, targetLanguage } });
});


export const summarizeUniversityMatches = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) {
    return res.status(503).json({
      success: false,
      message: friendlyAIError({ code: 'AI_NOT_CONFIGURED' }),
    });
  }

  const problemId = String(req.body?.problemId || '');
  const matches = Array.isArray(req.body?.matches) ? req.body.matches : [];
  if (!problemId || !matches.length) {
    return res.status(400).json({
      success: false,
      message: 'A problemId and ranked university matches are required.',
    });
  }

  const problem = await Problem.findById(problemId)
    .select('title description category aiAnalysis')
    .lean();
  if (!problem) {
    return res.status(404).json({ success: false, message: 'Problem not found.' });
  }

  const summary = await generateUniversityMatchSummary({ problem, matches });
  res.json({ success: true, data: { summary } });
});

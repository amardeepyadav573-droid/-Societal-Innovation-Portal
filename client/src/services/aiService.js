import api from './api';

const unwrap = (response) => response?.data || {};

const aiService = {
  chat: async ({ message, history = [], context = {} }) => {
    const response = await api.post('/ai/chat', { message, history, context });
    const data = unwrap(response);
    return data?.data || data;
  },

  generateChallenge: async (problem) => {
    const response = await api.post('/ai/generate-challenge', { problem });
    const data = unwrap(response);
    return data?.data?.draft || data?.draft || {};
  },

  summarizeUniversityMatches: async (problemId, matches) => {
    const response = await api.post('/ai/university-matches/summary', {
      problemId,
      matches,
    });
    const data = unwrap(response);
    return data?.data?.summary || data?.summary || '';
  },

  translate: async (text, targetLanguage) => {
    const response = await api.post('/ai/translate', { text, targetLanguage });
    const data = unwrap(response);
    return data?.data?.translated || data?.translated || '';
  },
};

export default aiService;

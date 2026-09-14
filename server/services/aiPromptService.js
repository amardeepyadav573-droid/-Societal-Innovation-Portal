import { ROLE_GUIDANCE, SOCIETAL_INNOVATION_KNOWLEDGE } from './aiKnowledgeBase.js';

const trimText = (value, max = 4000) => String(value || '').trim().slice(0, max);

export const buildChatSystemPrompt = ({ role, context }) => {
  const normalizedRole = String(role || 'CITIZEN').toUpperCase();
  const roleGuidance = ROLE_GUIDANCE[normalizedRole] || ROLE_GUIDANCE.CITIZEN;

  return `${SOCIETAL_INNOVATION_KNOWLEDGE}\n\nROLE GUIDANCE:\n${roleGuidance}\n\nCURRENT APPLICATION CONTEXT (authoritative when present):\n${JSON.stringify(context || {}, null, 2)}\n\nResponse rules:\n- Directly answer the user's latest message.\n- Use conversation context naturally.\n- If the user asks “how do I”, give concrete steps using the actual route/feature names supplied by context.\n- If data is unavailable, say so instead of guessing.\n- Keep simple answers to roughly 1–4 short paragraphs.\n- For complex answers use Markdown headings, bullets or numbered steps only when helpful.\n- Do not begin every answer with “Certainly” or similar filler.\n- If the user is just greeting or making small talk, respond naturally and briefly.\n`;
};

export const buildChallengeGenerationPrompt = ({ problem, role = 'CITIZEN' }) => `
${SOCIETAL_INNOVATION_KNOWLEDGE}

You are generating a draft challenge for a citizen. The citizen's original problem is below.
ROLE: ${role}
ORIGINAL PROBLEM:
${trimText(problem, 6000)}

Return ONLY valid JSON with exactly these string fields:
{
  "title": "",
  "description": "",
  "expectedSolution": ""
}

Rules:
- Preserve the original meaning.
- Title must be concise, professional and suitable for a civic/social innovation challenge.
- Description should explain the problem, affected people/community, current situation, observed difficulty, possible causes and impact only when supported by the user's text. Use cautious general wording where facts are missing.
- Never invent statistics, population numbers, percentages, locations, money, government data, research findings or other facts.
- expectedSolution is a practical AI-suggested direction, not a guarantee or verified official solution. It may mention technology/community/government/industry involvement as possibilities, but must not claim approval or availability.
- If the original problem contains little detail, write a useful but conservative draft rather than asking follow-up questions.
- Do not add facts merely because they sound plausible.
`;

export const buildTranslationPrompt = ({ text, targetLanguage }) => `
Translate the following Societal Innovation AI response into ${targetLanguage === 'hi' ? 'Hindi' : 'English'}.
Preserve meaning, Markdown structure, names, numbers, links/routes and technical terms where appropriate. Do not add new information.
Return only the translated text.

TEXT:
${trimText(text, 7000)}
`;

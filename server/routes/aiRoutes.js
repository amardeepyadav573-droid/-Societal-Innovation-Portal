import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { chat, generateChallenge, summarizeUniversityMatches, translate } from '../controllers/aiController.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id ? String(req.user._id) : ipKeyGenerator(req.ip),
  message: { success: false, message: 'The AI assistant is receiving too many requests. Please wait a moment.' },
});

router.use(protect, aiLimiter);
router.post('/chat', chat);
router.post('/generate-challenge', generateChallenge);
router.post('/translate', translate);
router.post('/university-matches/summary', summarizeUniversityMatches);

export default router;

import express from 'express';
import { generateQuiz } from '../controllers/ai.controllers.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/ai/generate-quiz
router.post('/generate-quiz', protect, authorizeRoles('teacher'), generateQuiz);

export default router;
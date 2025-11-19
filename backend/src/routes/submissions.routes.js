import express from 'express';
import { createSubmission,submitQuiz } from '../controllers/submissions.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(protect);

// Chỉ học viên mới có thể nộp bài
router.post('/', authorizeRoles('student'), createSubmission);
router.post('/quiz', authorizeRoles('student'), submitQuiz);

export default router;
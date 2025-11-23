import express from 'express';
import { createSubmission,submitQuiz,submitSpeaking } from '../controllers/submissions.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';
import { lessonStorage } from '../config/cloudinary.js';
import multer from 'multer';

const upload = multer({ storage: lessonStorage });


const router = express.Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(protect);

// Chỉ học viên mới có thể nộp bài
router.post('/', authorizeRoles('student'), createSubmission);
    // Logic xử lý nộp bài Quiz và chấm điểm tự động
router.post('/quiz', authorizeRoles('student'), submitQuiz);
// Logic xử lý nộp bài Speaking với upload file
router.post('/speaking', protect, authorizeRoles('student'), upload.any(), submitSpeaking);

export default router;
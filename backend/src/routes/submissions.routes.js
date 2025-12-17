import express from 'express';
import { 
    createSubmission, 
    submitQuiz, 
    submitSpeaking, 
    getSubmissionById,
    gradeSubmission,
    getMySubmissionHistory,
    getMySubmissionByLesson,
    getSubmissionHistoryByLesson
} from '../controllers/submissions.controller.js';

import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { lessonStorage } from '../config/cloudinary.js';
import multer from 'multer';

const upload = multer({ storage: lessonStorage });

const router = express.Router();

// --- MIDDLEWARE CHUNG ---
// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(protect);

// --- STUDENT ROUTES ---
// 1. Nộp bài tập thường (Text/File link)
router.post('/', authorizeRoles('student'), createSubmission);

// 2. Nộp bài Quiz (Chấm điểm tự động)
router.post('/quiz', authorizeRoles('student'), submitQuiz);

// 3. Nộp bài Speaking (Upload audio lên Cloudinary)
router.post('/speaking', authorizeRoles('student'), upload.any(), submitSpeaking);

// 4. Xem lịch sử làm bài Quiz của bản thân
router.get('/my-quiz-history', authorizeRoles('student'), getMySubmissionHistory);
router.get('/my-submission/:lessonId', protect, getMySubmissionByLesson);
router.get('/history/:lessonId', protect, getSubmissionHistoryByLesson);



// --- TEACHER ROUTES ---
// 5. Lấy chi tiết một bài nộp để chấm điểm
// (Cho phép cả admin và teacher truy cập)
router.get('/:id', protect, getSubmissionById);

// 6. Gửi kết quả chấm điểm (Score & Feedback)
router.post('/:id/grade', authorizeRoles('teacher', 'admin'), gradeSubmission);

export default router;
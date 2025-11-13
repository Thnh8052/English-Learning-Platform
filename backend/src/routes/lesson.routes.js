import express from "express";
import multer from 'multer';
import { lessonStorage } from '../config/cloudinary.js';
import { getLessonsByCourse,createLesson,updateLesson,deleteLesson,getLessonById   } from "../controllers/lesson.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";


const router = express.Router();
const upload = multer({ storage: lessonStorage });
router.use(protect);
// GET /api/lessons/:id -> Lấy thông tin bài học theo ID
router.get('/:id', getLessonById);

// GET /api/lessons/course/:courseId -> Lấy tất cả bài học trong một khóa học
router.get('/course/:courseId', getLessonsByCourse);

// POST /api/lessons -> Tạo bài học mới (chỉ giáo viên)
router.post('/', protect, authorizeRoles('teacher'), upload.single('lessonFile'), createLesson);

// PUT /api/lessons/:id -> Cập nhật bài học
router.put("/:id", protect, authorizeRoles('teacher'), updateLesson);

// DELETE /api/lessons/:id -> Xóa bài học
router.delete("/:id", protect, authorizeRoles('teacher'), deleteLesson);


export default router;
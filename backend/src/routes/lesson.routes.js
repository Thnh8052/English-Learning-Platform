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

router.use(protect, authorizeRoles('teacher'));

router.post(
    '/', 
    upload.fields([
        { name: 'promptFile', maxCount: 1 },
        { name: 'lessonFile', maxCount: 1 }
    ]), 
    createLesson
);
router.put('/:id', updateLesson);
router.delete('/:id', deleteLesson);


export default router;
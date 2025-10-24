import express from "express";
import { getLessonsByCourse } from "../controllers/lesson.controller.js";
// import { protect } from "../middleware/auth.middleware.js";
// import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// GET /api/lessons/course/:courseId -> Lấy tất cả bài học trong một khóa học
router.get('/course/:courseId', getLessonsByCourse);

// Thêm các route khác cho lesson ở đây (ví dụ: tạo, sửa, xóa bài học)

export default router;
// src/routes/courses.routes.js

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,        // <-- Import luôn hàm update để dùng sau
  enrollInCourse,
  getMyEnrolledCourses,
  getMyTeachingCourses,
  getCourseContent,
  submitForReview,
  retractCourse,
  deleteCourse,
} from "../controllers/courses.controller.js";

const router = express.Router();


// --- CÁC ROUTE CÓ ĐƯỜNG DẪN CỐ ĐỊNH PHẢI ĐẶT LÊN TRÊN ---

// GET /api/courses -> Lấy tất cả khóa học
router.get('/', getAllCourses); 

// GET /api/courses/my-courses -> Lấy các khóa học đã đăng ký của sinh viên
router.get('/my-courses', protect, authorizeRoles('student'), getMyEnrolledCourses);

// GET /api/courses/my-teaching-courses -> Lấy các khóa học của giáo viên
router.get('/my-teaching-courses', protect, authorizeRoles('teacher'), getMyTeachingCourses);


// --- CÁC ROUTE CÓ ĐƯỜNG DẪN ĐỘNG (VỚI :id) ĐẶT Ở DƯỚI ---
router.get('/:id/content', getCourseContent);//Lấy nội dung khóa học

// GET /api/courses/:id -> Lấy chi tiết một khóa học
router.get('/:id', getCourseById); // Lấy khóa học theo ID

// POST /api/courses/:id/enroll -> Học viên ghi danh
router.post('/:id/enroll', protect, authorizeRoles('student'), enrollInCourse);

// PUT /api/courses/:id -> Giáo viên cập nhật khóa học
router.put('/:id', protect, authorizeRoles('teacher'), updateCourse);

// POST /api/courses/:id/submit-for-review -> Giáo viên gửi khóa học để xem xét
router.post('/:id/submit-for-review', protect, authorizeRoles('teacher'), submitForReview);
// POST /api/courses/:id/retract -> Giáo viên rút lại khóa học từ xem xét
router.post('/:id/retract', protect, authorizeRoles('teacher'), retractCourse);
router.delete('/:id', protect, authorizeRoles('teacher'), deleteCourse);

// --- CÁC ROUTE KHÁC ---

// POST /api/courses -> Giáo viên tạo khóa học mới
router.post('/', protect, authorizeRoles('teacher'), createCourse);




export default router;
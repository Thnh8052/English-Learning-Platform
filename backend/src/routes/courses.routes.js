// src/routes/courses.routes.js

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

import {
  getAllCourses,
  getCourseById,       // <-- BƯỚC 1: IMPORT HÀM MỚI
  createCourse,
  updateCourse,        // <-- Import luôn hàm update để dùng sau
  enrollInCourse,
  getMyEnrolledCourses,
  getMyTeachingCourses,
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

// GET /api/courses/:id -> Lấy chi tiết một khóa học
router.get('/:id', getCourseById); // <-- BƯỚC 2: THÊM ROUTE CÒN THIẾU

// POST /api/courses/:id/enroll -> Học viên ghi danh
router.post('/:id/enroll', protect, authorizeRoles('student'), enrollInCourse);

// PUT /api/courses/:id -> Giáo viên cập nhật khóa học
router.put('/:id', protect, authorizeRoles('teacher'), updateCourse);


// --- CÁC ROUTE KHÁC ---

// POST /api/courses -> Giáo viên tạo khóa học mới
router.post('/', protect, authorizeRoles('teacher'), createCourse);


export default router;
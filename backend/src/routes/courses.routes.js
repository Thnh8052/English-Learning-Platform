// src/routes/courses.routes.js

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getMyTeachingCourses,
  getCourseContent,
  submitForReview,
  retractCourse,
  deleteCourse,
  getCourseDashboard,
  getEnrolledStudents,
  getStudentSubmissionsInCourse,
  removeStudentFromCourse
} from "../controllers/courses.controller.js";
import { getSubmissionsByCourse } from '../controllers/submissions.controller.js';


const router = express.Router();


// --- CÁC ROUTE CÓ ĐƯỜNG DẪN CỐ ĐỊNH PHẢI ĐẶT LÊN TRÊN ---

// GET /api/courses -> Lấy tất cả khóa học
router.get('/', getAllCourses);
// GET /api/courses/:id/content -> Lấy nội dung khóa học
router.get('/:id/content', getCourseContent);

// --- STUDENT ---
router.get('/my-courses', protect, getMyEnrolledCourses);
router.post('/:id/enroll', protect, enrollInCourse);

// --- TEACHER ---
router.post('/', protect, authorizeRoles('teacher'), createCourse);
router.get('/my-teaching-courses', protect, authorizeRoles('teacher'), getMyTeachingCourses);
router.get('/:courseId/students', protect, authorizeRoles('teacher', 'admin'), getEnrolledStudents);
router.get('/:courseId/students/:studentId/submissions', protect, authorizeRoles('teacher', 'admin'), getStudentSubmissionsInCourse);

// GET /api/courses/:id -> Lấy chi tiết một khóa học
router.get('/:id', getCourseById); // Lấy khóa học theo ID

// POST /api/courses/:id/enroll -> Học viên ghi danh
router.post('/:id/enroll', protect, authorizeRoles('student'), enrollInCourse);

// PUT /api/courses/:id -> Giáo viên cập nhật khóa học
router.put('/:id', protect, authorizeRoles('teacher'), updateCourse);

// POST /api/courses/:id/submit-for-review -> Giáo viên gửi khóa học để xem xét
router.post('/:id/submit-for-review', protect, authorizeRoles('teacher'), submitForReview);

// Lấy danh sách bài nộp của khóa học
router.get('/:courseId/submissions', protect, authorizeRoles('teacher'), getSubmissionsByCourse);
router.delete('/:courseId/students/:studentId', protect, authorizeRoles('teacher', 'admin'), removeStudentFromCourse);

// POST /api/courses/:id/retract -> Giáo viên rút lại khóa học từ xem xét
router.post('/:id/retract', protect, authorizeRoles('teacher'), retractCourse);
router.delete('/:id', protect, authorizeRoles('teacher'), deleteCourse);
router.get('/:id/dashboard', protect, authorizeRoles('teacher'), getCourseDashboard);

// --- CÁC ROUTE KHÁC ---

// POST /api/courses -> Giáo viên tạo khóa học mới
router.post('/', protect, authorizeRoles('teacher'), createCourse);




export default router;
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  getAllCourses,
  createCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getMyTeachingCourses
} from "../controllers/courses.controller.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get('/', getAllCourses); // Bất kỳ ai cũng có thể xem danh sách khóa học

// --- STUDENT ROUTES ---
router.get(
    '/my-courses', 
    protect, 
    authorizeRoles('student'), 
    getMyEnrolledCourses
);
router.post(
    '/:id/enroll', 
    protect, 
    authorizeRoles('student'), 
    enrollInCourse
);


// --- TEACHER ROUTES ---
router.post(
    '/', // Trùng với GET all, nhưng method là POST
    protect, 
    authorizeRoles('teacher'), 
    createCourse
);
router.get(
    '/my-teaching-courses',
    protect,
    authorizeRoles('teacher'),
    getMyTeachingCourses
);


export default router;
// src/routes/admin.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";
import { getPendingCourses, getPublishedCourses, getRejectedCourses, approveCourse, requestChanges, rejectCourse   } from '../controllers/admin.controller.js';

const router = express.Router();

// Chỉ admin mới được truy cập các route này
router.use(protect, authorizeRoles('admin'));

router.get('/courses/pending', getPendingCourses);
router.get('/courses/published', getPublishedCourses);
router.get('/courses/rejected', getRejectedCourses);
router.post('/courses/:id/approve', approveCourse);
router.post('/courses/:id/request-changes', requestChanges);
router.put('/courses/:id/reject', rejectCourse);


export default router;
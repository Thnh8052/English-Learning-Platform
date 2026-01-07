// src/routes/courses.routes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

import {
  getAllCourses,
  getHomeCourses,
  getCourseById,
  getCourseContent,
  createCourse,
  updateCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getMyTeachingCourses,
  submitForReview,
  retractCourse,
  deleteCourse,
  getCourseDashboard,
  getEnrolledStudents,
  getStudentSubmissionsInCourse,
  removeStudentFromCourse,
} from "../controllers/courses.controller.js";

import { getSubmissionsByCourse } from "../controllers/submissions.controller.js";

const router = express.Router();

/* =======================
   PUBLIC ROUTES (NO ID)
======================= */
router.get("/home", getHomeCourses);
router.get("/", getAllCourses);

/* =======================
   STUDENT ROUTES (NO ID)
======================= */
router.get("/my-courses", protect, getMyEnrolledCourses);

/* =======================
   TEACHER ROUTES (NO ID)
======================= */
router.get(
  "/my-teaching-courses",
  protect,
  authorizeRoles("teacher"),
  getMyTeachingCourses
);

router.post(
  "/",
  protect,
  authorizeRoles("teacher"),
  createCourse
);

/* =======================
   COURSE-SPECIFIC ROUTES
======================= */
router.get("/:id/content", getCourseContent);
router.get("/:id", getCourseById);

router.post(
  "/:id/enroll",
  protect,
  authorizeRoles("student"),
  enrollInCourse
);

router.put(
  "/:id",
  protect,
  authorizeRoles("teacher"),
  updateCourse
);

router.post(
  "/:id/submit-for-review",
  protect,
  authorizeRoles("teacher"),
  submitForReview
);

router.post(
  "/:id/retract",
  protect,
  authorizeRoles("teacher"),
  retractCourse
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("teacher"),
  deleteCourse
);

router.get(
  "/:id/dashboard",
  protect,
  authorizeRoles("teacher"),
  getCourseDashboard
);

/* =======================
   NESTED COURSE ROUTES
======================= */
router.get(
  "/:id/students",
  protect,
  authorizeRoles("teacher", "admin"),
  getEnrolledStudents
);

router.get(
  "/:id/students/:studentId/submissions",
  protect,
  authorizeRoles("teacher", "admin"),
  getStudentSubmissionsInCourse
);

router.delete(
  "/:id/students/:studentId",
  protect,
  authorizeRoles("teacher", "admin"),
  removeStudentFromCourse
);

router.get(
  "/:id/submissions",
  protect,
  authorizeRoles("teacher"),
  getSubmissionsByCourse
);

export default router;

import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
import { 
    // Course Review Controllers
    getPendingCourses, 
    getPublishedCourses, 
    getRejectedCourses, 
    approveCourse, 
    requestChanges, 
    rejectCourse,
    //User & Enrollment Controllers
    getAllUsers,
    deleteUser,
    getCourseStudents,
    kickStudentFromCourse
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

// --- Course Review Routes ---
router.get('/courses/pending', getPendingCourses);
router.get('/courses/published', getPublishedCourses);
router.get('/courses/rejected', getRejectedCourses);
router.post('/courses/:id/approve', approveCourse);
router.post('/courses/:id/request-changes', requestChanges);
router.put('/courses/:id/reject', rejectCourse);

// User Management Routes ---
router.get('/users', getAllUsers);             
router.delete('/users/:id', deleteUser);       

//Course Enrollment Routes ---
router.get('/courses/:id/students', getCourseStudents); 
router.delete('/courses/:courseId/students/:studentId', kickStudentFromCourse); 

export default router;
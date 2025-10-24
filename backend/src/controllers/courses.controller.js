// src/controllers/courses.controller.js

import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';

// =================================================================
// PUBLIC CONTROLLERS (Bất kỳ ai cũng có thể truy cập)
// =================================================================

/**
 * @desc    Lấy tất cả các khóa học (có thông tin giáo viên)
 * @route   GET /api/courses
 * @access  Public
 */
export const getAllCourses = async (req, res) => {
    try {
        // Sử dụng .populate() để lấy 'name' của giáo viên từ model User
        const courses = await Course.find({}).populate('teacher', 'name');
        res.json(courses);
    } catch (err) {
        console.error("LỖI KHI GET ALL COURSES:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * @desc    Lấy chi tiết một khóa học dựa trên ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('teacher', 'name');

        if (course) {
            res.json(course);
        } else {
            // Trả về 404 nếu không tìm thấy khóa học trong DB
            res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
    } catch (err) {
        console.error("Lỗi khi lấy chi tiết khóa học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// =================================================================
// STUDENT CONTROLLERS
// =================================================================

/**
 * @desc    Sinh viên đăng ký một khóa học
 * @route   POST /api/courses/:id/enroll
 * @access  Private/Student
 */
export const enrollInCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const studentId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Không tìm thấy khóa học" });
        }
        
        const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: "Bạn đã đăng ký khóa học này rồi" });
        }

        const enrollment = new Enrollment({
            student: studentId,
            course: courseId,
        });

        await enrollment.save();
        res.status(201).json({ message: "Đăng ký thành công" });

    } catch (err) {
        console.error("Lỗi khi đăng ký khóa học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * @desc    Lấy các khóa học một sinh viên đã đăng ký
 * @route   GET /api/courses/my-courses
 * @access  Private/Student
 */
export const getMyEnrolledCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id })
            .populate({
                path: 'course', // Populate thông tin khóa học từ Enrollment
                populate: {
                    path: 'teacher', // Populate tiếp thông tin giáo viên từ trong Course
                    select: 'name' // Chỉ lấy tên
                }
            });

        // Trả về một mảng chỉ chứa thông tin các khóa học
        const courses = enrollments.map(enrollment => enrollment.course);
        res.json(courses);
    } catch (err) {
        console.error("Lỗi khi lấy khóa học đã đăng ký:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// =================================================================
// TEACHER CONTROLLERS
// =================================================================

/**
 * @desc    Giáo viên tạo khóa học mới
 * @route   POST /api/courses
 * @access  Private/Teacher
 */
export const createCourse = async (req, res) => {
    try {
        const { name, description, color, summary, highlights } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Tên khóa học là bắt buộc" });
        }
        
        const course = new Course({
            name,
            description,
            color,
            summary,
            highlights,
            teacher: req.user.id, // ID của giáo viên được lấy từ middleware 'protect'
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);

    } catch (err) {
        console.error("Lỗi khi tạo khóa học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * @desc    Lấy các khóa học một giáo viên đang dạy
 * @route   GET /api/courses/my-teaching-courses
 * @access  Private/Teacher
 */
export const getMyTeachingCourses = async (req, res) => {
    try {
        // Không cần populate vì giáo viên chính là người đang request
        const courses = await Course.find({ teacher: req.user.id });
        res.json(courses);
    } catch (err) {
        console.error("Lỗi khi lấy khóa học đang dạy:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * @desc    Giáo viên cập nhật thông tin khóa học
 * @route   PUT /api/courses/:id
 * @access  Private/Teacher
 */
export const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: "Không tìm thấy khóa học" });
        }

        // Đảm bảo chỉ giáo viên sở hữu khóa học mới có quyền sửa
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa khóa học này" });
        }
        
        const { name, description, color, summary, highlights, bestseller } = req.body;

        // Cập nhật các trường được cung cấp
        course.name = name ?? course.name;
        course.description = description ?? course.description;
        course.color = color ?? course.color;
        course.summary = summary ?? course.summary;
        course.highlights = highlights ?? course.highlights;
        course.bestseller = bestseller ?? course.bestseller;

        const updatedCourse = await course.save();
        res.json(updatedCourse);

    } catch (err) {
        console.error("LỖI KHI CẬP NHẬT KHÓA HỌC:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
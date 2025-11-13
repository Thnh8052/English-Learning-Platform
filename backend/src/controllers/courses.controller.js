// src/controllers/courses.controller.js
import mongoose from 'mongoose';

import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Module from '../models/module.model.js';
import User from '../models/user.model.js';


// PUBLIC CONTROLLERS (Bất kỳ ai cũng có thể truy cập)
/**
 * @desc    Lấy tất cả các khóa học (có thông tin giáo viên)
 * @route   GET /api/courses
 * @access  Public
 */
export const getAllCourses = async (req, res) => {
    try {
        const { category, level, search } = req.query;
// Bắt đầu với bộ lọc cơ bản: chỉ lấy các khóa học đã được duyệt
        const filter = { status: 'published' };

        // --- 1. LOGIC LỌC (FILTERING) ---
        if (category) {
            filter.category = category;
        }
        if (level) {
            filter.level = level;
        }

        // --- 2. LOGIC TÌM KIẾM (SEARCH) - ĐÃ ĐƯỢC ĐƠN GIẢN HÓA ---
        if (search) {
            // Chỉ tìm kiếm trong trường 'name' của khóa học
            // $regex: biểu thức chính quy, tìm kiếm các chuỗi con
            // $options: 'i': không phân biệt hoa thường (case-insensitive)
            filter.name = { $regex: search, $options: 'i' };
        }

        const courses = await Course.find(filter).populate('teacher', 'name');
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

// STUDENT CONTROLLERS
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

// TEACHER CONTROLLERS
/**
 * @desc    Giáo viên tạo khóa học mới
 * @route   POST /api/courses
 * @access  Private/Teacher
 */
export const createCourse = async (req, res) => {
    try {
        // --- BƯỚC 1: LẤY ĐÚNG VÀ ĐỦ CÁC TRƯỜNG TỪ req.body ---
        const { name, summary, description, category, level } = req.body;

        // Kiểm tra trường bắt buộc
        if (!name) {
            return res.status(400).json({ message: "Tên khóa học là bắt buộc" });
        }
        
        // --- BƯỚC 2: TRUYỀN ĐỦ CÁC TRƯỜNG VÀO KHI TẠO MỚI ---
        const course = new Course({
            name,
            summary,
            description,
            category,
            level,
            teacher: req.user.id,
            // Các trường khác như status, price, isFree... sẽ tự động lấy giá trị default từ schema
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);

    } catch (err) {
        // Thêm log lỗi chi tiết để dễ debug hơn
        console.error("--- LỖI 500 KHI TẠO KHÓA HỌC ---");
        console.error(err);
        console.error("------------------------------------");

        // Nếu là lỗi validation, gửi thông báo rõ ràng hơn
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Lỗi máy chủ khi tạo khóa học" });
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

/**
 * @desc    Lấy toàn bộ nội dung (chương và bài học) của một khóa học
 * @route   GET /api/courses/:id/content
 * @access  Public
 */
export const getCourseContent = async (req, res) => {
    try {
        const courseId = req.params.id;

        const modulesWithLessons = await Module.aggregate([
            // Bước 1: Tìm tất cả các module thuộc về khóa học này
            { $match: { course: new mongoose.Types.ObjectId(courseId) } },
            
            // Bước 2: Sắp xếp các module theo thứ tự
            { $sort: { order: 1 } },

            // Bước 3: "Join" với collection 'lessons'
            {
                $lookup: {
                    from: 'lessons', // Tên collection của lessons
                    localField: '_id', // Khóa chính của Module
                    foreignField: 'module', // Khóa ngoại trong Lesson
                    as: 'lessons', // Tên mảng chứa kết quả
                    // Sắp xếp các lesson bên trong mỗi module
                    pipeline: [{ $sort: { order: 1 } }]
                }
            }
        ]);

        res.json(modulesWithLessons);
    } catch (err) {
        console.error("Lỗi khi lấy nội dung khóa học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

export const submitForReview = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        if (course.teacher.toString() !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

        course.status = 'pending_review';
        await course.save();
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Giáo viên rút lại yêu cầu duyệt khóa học
 * @route   POST /api/courses/:id/retract
 * @access  Private/Teacher
 */
export const retractCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        // Chỉ chủ sở hữu mới có quyền
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
        }
        // Chỉ được rút lại khi đang chờ duyệt
        if (course.status !== 'pending_review') {
            return res.status(400).json({ message: 'Không thể rút lại khóa học không ở trạng thái chờ duyệt' });
        }

        course.status = 'draft'; // Chuyển trạng thái về nháp
        await course.save();
        res.json(course);
    } catch (err) {
        console.error("Lỗi khi rút lại khóa học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Giáo viên xóa một khóa học
 * @route   DELETE /api/courses/:id
 * @access  Private/Teacher
 */
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
        }
        // Để an toàn, chỉ cho phép xóa khóa học chưa được publish
        if (course.status === 'published' || course.status === 'pending_review') {
            return res.status(400).json({ message: 'Không thể xóa khóa học đã được xuất bản hoặc đang chờ duyệt. Vui lòng rút lại hoặc lưu trữ.' });
        }

        // TODO: Xóa các modules, lessons, và enrollments liên quan trước khi xóa khóa học
        // await Module.deleteMany({ course: course._id });
        // await Enrollment.deleteMany({ course: course._id });

        await course.deleteOne(); // Sử dụng phương thức mới của Mongoose

        res.json({ message: 'Khóa học đã được xóa' });
    } catch (err) {
        console.error("Lỗi khi xóa khóa học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
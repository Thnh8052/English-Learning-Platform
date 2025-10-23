
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';

// @desc    Lấy tất cả các khóa học
// @route   GET /api/courses
// @access  Public

export const getAllCourses = async (req, res) => {
    try {
        // --- TẠM THỜI BỎ POPULATE ĐỂ TEST ---
        const courses = await Course.find({});
        
        console.log("DỮ LIỆU TỪ DB (KHÔNG POPULATE):", courses); // Thêm log để kiểm tra

        if (!courses) {
            return res.json([]);
        }

        res.json(courses);
    } catch (err) {
        console.error("LỖI KHI GET ALL COURSES:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// @desc    Giáo viên tạo khóa học mới
// @route   POST /api/courses
// @access  Private/Teacher
export const createCourse = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Tên khóa học là bắt buộc" });
        }
        
        const course = new Course({
            name,
            description,
            color,
            teacher: req.user.id, // ID của giáo viên được lấy từ middleware 'protect'
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);

    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// @desc    Sinh viên đăng ký một khóa học
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
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
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// @desc    Lấy các khóa học một sinh viên đã đăng ký
// @route   GET /api/courses/my-courses
// @access  Private/Student
export const getMyEnrolledCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id })
            .populate({
                path: 'course',
                populate: {
                    path: 'teacher',
                    select: 'name'
                }
            });

        const courses = enrollments.map(e => e.course);
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// @desc    Lấy các khóa học một giáo viên đang dạy
// @route   GET /api/courses/my-teaching-courses
// @access  Private/Teacher
export const getMyTeachingCourses = async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
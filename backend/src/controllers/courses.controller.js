import mongoose from 'mongoose';

import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Module from '../models/module.model.js';
import Submission from '../models/submission.model.js';


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

        // --- 2. LOGIC TÌM KIẾM (SEARCH) ---
        if (search) {
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
        const { name, summary, description, category, level } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Tên khóa học là bắt buộc" });
        }
        
        const course = new Course({
            name,
            summary,
            description,
            category,
            level,
            teacher: req.user.id,
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);

    } catch (err) {
        console.error("--- LỖI 500 KHI TẠO KHÓA HỌC ---");
        console.error(err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Lỗi máy chủ khi tạo khóa học" });
    }
};

/**
 * @desc    Lấy các khóa học một giáo viên đang dạy (KÈM THỐNG KÊ)
 * @route   GET /api/courses/my-teaching-courses
 * @access  Private/Teacher
 */
export const getMyTeachingCourses = async (req, res) => {
    try {
        // Sử dụng Aggregate để lấy thêm thông tin thống kê
        const courses = await Course.aggregate([
            // BƯỚC 1: Lọc ra các khóa học của giáo viên hiện tại
            { 
                $match: { 
                    teacher: new mongoose.Types.ObjectId(req.user.id) 
                } 
            },

            // BƯỚC 2: Đếm số lượng học viên (Lookup sang Enrollment)
            {
                $lookup: {
                    from: 'enrollments',      // Tên collection trong DB (thường là số nhiều, viết thường)
                    localField: '_id',        // ID của Course
                    foreignField: 'course',   // Trường course trong Enrollment
                    as: 'enrollmentData'      // Lưu kết quả vào mảng tạm
                }
            },

            // BƯỚC 3: Đếm số lượng bài nộp đang chờ chấm (Lookup sang Submission)
            {
                $lookup: {
                    from: 'submissions',      // Tên collection Submission
                    let: { courseId: '$_id' }, // Biến tạm lưu Course ID
                    pipeline: [
                        { 
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$course', '$$courseId'] },   // Khớp Course ID
                                        { $eq: ['$status', 'submitted'] }     // CHỈ LẤY TRẠNG THÁI 'submitted'
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'pendingData'         // Lưu kết quả vào mảng tạm
                }
            },

            // BƯỚC 4: Tính toán số lượng và thêm vào kết quả trả về
            {
                $addFields: {
                    studentCount: { $size: '$enrollmentData' },       // Đếm số phần tử trong mảng enrollmentData
                    pendingSubmissions: { $size: '$pendingData' },    // Đếm số phần tử trong mảng pendingData
                    completionRate: 0 // Tạm thời để 0, tính năng này phức tạp cần xử lý sau
                }
            },

            // BƯỚC 5: Dọn dẹp kết quả (Bỏ các mảng tạm nặng nề đi)
            {
                $project: {
                    enrollmentData: 0,
                    pendingData: 0
                }
            },
            
            // BƯỚC 6: Sắp xếp theo ngày tạo mới nhất
            { $sort: { createdAt: -1 } }
        ]);

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

        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa khóa học này" });
        }
        
        const { name, description, color, summary, highlights, bestseller } = req.body;

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
            { $match: { course: new mongoose.Types.ObjectId(courseId) } },
            { $sort: { order: 1 } },
            {
                $lookup: {
                    from: 'lessons', 
                    localField: '_id', 
                    foreignField: 'module', 
                    as: 'lessons', 
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
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
        }
        if (course.status !== 'pending_review') {
            return res.status(400).json({ message: 'Không thể rút lại khóa học không ở trạng thái chờ duyệt' });
        }

        course.status = 'draft'; 
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
        if (course.status === 'published' || course.status === 'pending_review') {
            return res.status(400).json({ message: 'Không thể xóa khóa học đã được xuất bản hoặc đang chờ duyệt.' });
        }

        await course.deleteOne(); 

        res.json({ message: 'Khóa học đã được xóa' });
    } catch (err) {
        console.error("Lỗi khi xóa khóa học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
/**
 * @desc    Lấy dữ liệu chi tiết cho Dashboard quản lý khóa học
 * @route   GET /api/courses/:id/dashboard
 * @access  Private/Teacher
 */
export const getCourseDashboard = async (req, res) => {
    try {
        const courseId = req.params.id;

        // 1. Kiểm tra quyền sở hữu
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 2. Lấy thống kê Enrollment (Số lượng học viên)
        const totalStudents = await Enrollment.countDocuments({ course: courseId });

        // 3. Lấy thống kê Submissions (Bài tập)
        // Group theo status để đếm: submitted (chờ chấm), graded (đã chấm), ...
        const submissionStats = await mongoose.model('Submission').aggregate([
            { $match: { course: new mongoose.Types.ObjectId(courseId) } },
            { 
                $group: { 
                    _id: "$status", 
                    count: { $sum: 1 } 
                } 
            }
        ]);

        // Chuyển array thành object cho dễ dùng: { submitted: 5, graded: 10 }
        const statsMap = submissionStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { submitted: 0, grading: 0, completed: 0 });

        // 4. Lấy danh sách 5 bài nộp mới nhất cần chấm (Recent Pending Submissions)
        // Để hiển thị widget "Cần xử lý gấp"
        const recentPendingSubmissions = await mongoose.model('Submission').find({
            course: courseId,
            status: 'submitted'
        })
        .sort({ createdAt: 1 }) // Cũ nhất lên đầu (để chấm trước)
        .limit(5)
        .populate('student', 'name email avatar') // Cần thông tin học viên
        .populate('lesson', 'title'); // Cần tên bài học

        // 5. Lấy danh sách học viên mới nhất (Recent Enrollments)
        const recentStudents = await Enrollment.find({ course: courseId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name email avatar');

        res.json({
            course: {
                _id: course._id,
                name: course.name,
                status: course.status
            },
            stats: {
                totalStudents,
                pendingGrading: statsMap.submitted || 0,
                completed: statsMap.completed || 0,
                totalSubmissions: (statsMap.submitted || 0) + (statsMap.completed || 0) + (statsMap.grading || 0)
            },
            recentPending: recentPendingSubmissions,
            recentStudents: recentStudents
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Lấy danh sách học viên đã đăng ký khóa học
 * @route   GET /api/courses/:courseId/students
 */
export const getEnrolledStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Tìm enrollment và populate thông tin student
        const enrollments = await Enrollment.find({ course: courseId })
            .populate('student', 'name email avatar')
            .sort({ createdAt: -1 });

        // Format lại dữ liệu trả về cho gọn
        const students = enrollments.map(enroll => ({
            _id: enroll.student._id,
            name: enroll.student.name,
            email: enroll.student.email,
            avatar: enroll.student.avatar,
            enrolledAt: enroll.createdAt,
            progress: enroll.progress || 0 // Giả sử model Enrollment có trường progress
        }));

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

/**
 * @desc    Lấy tất cả bài nộp của 1 học viên trong 1 khóa học cụ thể
 * @route   GET /api/courses/:courseId/students/:studentId/submissions
 */
export const getStudentSubmissionsInCourse = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        const submissions = await Submission.find({ 
            course: courseId, 
            student: studentId 
        })
        .populate('lesson', 'title type') // Lấy tên bài học và loại
        .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (err) {
        console.error("Error getting student submissions:", err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài nộp.' });
    }
};
/**
 * @desc    Xóa học sinh khỏi khóa học (Hủy ghi danh)
 * @route   DELETE /api/courses/:courseId/students/:studentId
 * @access  Private/Teacher
 */
export const removeStudentFromCourse = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        // 1. Kiểm tra quyền (Giáo viên của khóa học hoặc Admin)
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Khóa học không tồn tại" });
        }

        // Chỉ giáo viên chủ nhiệm hoặc admin mới được xóa
        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền xóa học viên khỏi khóa học này" });
        }

        // 2. Xóa bản ghi ghi danh (Enrollment)
        const deletedEnrollment = await Enrollment.findOneAndDelete({
            course: courseId,
            student: studentId
        });

        if (!deletedEnrollment) {
            return res.status(404).json({ message: "Học viên này chưa đăng ký khóa học hoặc đã bị xóa" });
        }

        // 3. (Tùy chọn) Xóa luôn bài nộp của học sinh này trong khóa học để sạch data
        // Nếu muốn giữ lịch sử bài nộp thì comment dòng dưới lại
        await Submission.deleteMany({ course: courseId, student: studentId });

        res.json({ message: "Đã xóa học viên khỏi khóa học thành công" });

    } catch (err) {
        console.error("Lỗi khi xóa học viên:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
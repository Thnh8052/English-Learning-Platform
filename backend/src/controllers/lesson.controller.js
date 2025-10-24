import Lesson from '../models/lesson.model.js';
import Course from '../models/course.model.js';

/**
 * @desc    Lấy tất cả các bài học thuộc về một khóa học
 * @route   GET /api/lessons/course/:courseId
 * @access  Public
 */
export const getLessonsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Kiểm tra xem khóa học có tồn tại không (tùy chọn nhưng nên có)
        const courseExists = await Course.findById(courseId);
        if (!courseExists) {
            return res.status(404).json({ message: "Không tìm thấy khóa học" });
        }

        const lessons = await Lesson.find({ course: courseId });
        res.json(lessons);

    } catch (err) {
        console.error("Lỗi khi lấy danh sách bài học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// Bạn có thể thêm các hàm khác cho lesson ở đây sau này (createLesson, getLessonById, etc.)
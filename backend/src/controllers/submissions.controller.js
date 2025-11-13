import Submission from '../models/submission.model.js';
import Lesson from '../models/lesson.model.js';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';

/**
 * @desc    Học viên nộp bài làm
 * @route   POST /api/submissions
 * @access  Private (Student)
 */
export const createSubmission = async (req, res) => {
    try {
        const { lessonId, content } = req.body;
        const studentId = req.user.id;

        if (!lessonId || !content) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bài nộp.' });
        }
        
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Bài học không tồn tại.' });
        }

        // Kiểm tra xem học viên đã ghi danh vào khóa học chứa bài học này chưa
        const course = await Course.findById(lesson.course);
        if (!course) {
             return res.status(404).json({ message: 'Khóa học không tồn tại.' });
        }
        
        const enrollment = await Enrollment.findOne({ student: studentId, course: course._id });
        if (!enrollment) {
            return res.status(403).json({ message: 'Bạn phải ghi danh vào khóa học trước khi nộp bài.' });
        }

        // Kiểm tra xem đã nộp bài này trước đó chưa
        const existingSubmission = await Submission.findOne({ student: studentId, lesson: lessonId });
        if (existingSubmission) {
            return res.status(400).json({ message: 'Bạn đã nộp bài cho bài học này rồi.' });
        }

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: course._id,
            content: content,
        });

        await submission.save();
        res.status(201).json({ message: 'Nộp bài thành công!' });

    } catch (err) {
        console.error("Lỗi khi nộp bài:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
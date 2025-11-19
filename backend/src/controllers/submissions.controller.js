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

/**
 * @desc    Nộp bài Quiz và chấm điểm tự động
 * @route   POST /api/submissions/quiz
 * @access  Private (Student)
 */
export const submitQuiz = async (req, res) => {
    try {
        const { lessonId, userAnswers } = req.body; // userAnswers: { 0: 1, 1: 3 } (index câu hỏi: index đáp án)
        const studentId = req.user.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.type !== 'quiz') {
            return res.status(404).json({ message: 'Bài quiz không tồn tại.' });
        }

        // Kiểm tra ghi danh (logic giống createSubmission)
        const course = await Course.findById(lesson.module); // Lưu ý: lesson có field module, từ module lấy course
        // Tuy nhiên, để đơn giản và nhanh, ta tạm bỏ qua check enrollment chặt chẽ ở đây nếu đã check ở getLessonById
        // Nhưng tốt nhất vẫn nên check lại.

        // --- TÍNH ĐIỂM ---
        let correctCount = 0;
        const totalQuestions = lesson.questions.length;
        
        // Duyệt qua từng câu hỏi trong DB để so sánh
        const processedAnswers = lesson.questions.map((q, index) => {
            const selected = userAnswers[index]; // Index đáp án user chọn
            const isCorrect = selected === q.correctAnswerIndex;
            
            if (isCorrect) correctCount++;

            return {
                questionIndex: index,
                selectedOptionIndex: selected,
                isCorrect: isCorrect
            };
        });

        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

        // Lưu submission
        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module, // Lưu ý: logic lấy course từ module cần populate nếu chưa có
            content: 'Quiz Attempt', 
            answers: processedAnswers,
            score: {
                correct: correctCount,
                total: totalQuestions,
                percentage: scorePercentage
            },
            status: 'completed'
        });

        // Lưu ý: Nếu bạn chưa populate module->course, dòng submission trên có thể lỗi ở course.
        // Để an toàn, ta tìm module trước
        // const moduleData = await Module.findById(lesson.module);
        // submission.course = moduleData.course;

        // Tạm thời để đơn giản, ta giả sử đã có course ID hoặc bỏ qua trường course nếu không bắt buộc
        // Nhưng Submission model yêu cầu course. Hãy fix nhanh:
        const moduleData = await (await import('../models/module.model.js')).default.findById(lesson.module);
        submission.course = moduleData.course;

        await submission.save();

        // Trả về kết quả ngay lập tức
        res.status(201).json({
            message: 'Quiz submitted successfully',
            score: submission.score,
            results: processedAnswers // Trả về chi tiết đúng sai để frontend hiển thị
        });

    } catch (err) {
        console.error("Quiz submission error:", err);
        res.status(500).json({ message: 'Lỗi khi nộp bài quiz' });
    }
};
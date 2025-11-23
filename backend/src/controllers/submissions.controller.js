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
        const { lessonId, userAnswers } = req.body;
        const studentId = req.user.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.type !== 'quiz') {
            return res.status(404).json({ message: 'Bài quiz không tồn tại.' });
        }

        // Tính điểm
        let correctCount = 0;
        const totalQuestions = lesson.questions.length;

        const processedAnswers = lesson.questions.map((q, index) => {
            const selected = userAnswers[index];
            const isCorrect = selected === q.correctAnswerIndex;
            if (isCorrect) correctCount++;

            return {
                questionIndex: index,
                selectedOptionIndex: selected,
                isCorrect
            };
        });

        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

        // Tìm module → course
        const Module = (await import('../models/module.model.js')).default;
        const moduleData = await Module.findById(lesson.module);

        // ---- CÁCH 1: UPDATE HOẶC CREATE ----
        const submission = await Submission.findOneAndUpdate(
            { student: studentId, lesson: lessonId },
            {
                student: studentId,
                lesson: lessonId,
                course: moduleData.course,
                content: 'Quiz Attempt',
                answers: processedAnswers,
                score: {
                    correct: correctCount,
                    total: totalQuestions,
                    percentage: scorePercentage
                },
                status: 'completed'
            },
            { upsert: true, new: true } //update nếu có, tạo mới nếu chưa có
        );

        res.status(201).json({
            message: 'Quiz submitted successfully',
            score: submission.score,
            results: processedAnswers
        });

    } catch (err) {
        console.error("Quiz submission error:", err);
        res.status(500).json({ message: 'Lỗi khi nộp bài quiz' });
    }
};
// GET /api/lessons/:lessonId/submissions
export const getLessonSubmissions = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { user } = req;

        // Chỉ giáo viên của khóa học mới xem được
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        if (lesson.module.course.teacher.toString() !== user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const submissions = await Submission.find({ lesson: lessonId })
            .populate('student', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
// GET /api/students/me/submissions/quiz
export const getMyQuizHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        const submissions = await Submission.find({ student: studentId })
            .populate({
                path: 'lesson',
                select: 'title module type',
                populate: { path: 'module', select: 'title course' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const submitSpeaking = async (req, res) => {
    try {
        const { lessonId } = req.body;
        const studentId = req.user.id;
        const files = req.files; // Mảng các file audio từ multer

        // Parse lại questions từ JSON string (do gửi qua FormData)
        const questions = JSON.parse(req.body.questions || "[]");

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        // Map file audio vào từng câu hỏi
        const answers = questions.map((q, index) => {
            // Tìm file tương ứng với câu hỏi (quy ước đặt tên file từ frontend: audio_0, audio_1...)
            // Hoặc đơn giản là lấy theo index nếu mảng file được sắp xếp đúng
            const file = files.find(f => f.fieldname === `audio_${index}`);
            
            return {
                questionText: q.text,
                questionId: q._id, // Nếu có
                audioUrl: file ? file.path : null, // URL từ Cloudinary
                // Các trường chờ AI
                aiScore: null, 
                transcript: null
            };
        });

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module, // Cần logic lấy course ID chuẩn
            content: 'Speaking Submission',
            answers: answers,
            status: 'submitted' // Chờ chấm (grading)
        });

        // Logic lấy course ID từ module (nếu chưa có sẵn trong lesson)
        const Module = (await import('../models/module.model.js')).default;
        const moduleData = await Module.findById(lesson.module);
        submission.course = moduleData.course;

        await submission.save();
        res.status(201).json({ message: 'Speaking submission received', submission });

    } catch (err) {
        console.error("Speaking submit error:", err);
        res.status(500).json({ message: 'Error submitting speaking test' });
    }
};

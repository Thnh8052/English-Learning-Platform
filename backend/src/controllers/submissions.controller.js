import mongoose from 'mongoose';
import Submission from '../models/submission.model.js';
import Lesson from '../models/lesson.model.js';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';
import Module from '../models/module.model.js';

// --- HELPER FUNCTIONS ---
const getLessonWithCourse = async (lessonId) => {
    return await Lesson.findById(lessonId).populate({
        path: 'module',
        select: 'course',
        populate: { path: 'course', select: '_id teacher' }
    });
};

// --- STUDENT CONTROLLERS ---

/**
 * @desc    Học viên nộp bài làm (Generic/Text)
 * @route   POST /api/submissions
 * @access  Private (Student)
 */
export const createSubmission = async (req, res) => {
    try {
        const { lessonId, content } = req.body;
        const studentId = req.user.id;

        if (!lessonId || !content) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
        }
        
        const lesson = await getLessonWithCourse(lessonId);
        if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại.' });

        const courseId = lesson.module?.course?._id;
        if (!courseId) return res.status(404).json({ message: 'Không tìm thấy khóa học liên quan.' });

        const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (!enrollment) {
            return res.status(403).json({ message: 'Bạn chưa ghi danh vào khóa học này.' });
        }

        const existingSubmission = await Submission.findOne({ student: studentId, lesson: lessonId });
        if (existingSubmission) {
            return res.status(400).json({ message: 'Bạn đã nộp bài cho bài học này rồi.' });
        }

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: courseId,
            content: content,
            status: 'submitted'
        });

        await submission.save();
        res.status(201).json({ message: 'Nộp bài thành công!', submission });

    } catch (err) {
        console.error("Create submission error:", err);
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

        const lesson = await getLessonWithCourse(lessonId);
        if (!lesson || lesson.type !== 'quiz') {
            return res.status(404).json({ message: 'Bài quiz không tồn tại.' });
        }

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

        const submission = await Submission.findOneAndUpdate(
            { student: studentId, lesson: lessonId },
            {
                student: studentId,
                lesson: lessonId,
                course: lesson.module.course._id,
                content: 'Quiz Attempt',
                answers: processedAnswers,
                score: {
                    correct: correctCount,
                    total: totalQuestions,
                    percentage: scorePercentage
                },
                status: 'completed'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
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

/**
 * @desc    Nộp bài Speaking (Audio)
 * @route   POST /api/submissions/speaking
 * @access  Private (Student)
 */
export const submitSpeaking = async (req, res) => {
    try {
        const { lessonId } = req.body;
        const studentId = req.user.id;
        const files = req.files || []; 

        const lesson = await getLessonWithCourse(lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        let questions = [];
        try {
            questions = JSON.parse(req.body.questions || "[]");
        } catch (e) {
            console.error("JSON Parse error:", e);
            return res.status(400).json({ message: "Invalid questions data" });
        }

        const answers = questions.map((q, index) => {
            const file = files.find(f => f.fieldname === `audio_${index}`);
            return {
                questionText: q.text,
                questionId: q._id,
                audioUrl: file ? file.path : null,
                aiScore: null,
                transcript: null
            };
        });

        const submission = await Submission.findOneAndUpdate(
            { student: studentId, lesson: lessonId },
            {
                student: studentId,
                lesson: lessonId,
                course: lesson.module.course._id,
                content: 'Speaking Submission',
                answers: answers,
                status: 'submitted'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ message: 'Speaking submission received', submission });

    } catch (err) {
        console.error("Speaking submit error:", err);
        res.status(500).json({ message: 'Error submitting speaking test' });
    }
};

/**
 * @desc    Lấy TOÀN BỘ lịch sử làm bài của sinh viên (Quiz, Speaking, Writing...)
 * @route   GET /api/submissions/history
 */
export const getMySubmissionHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Lấy tất cả submission của học viên này, populate sâu để lấy thông tin hiển thị
        const submissions = await Submission.find({ student: studentId })
            .populate({
                path: 'lesson',
                select: 'title module type', // Lấy tiêu đề, loại bài học
                populate: { 
                    path: 'module', 
                    select: 'title course',
                    populate: { path: 'course', select: 'name' } // Lấy tên khóa học
                }
            })
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        res.status(200).json(submissions);
    } catch (err) {
        console.error("Get history error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// --- TEACHER CONTROLLERS ---

/**
 * @desc    Lấy danh sách bài nộp của một khóa học (Filter theo status)
 * @route   GET /api/courses/:courseId/submissions
 */
export const getSubmissionsByCourse = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { course: req.params.courseId };
        
        if (status && status !== 'all') {
            filter.status = status;
        }

        const submissions = await Submission.find(filter)
            .populate('student', 'name email avatar')
            .populate('lesson', 'title type')
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài nộp' });
    }
};

/**
 * @desc    Lấy chi tiết một bài nộp để chấm
 * @route   GET /api/submissions/:id
 */
export const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('student', 'name email avatar')
            .populate('lesson', 'title content type questions') 
            .populate('course', 'name');

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
        }
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

/**
 * @desc    Lưu điểm và nhận xét (Chấm bài)
 * @route   POST /api/submissions/:id/grade
 */
export const gradeSubmission = async (req, res) => {
    try {
        const { score, feedback } = req.body;
        
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            {
                score,
                feedback,
                status: 'completed',
                gradedBy: req.user.id,
                gradedAt: new Date()
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
        }

        res.json(submission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lưu điểm' });
    }
};
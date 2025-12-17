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
const getNextAttempt = async (studentId, lessonId) => {
    const count = await Submission.countDocuments({ student: studentId, lesson: lessonId });
    if (count >= 5) {
        throw new Error('Bạn đã hết lượt làm bài (Tối đa 5 lần).');
    }
    return count + 1;
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

        /*
        const existingSubmission = await Submission.findOne({ student: studentId, lesson: lessonId });
        if (existingSubmission) {
            return res.status(400).json({ message: 'Bạn đã nộp bài cho bài học này rồi.' });
        } */

        const attempt = await getNextAttempt(studentId, lessonId);

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: courseId,
            content: content,
            status: 'submitted',
            attempt: attempt
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

        const lesson = await Lesson.findById(lessonId).populate({ path: 'module', select: 'course'});
        if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại.' });

        let correctCount = 0;
        
        // Tạo mảng answers theo cấu trúc mới của Model
        const processedAnswers = lesson.questions.map((q, index) => {
            const selected = userAnswers[index];
            // So sánh đáp án (lưu ý: kiểm tra null/undefined nếu user không chọn)
            const isCorrect = (selected !== undefined && selected === q.correctAnswerIndex);
            
            if (isCorrect) correctCount++;
            
            return {
                questionIndex: index,
                questionText: q.questionText,
                selectedOptionIndex: selected,
                isCorrect: isCorrect
            };
        });

        const totalQuestions = lesson.questions.length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        // const submission = await Submission.findOneAndUpdate(
        //     { student: studentId, lesson: lessonId },
        //     {
        //         student: studentId,
        //         lesson: lessonId,
        //         course: lesson.module.course,
        //         content: `Quiz Result: ${scorePercentage}%`,
                
        //         // QUAN TRỌNG: Lưu mảng answers này vào DB
        //         answers: processedAnswers, 
                
        //         score: {
        //             correct: correctCount,
        //             total: totalQuestions,
        //             percentage: scorePercentage
        //         },
        //         status: 'completed'
        //     },
        //     { upsert: true, new: true, setDefaultsOnInsert: true }
        // );
        const attempt = await getNextAttempt(studentId, lessonId);

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module.course,
            content: `Quiz Attempt ${attempt}`,
            answers: processedAnswers,
            score: {
                    correct: correctCount,
                    total: totalQuestions,
                    percentage: scorePercentage
            },
            status: 'completed',
            attempt: attempt
        });

        await submission.save();
        res.status(201).json({ message: 'Quiz submitted', submission });

    } catch (err) {
        console.error("Quiz Error:", err);
        res.status(500).json({ message: 'Lỗi nộp bài' });
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

        // const submission = await Submission.findOneAndUpdate(
        //     { student: studentId, lesson: lessonId },
        //     {
        //         student: studentId,
        //         lesson: lessonId,
        //         course: lesson.module.course._id,
        //         content: 'Speaking Submission',
        //         answers: answers,
        //         status: 'submitted'
        //     },
        //     { upsert: true, new: true, setDefaultsOnInsert: true }
        // );
        const attempt = await getNextAttempt(studentId, lessonId);
        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module.course._id,
            content: `Speaking Attempt ${attempt}`,
            answers: answers,
            status: 'submitted',
            attempt: attempt
        });
        await submission.save();

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

/**
 * @desc    Lấy lịch sử làm bài của học viên cho một lesson cụ thể
 * @route   GET /api/submissions/my-submission/:lessonId
 */
export const getSubmissionHistoryByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        // Lấy tất cả bài nộp, sắp xếp mới nhất lên đầu
        const submissions = await Submission.find({ student: studentId, lesson: lessonId })
            .select('createdAt status score attempt')
            .sort({ attempt: -1 });

        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
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
 * @desc    Lấy chi tiết một bài nộp (Dùng cho cả Giáo viên chấm bài & Học sinh xem lại)
 * @route   GET /api/submissions/:id
 */
export const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('student', 'name email avatar')
            .populate('course', 'name')
            // Vì questions nằm trực tiếp trong lesson, ta chỉ cần select nó ra
            .populate({
                path: 'lesson',
                select: 'title type content questions module', 
                populate: { path: 'module', select: 'title' }
            });

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
        }

        if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xem bài này.' });
        }
        
        res.json(submission);
    } catch (err) {
        console.error(err);
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
/**
 * @desc    Lấy bài nộp của user hiện tại cho một lesson cụ thể
 * @route   GET /api/submissions/my-submission/:lessonId
 * @access  Private (Student)
 */
export const getMySubmissionByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        const submission = await Submission.findOne({ 
            student: studentId, 
            lesson: lessonId 
        }).sort({ createdAt: -1 }); // Quan trọng

        res.status(200).json(submission || null); 
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
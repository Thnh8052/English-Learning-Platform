import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Submission from '../models/submission.model.js';
import Lesson from '../models/lesson.model.js';
import User from '../models/user.model.js';
import { gradeWritingTask, gradeSpeakingAnswer } from '../services/ai.services.js';
import { transcribeAudio } from '../utils/speakToText.js';

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
 * @desc    Học viên nộp bài làm
 * @route   POST /api/submissions
 * @access  Private (Student)
 */
export const createSubmission = async (req, res) => {
    try {
        const { lessonId, content } = req.body;
        const studentId = req.user.id;

        // 1. Lấy lesson và populate đầy đủ
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module', 
            populate: { path: 'course' }
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Bài học không tồn tại.' });
        }

        let promptForAI = "";

        // Ưu tiên 1: Lấy từ field prompt
        if (lesson.prompt && lesson.prompt.trim().length > 0) {
            promptForAI = lesson.prompt;
        } 
        // Ưu tiên 2: Nếu bài Assignment nhưng đề lỡ lưu trong câu hỏi đầu tiên
        else if (lesson.type === 'assignment' && lesson.questions?.length > 0 && lesson.questions[0].questionText) {
            promptForAI = lesson.questions[0].questionText;
        }
        // Ưu tiên 3: Lấy từ content (loại bỏ thẻ HTML để AI đọc)
        else if (lesson.content && lesson.content.trim().length > 0) {
            promptForAI = lesson.content.replace(/<[^>]*>?/gm, '');
        }
        
        if (!promptForAI || promptForAI === "undefined") {
            if (lesson.type === 'assignment') {
                console.warn(`CẢNH BÁO: Không tìm thấy đề bài cho Lesson ID: ${lessonId}`);
            }
            promptForAI = "Chủ đề tự do";
        }

        let aiResult = null;
        let submissionStatus = 'submitted';

        if (lesson.type === 'assignment') {
            // === LOGIC CHO BÀI WRITING (Cần AI chấm) ===
            console.log("Đang chấm bài Writing...");
            aiResult = await gradeWritingTask(content, promptForAI); 
            submissionStatus = 'ai_graded';

        } else {
            // === LOGIC CHO CÁC LOẠI BÀI KHÁC (Video, Reading...) ===
            console.log("Đánh dấu hoàn thành bài học (Video/Reading)...");
            
            aiResult = {
                overallScore: null,
                criteria: {},
                isOffTopic: false,
                offTopicAnalysis: "",
                improvementTips: [],
                detailedFeedback: "Đã hoàn thành nội dung bài học."
            };
            submissionStatus = 'completed';
        }

        // Kiểm tra lượt làm bài
        const attempt = await getNextAttempt(studentId, lessonId);

        // Tạo Submission
        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module.course._id,
            content: content || "Marked as done", // Nếu content rỗng (vd xem video xong ấn nút), điền mặc định
            score: {
                ai: {
                    overall: aiResult?.overallScore || aiResult?.overall || null,
                    details: aiResult?.criteria || {}
                }
            },
            aiResult: {
                isOffTopic: aiResult?.isOffTopic || false,
                offTopicAnalysis: aiResult?.offTopicAnalysis || "",
                improvementTips: aiResult?.improvementTips || [],
            },
            aiFeedback: aiResult?.detailedFeedback || "",
            status: submissionStatus,
            attempt: attempt
        });

        await submission.save();
        res.status(201).json({ message: 'Lưu kết quả thành công!', submission });

    } catch (err) {
        console.error("Create Submission Error:", err);
        res.status(500).json({ message: err.message });
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

        const lesson = await Lesson.findById(lessonId).populate({ 
            path: 'module', 
            select: 'course'
        });
        
        if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại.' });

        let correctCount = 0;
        
        const processedAnswers = lesson.questions.map((q, index) => {
            const selected = userAnswers[index];
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
        const bandScore = (scorePercentage / 10).toFixed(1);

        const attempt = await getNextAttempt(studentId, lessonId);

        const submission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module.course,
            content: `Quiz Attempt ${attempt}`,
            answers: processedAnswers,
            score: {
                teacher: {
                    correct: correctCount,
                    total: totalQuestions,
                    percentage: scorePercentage,
                    overall: bandScore
                }
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadFile = async (url, destPath) => {
    // 1. Đảm bảo thư mục cha tồn tại trước khi ghi
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`-> Đang tải file từ: ${url}`);
    
    const writer = fs.createWriteStream(destPath);
    
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000 // Thêm timeout 10s để tránh treo
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                console.error("Lỗi khi ghi file:", err);
                writer.close(); // Đóng stream nếu lỗi
                reject(err);
            });
        });
    } catch (err) {
        // Ném lỗi rõ ràng hơn để catch bên dưới bắt được
        throw new Error(`Không tải được file từ Cloudinary: ${err.message}`);
    }
};

export const submitSpeaking = async (req, res) => {
    // Mảng chứa đường dẫn file tạm để xóa sau khi xong
    let tempFilesToDelete = [];

    try {
        const { lessonId } = req.body;
        const studentId = req.user.id;
        
        // req.files sẽ chứa danh sách các file được upload (do dùng multer.any() hoặc .fields())
        const files = req.files || []; 

        if (files.length === 0) {
            return res.status(400).json({ message: "Không tìm thấy file ghi âm nào." });
        }

        // 1. Lấy thông tin bài học để biết có những câu hỏi nào
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module', select: 'course'
        });
        if (!lesson) throw new Error("Bài học không tồn tại.");

        console.log(`[Speaking Multi] User: ${studentId}, Lesson: ${lessonId}, Files: ${files.length}`);

        // 2. Tạo thư mục tạm
        const tempDir = path.join(__dirname, '../../temp_uploads');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // 3. Xử lý từng câu hỏi SONG SONG (Parallel Processing)
        // Duyệt qua từng câu hỏi trong Lesson
        const answerPromises = lesson.questions.map(async (question, index) => {
            
            // Tìm file audio tương ứng với câu hỏi này
            // Quy ước Frontend gửi fieldname là "audio_0", "audio_1"...
            const uploadedFile = files.find(f => f.fieldname === `audio_${index}`);

            // Cấu trúc kết quả mặc định cho câu hỏi này
            let resultData = {
                questionIndex: index,
                questionText: question.questionText,
                audioUrl: null,
                transcript: "",
                score: 0,
                feedback: "Không có câu trả lời",
                isProcessed: false
            };

            if (!uploadedFile) {
                return resultData;
            }

            // Có file -> Bắt đầu xử lý
            resultData.audioUrl = uploadedFile.path;

            try {
                // a. Tải file về temp
                const tempPath = path.join(tempDir, `speak_${studentId}_q${index}_${Date.now()}.webm`);
                tempFilesToDelete.push(tempPath); // Đánh dấu để lát xóa
                
                await downloadFile(uploadedFile.path, tempPath);

                // b. STT (Speech to Text)
                const transcript = await transcribeAudio(tempPath);
                resultData.transcript = transcript || "";

                // c. AI Chấm điểm (Chấm riêng câu này dựa trên context câu hỏi)
                if (resultData.transcript) {
                    // Gọi AI: Input là câu hỏi cụ thể + câu trả lời của HS
                    const aiResponse = await gradeSpeakingAnswer(resultData.transcript, question.questionText);
                    
                    resultData.score = aiResponse?.score || 0; // Đổi overallScore -> score
                    resultData.feedback = aiResponse?.feedback || ""; // Đổi detailedFeedback -> feedback
                    resultData.aiAnalysis = {
                    isOffTopic: aiResponse?.isOffTopic || false,
                    improvementTips: aiResponse?.improvementTips || []
                };
                    resultData.isProcessed = true;
                }

            } catch (err) {
                console.error(`Lỗi xử lý câu hỏi ${index}:`, err);
                resultData.feedback = "Lỗi hệ thống khi xử lý audio này.";
            }

            return resultData;
        });

        // Đợi tất cả câu hỏi xử lý xong
        const processedAnswers = await Promise.all(answerPromises);

        // 4. Tổng hợp kết quả
        // Tính điểm trung bình cộng các câu đã làm
        const answeredQuestions = processedAnswers.filter(a => a.isProcessed);
        const totalScore = answeredQuestions.reduce((sum, a) => sum + a.score, 0);
        const finalOverallScore = answeredQuestions.length > 0 
            ? Math.round(totalScore / answeredQuestions.length) 
            : 0;

        // Tạo nội dung tổng hợp (để lưu vào field 'content' bắt buộc)
        const combinedContent = processedAnswers.map(a => 
            `Q${a.questionIndex + 1}: ${a.transcript || '(No answer)'}`
        ).join('\n\n');

        // 5. Lưu vào DB
        const attemptCount = await Submission.countDocuments({ student: studentId, lesson: lessonId });

        const newSubmission = new Submission({
            student: studentId,
            lesson: lessonId,
            course: lesson.module.course._id,
            
            content: combinedContent, // Transcript tổng hợp
            answers: processedAnswers, // Chi tiết từng câu (có audio, điểm riêng)
            
            score: {
                ai: {
                    overall: finalOverallScore,
                    details: { 
                        method: "average_per_question", 
                        questionScores: processedAnswers.map(a => a.score) 
                    },
                    timestamp: new Date()
                }
            },
            status: 'ai_graded',
            attempt: attemptCount + 1,
        });

        await newSubmission.save();

        res.status(201).json({
            message: "Nộp bài thành công",
            submission: newSubmission
        });

    } catch (error) {
        console.error("Lỗi Submit Speaking Multi:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    } finally {
        // 6. Dọn dẹp tất cả file tạm
        tempFilesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) {}
            }
        });
    }
};

/**
 * @desc    Lấy TOÀN BỘ lịch sử làm bài của sinh viên (Quiz, Speaking, Writing...)
 * @route   GET /api/submissions/history
 */
export const getMySubmissionHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        const submissions = await Submission.find({ student: studentId })
            .populate({
                path: 'lesson',
                select: 'title module type',
                populate: { 
                    path: 'module', 
                    select: 'title course',
                    populate: { path: 'course', select: 'name' }
                }
            })
            .sort({ createdAt: -1 });

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
        const courseId = req.params.courseId || req.params.id; 

        if (!courseId) {
             return res.status(400).json({ message: "Missing Course ID" });
        }

        const filter = { course: courseId };
        
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
        const submission = await Submission.findById(req.params.id);
        
        if (!submission) {
            return res.status(404).json({ message: 'Bài nộp không tồn tại.' });
        }

        let overallScore = Number(score.overall);

        if (!isNaN(overallScore)) {
            overallScore = Math.round(overallScore * 2) / 2;
        } else {
            overallScore = 0;
        }
        
        score.overall = overallScore; 

        submission.score.teacher = {
            overall: overallScore,
            details: JSON.stringify(score),
            timestamp: new Date()
        };
        submission.feedback = feedback;
        submission.status = 'completed';
        submission.gradedBy = req.user.id;

        await submission.save();
        res.json(submission);
    } catch (err) {
        console.error("Grade error:", err);
        res.status(500).json({ message: 'Lỗi khi lưu điểm' });
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
        }).sort({ createdAt: -1 });

        res.status(200).json(submission || null); 
    } catch (err) {
        console.error("Get submission by lesson error:", err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
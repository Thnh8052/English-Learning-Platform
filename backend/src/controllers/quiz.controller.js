import Lesson from '../models/lesson.model.js';

// Hàm thêm câu hỏi mới
export const addQuizQuestion = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { questionText, options, correctAnswerIndex } = req.body;

        // Validate cơ bản
        if (!questionText || !options || options.length < 2 || correctAnswerIndex === undefined) {
            return res.status(400).json({ message: "Vui lòng nhập đủ câu hỏi, ít nhất 2 đáp án và chọn đáp án đúng." });
        }

        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found" });

        // Check quyền giáo viên
        if (lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Thêm câu hỏi vào mảng
        const newQuestion = { questionText, options, correctAnswerIndex };
        lesson.questions.push(newQuestion);
        
        await lesson.save();

        // Trả về câu hỏi vừa tạo (là phần tử cuối cùng)
        res.status(201).json(lesson.questions[lesson.questions.length - 1]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Hàm xóa câu hỏi
export const deleteQuizQuestion = async (req, res) => {
    try {
        const { lessonId, questionId } = req.params;

        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        if (lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Lọc bỏ câu hỏi có id tương ứng
        lesson.questions = lesson.questions.filter(q => q._id.toString() !== questionId);
        
        await lesson.save();
        res.status(200).json({ message: "Question deleted" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// SPEAKING FUNCTIONS (MỚI)
// ============================================================

/**
 * @desc    Thêm câu hỏi cho bài Speaking (Chỉ cần text)
 * @route   POST /api/lessons/:lessonId/speaking-questions
 */
export const addSpeakingQuestion = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { questionText } = req.body;

        // 1. Validate: Chỉ cần questionText
        if (!questionText || questionText.trim() === '') {
            return res.status(400).json({ message: "Nội dung câu hỏi là bắt buộc." });
        }

        // 2. Tìm Lesson và Check quyền (Copy logic checkOwnership để an toàn)
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        if (lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 3. Thêm câu hỏi vào mảng (Không cần options/correctAnswer)
        const newQuestion = { 
            questionText,
            // Có thể thêm trường 'part' nếu muốn phân loại Part 1/2/3 sau này
            // part: req.body.part || 'part1' 
        };
        
        lesson.questions.push(newQuestion);
        await lesson.save();

        // Trả về câu hỏi vừa tạo
        res.status(201).json(lesson.questions[lesson.questions.length - 1]);

    } catch (error) {
        console.error("Add Speaking Question Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * @desc    Xóa câu hỏi Speaking
 * @route   DELETE /api/lessons/:lessonId/speaking-questions/:questionId
 */
export const deleteSpeakingQuestion = async (req, res) => {
    try {
        const { lessonId, questionId } = req.params;

        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        if (lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Lọc bỏ câu hỏi
        lesson.questions = lesson.questions.filter(q => q._id.toString() !== questionId);
        
        await lesson.save();
        res.status(200).json({ message: "Speaking question deleted" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
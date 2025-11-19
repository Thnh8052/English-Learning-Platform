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
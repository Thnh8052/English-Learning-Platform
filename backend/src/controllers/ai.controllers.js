import Lesson from '../models/lesson.model.js';
import { generateQuizFromAI } from '../services/ai.services.js';
import Module from '../models/module.model.js';

export const generateQuiz = async (req, res) => {
    try {
        const { lessonId, prompt } = req.body;

        if (!lessonId || !prompt) {
            return res.status(400).json({ message: "Missing lessonId or prompt." });
        }

        // 1. Tìm Lesson và kiểm tra quyền sở hữu
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) return res.status(404).json({ message: "Lesson not found." });
        
        // Kiểm tra xem người gọi có phải là giáo viên của khóa học không
        if (lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        // 2. Gọi AI Service
        console.log(`[AI] Generating quiz for lesson ${lessonId}...`);
        const generatedQuestions = await generateQuizFromAI(prompt, 5); // Mặc định tạo 5 câu

        // 3. Lưu vào Database (Ghi đè hoặc thêm mới tùy logic, ở đây ta ghi đè để tạo bộ mới)
        lesson.questions = generatedQuestions;
        await lesson.save();

        console.log(`[AI] Successfully generated ${generatedQuestions.length} questions.`);
        
        res.status(200).json({ 
            message: "Quiz generated successfully", 
            questions: lesson.questions 
        });

    } catch (error) {
        console.error("[AI Controller Error]:", error);
        res.status(500).json({ message: error.message || "Server error during AI generation." });
    }
};
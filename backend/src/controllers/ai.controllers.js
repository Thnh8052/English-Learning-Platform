import { generateQuiz } from '../services/ai.services.js';
import { extractTextFromFile } from '../utils/fileParser.js';

export const generateFromText = async (req, res) => {
    try {
        const { text, numQuestions } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'Thiếu nội dung văn bản' });

        const questions = await generateQuiz(text, numQuestions);
        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateFromFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file' });

        const textContent = await extractTextFromFile(req.file);
        if (!textContent.trim()) return res.status(400).json({ success: false, message: 'File rỗng hoặc không đọc được' });

        const numQuestions = req.body.numQuestions || 5;
        const questions = await generateQuiz(textContent, numQuestions);

        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

export const generateQuizFromAI = async (promptText, numQuestions = 5) => {
    const systemPrompt = `
        You are a helpful assistant that generates multiple-choice quizzes for educational purposes.
        
        OUTPUT FORMAT REQUIREMENTS:
        1. You must respond with a purely valid JSON array.
        2. Do NOT include markdown formatting like \`\`\`json or \`\`\`.
        3. Do NOT include any introductory or concluding text. Just the JSON array.
        
        JSON STRUCTURE PER QUESTION:
        {
            "text": "Question string",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswerIndex": 0 (integer from 0 to 3 representing the correct option index)
        }

        TASK:
        Generate ${numQuestions} questions based on the user's input topic/text.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: promptText }
            ],
            model: "deepseek-chat", // Hoặc "deepseek-coder" tùy gói bạn mua
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content.trim();

        // Xử lý làm sạch chuỗi JSON (đề phòng AI vẫn trả về markdown)
        const jsonString = content.replace(/^```json/, '').replace(/```$/, '').trim();

        // Parse sang Object
        const questions = JSON.parse(jsonString);
        return questions;

    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw new Error("Failed to generate questions from AI.");
    }
};
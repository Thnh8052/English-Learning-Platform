import OpenAI from "openai";
import fs from "fs";

let groq;

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured");
    }

    if (!groq) {
        groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1"
        });
    }

    return groq;
};

export const transcribeAudio = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn("File không tồn tại:", filePath);
            return ""; 
        }

        console.log(`Đang gửi Groq STT (Whisper): ${filePath}`);

        const transcription = await getGroqClient().audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
            temperature: 0.0,
            language: "en",
            response_format: "json"
        });

        // Xóa file tạm sau khi xử lý xong để giải phóng bộ nhớ
        // fs.unlinkSync(filePath); 

        const text = transcription.text ? transcription.text.trim() : "";
        console.log(`Transcript: "${text}"`);
        
        return text;

    } catch (error) {
        console.error("Lỗi STT (Groq):", error.message);
        return "";
    }
};

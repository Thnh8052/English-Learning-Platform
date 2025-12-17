import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Hàm làm sạch JSON trả về từ AI
const cleanJsonResponse = (text) => {
    try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Lỗi parse JSON từ AI Raw Text:", text);
        throw new Error("AI trả về định dạng không hợp lệ, vui lòng thử lại.");
    }
};

export const generateQuiz = async (content, numQuestions = 10) => {
    // Kiểm tra đầu vào
    if (!content || typeof content !== 'string') {
        throw new Error("Nội dung đầu vào không hợp lệ.");
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `
                    Bạn là một chuyên gia biên soạn đề thi IELTS (General & Academic).
                    NHIỆM VỤ:
                    Tạo danh sách chính xác ${numQuestions} câu hỏi trắc nghiệm dạng IELTS dựa trên nội dung giáo viên cung cấp. 
                    Nội dung có thể là:
                    - Một đoạn văn (IELTS Reading style)
                    - Một chủ đề (vd: Environment, Education, Technology…)
                    - Một danh sách từ vựng
                    - Một đoạn mô tả ngắn
                    - Hoặc bất kỳ tài liệu nào giáo viên nhập

                    YÊU CẦU OUTPUT (JSON STRICT):
                    1. Chỉ trả về một mảng JSON hợp lệ.
                    2. Không có lời dẫn, không có chú thích, không markdown.
                    3. Cấu trúc mỗi phần tử:
                    {
                        "questionText": "…",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswerIndex": 0,
                        "explanation": "…"
                    }

                    CÁCH XỬ LÝ NỘI DUNG:
                    - Nếu tài liệu dài: bám sát nội dung, tạo câu hỏi đúng theo đoạn văn / kiến thức.
                    - Nếu giáo viên chỉ nhập CHỦ ĐỀ: mở rộng theo đúng kiến thức IELTS (academic English), không tạo thông tin sai.

                    CÁC DẠNG CÂU HỎI ĐƯỢC ƯU TIÊN (CHO DÙ CHỦ ĐỀ LÀ GÌ):
                    - Vocabulary in context
                    - Synonyms / paraphrasing (chuẩn IELTS)
                    - Grammar & usage
                    - Reading comprehension style (main idea, inference, detail)
                    - Collocation / phrasal verbs
                    - Logic & academic reasoning

                    YÊU CẦU VỀ NỘI DUNG (TÙY THEO KIỂU BÀI IELTS BẠN PHẢI TỰ NHẬN DIỆN THEO NỘI DUNG ĐƯỢC CUNG CẤP):
                    - Nếu là **IELTS Reading**: tạo câu hỏi về ý chính, từ vựng trong ngữ cảnh, suy luận, chi tiết đúng/sai.
                    - Nếu là **IELTS Listening** (transcript): tập trung vào chi tiết, số liệu, ý chính, paraphrasing.
                    - Nếu là **Vocabulary lesson**: hỏi về nghĩa từ, collocations, synonyms/antonyms, cách dùng trong câu.
                    - Nếu là **Grammar lesson**: hỏi về cấu trúc, nhận diện lỗi, chọn dạng đúng.
                    - Nếu là **Academic lesson**: hỏi về luận điểm, khái niệm, định nghĩa, ví dụ.

                    YÊU CẦU CHẤT LƯỢNG:
                    - Câu hỏi phải bám sát nội dung được cung cấp.
                    - Đáp án sai phải hợp lý (không quá lộ).
                    - Đáp án đúng phải được đặt vào vị trí ngẫu nhiên (0-3).
                    - Từ ngữ trong câu hỏi và đáp án phải phù hợp phong cách IELTS (formal, học thuật).
                    
                    TUYỆT ĐỐI:
                    - Không trả về văn bản ngoài JSON.
                    - Không tạo format khiến JSON bị hỏng.
                    `},
                { 
                    role: "user", 
                    content: `Đây là nội dung tài liệu nguồn:\n\n"""\n${content}\n"""\n\nHãy tạo ${numQuestions} câu hỏi trắc nghiệm từ tài liệu trên.` 
                }
            ],
            model: "deepseek-chat",
            temperature: 0.2,
            max_tokens: 4000, // Đảm bảo đủ chỗ cho JSON dài
        });

        const aiContent = completion.choices[0].message.content;
        return cleanJsonResponse(aiContent);

    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw new Error("Lỗi kết nối với AI hoặc tài khoản hết hạn mức.");
    }
};
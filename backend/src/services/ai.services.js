import OpenAI from "openai";
import { calculateFullResult } from "./writingScoreCalculator.js";

let openai;

const getOpenAIClient = () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  if (!openai) {
    openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  return openai;
};

const cleanJsonResponse = (text) => {
    try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const startIdx = Math.min(
            cleanText.indexOf('{') === -1 ? Infinity : cleanText.indexOf('{'),
            cleanText.indexOf('[') === -1 ? Infinity : cleanText.indexOf('[')
        );
        
        const endIdx = Math.max(
            cleanText.lastIndexOf('}'),
            cleanText.lastIndexOf(']')
        );
        
        if (startIdx !== Infinity && endIdx !== -1) {
            cleanText = cleanText.substring(startIdx, endIdx + 1);
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Lỗi parse JSON từ AI Raw Text:", text);
        throw new Error("AI trả về định dạng dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
};

export const generateQuiz = async (content, numQuestions = 10) => {
    if (!content || typeof content !== 'string') {
        throw new Error("Nội dung đầu vào không hợp lệ.");
    }

    try {
        const completion = await getOpenAIClient().chat.completions.create({
            model: "deepseek-chat",
            temperature: 0.2,
            max_tokens: 3500,
            messages: [
                {
                    role: "system",
                    content: `
Bạn là một CHUYÊN GIA RA ĐỀ IELTS với 15+ năm kinh nghiệm biên soạn đề thi quốc tế.

Nhiệm vụ:
- Phân tích tài liệu người dùng cung cấp
- Tạo câu hỏi trắc nghiệm IELTS Academic chất lượng cao

YÊU CẦU BẮT BUỘC:

1. Mỗi câu có 4 đáp án A, B, C, D
2. Chỉ có 1 đáp án đúng
3. Đáp án sai phải rất giống đúng để tạo bẫy
4. Không hỏi ngoài tài liệu
5. Không copy nguyên văn – phải paraphrase
6. Độ khó tương đương Band 6.5 – 8.0

OUTPUT JSON DUY NHẤT:

{
  "questions": [
    {
      "id": 1,
      "question": "…",
      "options": {
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "..."
      },
      "correct": "A",
      "explanation": "Giải thích ngắn gọn"
    }
  ]
}`
},
        {
            role: "user",
            content: `
Đây là nội dung tài liệu nguồn:

"""
${content}
"""
Hãy tạo ${numQuestions} câu hỏi trắc nghiệm từ tài liệu trên.
`
                }
            ]
        });

        return cleanJsonResponse(completion.choices[0].message.content);

    } catch (error) {
        console.error("DeepSeek Quiz Error:", error);
        throw new Error("Lỗi khi tạo Quiz bằng AI.");
    }
};

export const gradeWritingTask = async (essay, prompt) => {
    const cleanPrompt = (prompt && String(prompt).trim() !== "undefined") 
        ? String(prompt) 
        : "Không xác định (Chấm theo chuẩn IELTS Writing Task 2 chung)";
    try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.1,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `
            BẠN LÀ GIÁM KHẢO IELTS WRITING TASK 2 CẤP CAO, KHẮT KHE, CHẤM NHƯ KỲ THI THẬT.
            ĐỀ BÀI: "${cleanPrompt}"
            NHIỆM VỤ CHẤM:
            QUY TẮC PHÂN BỐ BAND (BẮT BUỘC TUÂN THEO):
            - Band 8.0-9.0:
            Trả lời đầy đủ mọi yêu cầu đề bài, lập luận sâu, rõ ràng, hầu như không thiếu sót.

            - Band 7.0–7.5:
            Trả lời đúng toàn bộ yêu cầu chính,
            Có thể thiếu chiều sâu hoặc ví dụ chưa thật mạnh,
            Nhưng không bỏ sót yêu cầu nào của đề.

            - Band 6.0–6.5:
            Trả lời đúng chủ đề và đối tượng,
            Nhưng phát triển ý chưa đều, lập luận còn đơn giản,
            Có thể thiếu 1 phần nhỏ hoặc opinion chưa rõ.

            - Band 5.0–5.5:
            Partial response:
            Trả lời đúng chủ đề nhưng thiếu 1 hoặc nhiều yêu cầu chính,
            Ý đơn giản, phát triển hạn chế.

            - Band ≤4.5:
            Trả lời rất hạn chế, sai dạng bài, hoặc lạc đề nặng.
            1. HIỂU ĐỀ BÀI
            - Xác định chính xác dạng bài:
            (discussion, opinion, discuss + opinion, advantages/disadvantages, problem–solution, two-part question, etc.)
            - Xác định ĐẦY ĐỦ các yêu cầu bắt buộc của đề:
            (ví dụ: thảo luận 2 quan điểm, đưa opinion cá nhân, nêu lợi/hại, giải pháp, nguyên nhân, v.v.)

            2. ĐỐI CHIẾU NỘI DUNG BÀI VIẾT
            - Kiểm tra bài viết có:
            - Trả lời đúng dạng câu hỏi của đề hay không
            - Đề cập đúng đối tượng chính của đề (students, education, society, technology, etc.)
            - Bao phủ đủ các yêu cầu bắt buộc hay chỉ trả lời một phần
            - Tránh trả lời chung chung, lan man hoặc viết lệch trọng tâm đề

            3. PHÂN LOẠI MỨC ĐỘ ĐÁP ỨNG ĐỀ (RẤT QUAN TRỌNG)
            CHỈ gán "isOffTopic": true KHI VÀ CHỈ KHI:
            - Bài viết trả lời một CHỦ ĐỀ KHÁC HOÀN TOÀN so với đề bài
            - Hoặc đổi đối tượng chính của đề (ví dụ: đề hỏi students nhưng bài chỉ nói business hoặc society chung chung)
            - Hoặc hiểu sai hoàn toàn dạng bài và trả lời sai hướng

            KHÔNG được coi là off-topic nếu:
            - Bài viết đúng chủ đề nhưng:
            - Thiếu 1 quan điểm bắt buộc
            - Thiếu opinion cá nhân khi đề yêu cầu
            - Trả lời chưa đầy đủ các yêu cầu phụ của đề
            → Trường hợp này phải được coi là "PARTIAL RESPONSE":
            - isOffTopic = false
            - Task Response bị trừ điểm mạnh theo chuẩn IELTS
            - TUYỆT ĐỐI KHÔNG đánh đồng với bài lạc đề hoàn toàn

            4. CHẤM ĐIỂM THEO 4 TIÊU CHÍ IELTS (0.0 – 9.0, bước 0.5)

            - Task Response:
            Đánh giá mức độ trả lời đúng yêu cầu đề, độ đầy đủ nội dung và mức độ phát triển lập luận.
            - Coherence & Cohesion:
            Đánh giá bố cục bài viết, mạch logic, sự liên kết giữa các đoạn và câu.
            - Lexical Resource:
            Đánh giá vốn từ, độ chính xác, khả năng paraphrase và tránh lặp từ.
            - Grammatical Range & Accuracy:
            Đánh giá độ đa dạng cấu trúc câu và mức độ chính xác ngữ pháp.
            
            QUY TẮC CHỐNG NÂNG BAND (ANTI-INFLATION):
            - Không được chấm Band ≥8.0 chỉ vì:
            - Bài viết đúng cấu trúc
            - Ít lỗi ngữ pháp
            - Dùng từ khá

            Chất lượng PHÂN TÍCH và ĐỘ SÂU Ý TƯỞNG
            là yếu tố quyết định Band 8+.


            5. YÊU CẦU VỀ VĂN PHONG NHẬN XÉT
            - Nhận xét bằng TIẾNG VIỆT
            - Ngắn gọn, đi thẳng vào lỗi chính
            - Mỗi tiêu chí: tối đa 2 câu
            - detailedFeedback: tối đa 3 câu, chỉ ra lỗi lớn nhất đang cản band điểm
            - improvementTips: đúng 3 mẹo, cụ thể, có thể áp dụng ngay
            ĐỊNH DẠNG OUTPUT (JSON THUẦN):
            {
            "isOffTopic": boolean,
            "offTopicAnalysis": "Giải thích ngắn gọn (2-3 câu) tại sao lạc đề",
            "criteria": {
                "taskResponse": { "score": number, "feedback": "Ngắn gọn 1-2 câu" },
                "coherence": { "score": number, "feedback": "Ngắn gọn 1-2 câu" },
                "lexical": { "score": number, "feedback": "Ngắn gọn 1-2 câu" },
                "grammar": { "score": number, "feedback": "Ngắn gọn 1-2 câu" }
            },
            "detailedFeedback": "Tổng quan 3-4 câu, chỉ ra điểm mạnh/yếu chính",
            "improvementTips": [
                "Mẹo 1 cụ thể giúp nâng band",
                "Mẹo 2 cụ thể giúp nâng band",
                "Mẹo 3 cụ thể giúp nâng band"
            ]
            }`
        },
        {
          role: "user",
          content: `BÀI LÀM CỦA HỌC SINH:\n\n${essay}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiRawContent = completion.choices[0].message.content;
    const aiResult = cleanJsonResponse(aiRawContent);
        if (!aiResult.improvementTips || aiResult.improvementTips.length === 0) {
        aiResult.improvementTips = [
            "Mở rộng vốn từ vựng học thuật",
            "Luyện viết câu phức với linking words",
            "Phát triển ý sâu hơn với ví dụ cụ thể"
        ];
    }
    
    const gradingLogic = calculateFullResult(aiResult.criteria, aiResult.isOffTopic);

    return {
      ...aiResult,
      overallScore: gradingLogic.overallScore,
      averageScore: gradingLogic.averageScore
    };

  } catch (error) {
    console.error("AI Writing Grading Error:", error);
    throw new Error("Lỗi chấm điểm Writing: " + error.message);
  }
};

export const gradeSpeakingAnswer = async (transcript, question) => {
        console.log("Transcript nhận được:", transcript);
    if (!transcript || transcript.trim().length < 2) {
        return {
            score: 1.0,
            relevance: "low",
            isOffTopic: true,
            feedback: "Không phát hiện giọng nói hoặc âm thanh quá nhỏ.",
            improvementTips: [
                "Kiểm tra lại microphone",
                "Nói to và rõ ràng hơn",
                "Đảm bảo không gian yên tĩnh"
            ]
        };
    }
    try {
        const completion = await getOpenAIClient().chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `Bạn là giám khảo IELTS Speaking khắt khe theo tiêu chuẩn Cambridge.
                    ĐỐI CHIẾU CÂU HỎI: "${question}"
                    VỚI CÂU TRẢ LỜI: "${transcript}"

                    KIỂM TRA:
                    1. Trả lời có liên quan đến câu hỏi không?
                    - Nếu KHÔNG liên quan hoặc quá ngắn (dưới 10 từ) → điểm tối đa 2.0
                    - Nếu học thuộc lòng/lặp từ đề → điểm tối đa 4.0
                    2. Đánh giá Fluency, Vocabulary, Grammar (0-9 điểm)

                    OUTPUT JSON:
                    {
                    "score": number (0-9, bước 0.5),
                    "relevance": "high/medium/low",
                    "isOffTopic": boolean,
                    "feedback": "Nhận xét chính xác 2-3 câu, chỉ ra vấn đề cốt lõi",
                    "improvementTips": [
                        "Mẹo 1 cụ thể",
                        "Mẹo 2 cụ thể", 
                        "Mẹo 3 cụ thể"
                    ]
                    }
`
                },
                {
                    role: "user",
                    content: `Đánh giá câu trả lời: "${transcript}"`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 1000
        });
        
        const result = cleanJsonResponse(completion.choices[0].message.content);
        
        if (!result.improvementTips || result.improvementTips.length === 0) {
            result.improvementTips = [
                "Trả lời đầy đủ hơn với chi tiết và ví dụ",
                "Sử dụng từ vựng đa dạng hơn",
                "Luyện phát âm rõ ràng và tự nhiên"
            ];
        }
        
        return result;
    } catch (error) {
        console.error("AI Speaking Error:", error);
        return { 
            score: 0, 
            relevance: "low",
            isOffTopic: true,
            feedback: "Lỗi kết nối AI khi chấm Speaking.",
            improvementTips: [
                "Kiểm tra kết nối mạng",
                "Thử ghi âm lại",
                "Liên hệ giáo viên nếu lỗi tiếp diễn"
            ]
        };
    }
}

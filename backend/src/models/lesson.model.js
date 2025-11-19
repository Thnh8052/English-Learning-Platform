import mongoose from "mongoose";
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['video', 'reading', 'listening_audio', 'speaking_prompt', 'quiz', 'assignment'], 
        required: true 
    },
    
    // --- CÁC TRƯỜNG CŨ GIỮ NGUYÊN (fileUrl, prompt...) ---
    prompt: { type: String },
    promptType: { type: String, enum: ['text', 'image', 'pdf'], default: 'text' },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    order: { type: Number, required: true },
    fileUrl: { type: String },
    fileType: { type: String },

    // --- THÊM MỚI: Mảng chứa câu hỏi cho Quiz ---
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }], // Mảng các đáp án (VD: ["A", "B", "C", "D"])
        correctAnswerIndex: { type: Number, required: true } // Index của đáp án đúng (0, 1, 2, hoặc 3)
    }]

}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
    title: { type: String, required: true },
    
    // Cập nhật enum type để bao gồm 'speaking_prompt'
    type: { 
        type: String, 
        enum: ['video', 'reading', 'listening_audio', 'speaking_prompt', 'quiz', 'assignment'], 
        required: true 
    },
    
    prompt: { type: String },
    promptType: { type: String, enum: ['text', 'image', 'pdf'], default: 'text' },
    content: { type: String },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    order: { type: Number, required: true },
    fileUrl: { type: String },
    fileType: { type: String },

    questions: [{
        // 1. Chung cho cả Quiz và Speaking
        questionText: { type: String, required: true }, 

        // 2. Dành riêng cho QUIZ (Trắc nghiệm)
        options: [{ type: String }], 
        correctAnswerIndex: { type: Number },

        // 3. Dành riêng cho SPEAKING
        part: { 
            type: String, 
            enum: ['part1', 'part2', 'part3'], 
            default: 'part1' 
        },
        sampleAnswer: { type: String } // Bài mẫu (nếu giáo viên muốn cung cấp)
    }]

}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);
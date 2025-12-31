import mongoose from "mongoose";
const Schema = mongoose.Schema;

const submissionSchema = new Schema(
  {
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    lesson: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Lesson', 
      required: true 
    },
    course: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    
    content: { 
        type: String, 
        required: function() {
            return this.type !== 'speaking'; 
        } 
    },

    answers: [{
        questionIndex: { type: Number }, // Index của câu hỏi trong mảng lesson.questions
        questionText: { type: String },  // Lưu lại text câu hỏi (để hiển thị Speaking)
        audioUrl: { type: String },      // Link audio câu trả lời này
        transcript: { type: String },    // Văn bản học viên nói câu này
        score: { type: Number },         // Điểm số cho riêng câu này
        feedback: { type: String },      // Nhận xét riêng cho câu nà
        selectedOptionIndex: { type: Number }, // Dành cho Quiz
        isCorrect: { type: Boolean }     // Dành cho Quiz (đúng/sai)
    }],

status: {
        type: String,
        enum: ['submitted', 'ai_graded', 'completed'], 
        default: 'submitted'
    },
    
    score: {
        ai: {
            overall: Number,
            details: Object,
            timestamp: Date
        },
        teacher: {
            overall: Number,
            details: String,
            timestamp: Date
        }
    }, 
    aiResult: {
        isOffTopic: { type: Boolean, default: false },
        offTopicAnalysis: { type: String },
        improvementTips: [{ type: String }]
    },
    feedback: { type: String }, // Nhận xét cuối cùng của giáo viên
    aiFeedback: { type: String }, // Nhận xét của AI
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attempt: { type: Number, default: 1 }

  }, 
  { timestamps: true }
);

submissionSchema.index({ student: 1, lesson: 1, attempt: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
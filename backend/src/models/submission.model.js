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
    
    content: { type: String, required: true }, // Text tóm tắt hoặc URL chung

    answers: [{
        questionIndex: { type: Number }, // Index của câu hỏi trong mảng lesson.questions
        questionText: { type: String },  // Lưu lại text câu hỏi (để hiển thị Speaking)
        selectedOptionIndex: { type: Number }, // Dành cho Quiz
        audioUrl: { type: String },      // Dành cho Speaking
        isCorrect: { type: Boolean }     // Dành cho Quiz (đúng/sai)
    }],

    status: {
      type: String,
      enum: ['submitted', 'grading', 'completed'],
      default: 'submitted'
    },
    
    score: { type: Object }, 
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    attempt: { type: Number, default: 1 }

  }, 
  { timestamps: true }
);

submissionSchema.index({ student: 1, lesson: 1, attempt: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
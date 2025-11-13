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
    
    // content có thể là bài viết (text) hoặc URL của file ghi âm
    content: { 
      type: String, 
      required: true 
    },

    status: {
      type: String,
      enum: ['submitted', 'grading', 'completed'],
      default: 'submitted'
    },
    
    score: { type: Object }, // Ví dụ: { overall: 7.0, fluency: 7.5, ... }
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }, 
  { timestamps: true }
);

// Ngăn học viên nộp bài cho cùng một bài học nhiều lần
submissionSchema.index({ student: 1, lesson: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
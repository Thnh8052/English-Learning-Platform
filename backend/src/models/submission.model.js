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
            // Note: 'this.type' refers to the submission document, not the lesson type.
            // If you don't store 'type' in Submission, ensure 'content' is always sent from the controller.
            return true; 
        } 
    },

    answers: [{
        questionIndex: { type: Number },
        questionText: { type: String },
        audioUrl: { type: String },
        transcript: { type: String },
        score: { type: Number },
        feedback: { type: String },
        selectedOptionIndex: { type: Number },
        isCorrect: { type: Boolean }
    }],

    status: {
        type: String,
        enum: ['submitted', 'ai_graded', 'completed'], 
        default: 'submitted'
    },
    score: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }, 
    aiResult: {
        isOffTopic: { type: Boolean, default: false },
        offTopicAnalysis: { type: String },
        improvementTips: [{ type: String }]
    },
    feedback: { type: String },
    aiFeedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attempt: { type: Number, default: 1 }

  }, 
  { timestamps: true }
);

submissionSchema.index({ student: 1, lesson: 1, attempt: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
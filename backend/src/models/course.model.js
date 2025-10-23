import mongoose from "mongoose";
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    name: { 
        type: String, 
        required: [true, "Tên khóa học là bắt buộc"], 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    color: { 
        type: String, 
        default: '#e5e7eb' 
    },
    teacher: {
      type: Schema.Types.ObjectId, // <-- Quan trọng: Tham chiếu đến User
      ref: 'User', // <-- Tên của model User
      required: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const lessonSchema = new Schema(
  {
    title: { 
        type: String, 
        required: [true, "Tiêu đề bài học là bắt buộc"], 
        trim: true 
    },
    // Loại bài học/bài tập, sau này có thể mở rộng thêm Reading, Listening
    type: { 
        type: String, 
        enum: ['Writing', 'Speaking'], 
        required: true 
    },
    // Nội dung đề bài, có thể chứa HTML
    prompt: { 
        type: String, 
        required: [true, "Nội dung đề bài là bắt buộc"] 
    },
    // Liên kết bài học này với một khóa học cụ thể
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course', // Tham chiếu đến model 'Course'
      required: true,
      index: true, // Thêm index để tăng tốc độ truy vấn các bài học theo khóa học
    },
    // Bạn có thể thêm các trường khác sau này, ví dụ:
    // videoUrl: { type: String },
    // duration: { type: Number }, // tính bằng phút
  },
  { timestamps: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
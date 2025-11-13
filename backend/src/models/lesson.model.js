import mongoose from "mongoose";
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
    title: { type: String, required: true },

    // Mở rộng 'type' để phân biệt các loại bài học
    type: { 
        type: String, 
        enum: ['video', 'reading','listening_audio','speaking_prompt', 'quiz', 'assignment'], 
        default: 'reading' 
    },

    duration: { 
        type: Number, 
        default: 0 // Đơn vị là giây
    },

    prompt: { type: String }, // Giữ lại cho bài assignment/reading

    isPreviewable: { type: Boolean, default: false }, // Cho phép xem trước không?

    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true
    },

    order: {
        type: Number,
        required: true
    },

    // Trường mới cho file upload
    fileUrl: { type: String },

    fileType: { type: String } // 'video/mp4', 'application/pdf', ...
}, { timestamps: true });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
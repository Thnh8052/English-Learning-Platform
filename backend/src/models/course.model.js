import mongoose from "mongoose";
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    color: { type: String, default: '#e5e7eb' },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // --- CÁC TRƯỜNG MỚI ---
summary: { 
      type: String,
      default: 'Đây là một khóa học tuyệt vời giúp bạn đạt được mục tiêu.'
    },
    bestseller: {
      type: Boolean,
      default: false
    },
    rating: {
        average: { type: Number, default: 4.5 },
        count: { type: Number, default: 100 }
    },
    metadata: {
        totalHours: { type: Number, default: 20 },
        level: { type: String, default: 'All Levels' },
        lastUpdated: { type: Date, default: Date.now }
    },

    // --- TRƯỜNG MỚI ĐỂ LƯU CÁC GẠCH ĐẦU DÒNG ---
    highlights: {
      type: [String], // Kiểu dữ liệu là một mảng các chuỗi
      default: [
        'Nội dung được cập nhật thường xuyên.',
        'Tiếp cận các bài giảng chất lượng cao.',
        'Học theo lộ trình cá nhân hóa.'
      ]
    }
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
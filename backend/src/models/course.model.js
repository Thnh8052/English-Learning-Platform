import mongoose from "mongoose";
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    summary: { 
      type: String,
      default: 'Đây là một khóa học tuyệt vời giúp bạn đạt được mục tiêu.'
    },

    bestseller: {
      type: Boolean,
      default: false
    },

    metadata: {
        totalHours: { type: Number, default: 20 },
        lastUpdated: { type: Date, default: Date.now }
    },

    category: {
        type: String,
        required: [true, "Phân loại khóa học là bắt buộc"],
        enum: ['Speaking', 'Writing', 'Listening', 'Reading', 'Grammar', 'Vocabulary'],
        index: true
    },

    thumbnail: { 
      type: String, 
      default: "" },

    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'], 
      index: true
    },

    price: {  
      type: Number, 
      default: 0, 
      required: true 
    },

    isFree: { 
      type: Boolean, 
      default: true 
    },
    

    highlights: {
      type: [String],
      default: [
        'Nội dung được cập nhật thường xuyên.',
        'Tiếp cận các bài giảng chất lượng cao.',
        'Học theo lộ trình cá nhân hóa.'
      ]
    },
    rating: {
      average: {
        type: Number,
        default: 0, // Điểm mặc định cho khóa học mới
        min: 0,
        max: 5,
        set: (val) => Math.round(val * 10) / 10 // Làm tròn đến 1 chữ số thập phân
      },
      count: {
        type: Number,
        default: 0
      }
    },
    status: { 
        type: String, 
        enum: [
            "draft",            // Nháp, chỉ giáo viên thấy
            "pending_review",   // Đang chờ duyệt, admin thấy
            "published",        // Đã xuất bản, mọi người thấy
            "requires_changes", // Cần chỉnh sửa, giáo viên thấy
            "rejected",        // Bị từ chối, giáo viên thấy
            "archived"          // Đã ẩn
        ], 
        default: "draft" 
    },
    adminFeedback: { // Ghi chú của admin khi yêu cầu chỉnh sửa
        type: String,
        default: ''
    }
  },
  
  
  { timestamps: true }
);

courseSchema.pre('save', function (next) {
  if (this.isFree) {
    this.price = 0;
  }
  next();
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
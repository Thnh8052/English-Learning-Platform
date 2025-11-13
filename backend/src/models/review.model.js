import mongoose from "mongoose";
import Course from './course.model.js'; // Import Course model để cập nhật

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Vui lòng cung cấp số sao đánh giá."],
    },
    comment: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ngăn một học viên đánh giá cùng 1 khóa học nhiều lần
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

// --- PHẦN LOGIC TỰ ĐỘNG CẬP NHẬT RATING ---

// 1. Tạo một hàm static để tính toán rating trung bình
reviewSchema.statics.calcAverageRatings = async function (courseId) {
  const stats = await this.aggregate([
    {
      $match: { course: courseId },
    },
    {
      $group: {
        _id: '$course',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    // Nếu có review, cập nhật khóa học
    await Course.findByIdAndUpdate(courseId, {
      rating: {
        count: stats[0].nRating,
        average: stats[0].avgRating,
      },
    });
  } else {
    // Nếu không còn review nào, reset rating
    await Course.findByIdAndUpdate(courseId, {
      rating: {
        count: 0,
        average: 4.5, // Hoặc một giá trị mặc định bạn muốn
      },
    });
  }
};

// 2. Gọi hàm đó sau khi một review mới được lưu
reviewSchema.post('save', function () {
  // 'this' trỏ đến review hiện tại, 'this.constructor' trỏ đến model Review
  this.constructor.calcAverageRatings(this.course);
});

// 3. Gọi hàm đó sau khi một review được xóa hoặc cập nhật
// (chạy trước khi xóa/sửa để lấy được `this.course`)
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne().clone();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.course);
});


const Review = mongoose.model("Review", reviewSchema);
export default Review;
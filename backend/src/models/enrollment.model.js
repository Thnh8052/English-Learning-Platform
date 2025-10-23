import mongoose from "mongoose";
const Schema = mongoose.Schema;

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  },
  { timestamps: true }
);

// Ngăn một sinh viên đăng ký cùng 1 khóa học nhiều lần
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
//**Lưu ý:** Chúng ta đã thay đổi `teacherId`, `studentId`, `courseId` từ `String` thành `Schema.Types.ObjectId` và dùng `ref`. Điều này cho phép chúng ta sử dụng một tính năng cực mạnh của Mongoose là `populate()` để lấy thông tin chi tiết của giáo viên hoặc khóa học thay vì chỉ có ID.

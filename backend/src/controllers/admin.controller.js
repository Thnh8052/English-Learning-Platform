import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';

/* COURSE REVIEW */
// các khóa học chờ duyệt
export const getPendingCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'pending_review' })
            .populate('teacher', 'name')
            .sort({ updatedAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
//các khóa học đã published
export const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' }).populate('teacher', 'name');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
//các khóa học bị từ chối/yêu cầu chỉnh sửa thêm
export const getRejectedCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      status: { $in: ['rejected', 'requires_changes'] }
    }).populate('teacher', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

//các khóa học đã được duyệt
export const approveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id, 
            { status: 'published', adminFeedback: '' },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

//xử lý nút yêu cầu chỉnh sửa khóa học
export const requestChanges = async (req, res) => {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ message: 'Cần điền lý do' });

    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'requires_changes', adminFeedback: feedback },
            { new: true }
        );
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

//xử lý nút từ chối khóa học
export const rejectCourse = async (req, res) => {
    const { reason } = req.body;
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected', 
                adminFeedback: reason || 'Khóa học không đáp ứng yêu cầu' 
            },
            { new: true }
        );
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/* USER MANAGEMENT
   GET /api/admin/users */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    //không thể xóa admin
    if (user.role === 'admin') {
        return res.status(400).json({ message: 'Không thể xóa tài khoản Admin' });
    }

    //nếu teacher bị xóa thì xóa luôn info của họ
    if (user.role === 'teacher') {
        const teacherCourses = await Course.find({ teacher: user._id });
        
        if (teacherCourses.length > 0) {
            const courseIds = teacherCourses.map(c => c._id);

            //xóa các student enrolled các khóa học này
            await Enrollment.deleteMany({ course: { $in: courseIds } });
            //xóa các khóa học do teacher này tạo
            await Course.deleteMany({ teacher: user._id });
            
            console.log(`[ADMIN] Xóa ${teacherCourses.length} khóa học của ${user.email}`);
        }
    }

    //xóa user
    await user.deleteOne();
    
    //xóa tất cả enrollment của user này
    await Enrollment.deleteMany({ student: user._id });

    res.json({ message: 'Đã xóa người dùng và tất cả dữ liệu liên quan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ENROLLMENT MANAGEMENT
   GET /api/admin/courses/:id/students */
export const getCourseStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email avatar')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const kickStudentFromCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const deleted = await Enrollment.findOneAndDelete({
      course: courseId,
      student: studentId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy học viên trong khóa học' });
    }
    res.json({ message: 'Đã xóa học viên khỏi khóa học' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
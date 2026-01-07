import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';

/* ======================================================
   COURSE REVIEW FEATURES (EXISTING)
====================================================== */
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

export const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' }).populate('teacher', 'name');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

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

export const approveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id, 
            { status: 'published', adminFeedback: '' },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const requestChanges = async (req, res) => {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ message: 'Reason required' });

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

export const rejectCourse = async (req, res) => {
    const { reason } = req.body;
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected', 
                adminFeedback: reason || 'Does not meet standards.' 
            },
            { new: true }
        );
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/* ======================================================
   USER MANAGEMENT (NEW)
   GET /api/admin/users
====================================================== */
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
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting Admins
    if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete Admin accounts via API' });
    }

    //If User is a TEACHER, clean up their courses
    if (user.role === 'teacher') {
        const teacherCourses = await Course.find({ teacher: user._id });
        
        if (teacherCourses.length > 0) {
            const courseIds = teacherCourses.map(c => c._id);

            //Remove all enrollments for these courses
            await Enrollment.deleteMany({ course: { $in: courseIds } });
            //Delete the courses themselves
            await Course.deleteMany({ teacher: user._id });
            
            console.log(`[ADMIN] Deleted ${teacherCourses.length} courses owned by teacher ${user.email}`);
        }
    }

    //Delete the User account
    await user.deleteOne();
    
    //Clean up where this user was a STUDENT
    await Enrollment.deleteMany({ student: user._id });

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ======================================================
   ENROLLMENT MANAGEMENT (NEW)
   GET /api/admin/courses/:id/students
====================================================== */
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
      return res.status(404).json({ message: 'Student not found in course' });
    }
    res.json({ message: 'Student removed from course' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
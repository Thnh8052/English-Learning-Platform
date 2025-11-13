import Course from '../models/course.model.js';
/** 
 * @desc    Admin lấy tất cả các khóa học đang chờ duyệt
 * @route   GET /api/admin/courses/pending
 * @access  Private/Admin
 */
export const getPendingCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'pending_review' })
            .populate('teacher', 'name')
            .sort({ updatedAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
/**
 * @desc    Admin lấy tất cả các khóa học đã được duyệt
 * @route   GET /api/admin/courses/published
 * @access  Private/Admin
 */
export const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' }).populate('teacher', 'name');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Admin lấy tất cả các khóa học đã bị từ chối/yêu cầu sửa
 * @route   GET /api/admin/courses/rejected
 * @access  Private/Admin
 */
export const getRejectedCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      status: { $in: ['rejected', 'requires_changes'] }
    }).populate('teacher', 'name');
    
    res.json(courses);
  } catch (err) {
    console.error("Lỗi khi lấy khóa học bị từ chối:", err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
* @desc    Admin duyệt một khóa học
* @route   PUT /api/admin/courses/:id/approve
* @access  Private/Admin
 */
export const approveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id, 
            { status: 'published', adminFeedback: '' }, // Duyệt và xóa feedback cũ nếu có
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
/**
 * @desc    Admin yêu cầu chỉnh sửa một khóa học với lý do cụ thể
 * @route   PUT /api/admin/courses/:id/request-changes
 * @access  Private/Admin
 */
export const requestChanges = async (req, res) => {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ message: 'Vui lòng cung cấp lý do yêu cầu chỉnh sửa' });

    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'requires_changes', adminFeedback: feedback },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
/**  
 * @desc    Admin từ chối một khóa học với lý do cụ thể
 * @route   PUT /api/admin/courses/:id/reject
 * @access  Private/Admin
*/
export const rejectCourse = async (req, res) => {
    const { reason } = req.body; // Admin có thể gửi kèm lý do (tùy chọn)
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected', 
                adminFeedback: reason || 'This course does not meet our quality standards.' 
            },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
import Module from '../models/module.model.js';
import Course from '../models/course.model.js';
import Lesson from '../models/lesson.model.js';


/**
 * @desc    Giáo viên tạo một module mới cho khóa học
 * @route   POST /api/modules
 * @access  Private/Teacher
 */
export const createModule = async (req, res) => {
    try {
        const { title, courseId } = req.body;
        if (!title || !courseId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp title và courseId' });
        }

        // Kiểm tra quyền sở hữu khóa học
        const course = await Course.findById(courseId);
        if (!course || course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền thêm module vào khóa học này' });
        }

        // Tìm order lớn nhất hiện tại và cộng thêm 1
        const lastModule = await Module.findOne({ course: courseId }).sort({ order: -1 });
        const newOrder = lastModule ? lastModule.order + 1 : 1;

        const newModule = new Module({
            title,
            course: courseId,
            order: newOrder
        });

        await newModule.save();
        res.status(201).json({ ...newModule.toObject(), lessons: [] });

    } catch (err) {
        console.error("Lỗi khi tạo module:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};


/**
 * @desc    Giáo viên xóa một module (và tất cả bài học bên trong)
 * @route   DELETE /api/modules/:id
 * @access  Private/Teacher
 */
export const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Không tìm thấy module' });
        }
        if (module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa module này' });
        }

        //Xóa tất cả các bài học con trước ---
        await Lesson.deleteMany({ module: req.params.id });

        //Sau đó mới xóa module cha
        await module.deleteOne();
        
        res.json({ message: 'Module và các bài học bên trong đã được xóa' });
    } catch (err) {
        console.error("Lỗi khi xóa module:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Giáo viên cập nhật tên một module
 * @route   PUT /api/modules/:id
 * @access  Private/Teacher
 */
export const updateModule = async (req, res) => {
    try {
        const { title } = req.body;
        const { id: moduleId } = req.params;

        if (!title) {
            return res.status(400).json({ message: 'Vui lòng cung cấp title mới' });
        }

        const module = await Module.findById(moduleId).populate('course');
        if (!module || module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa module này' });
        }

        module.title = title;
        await module.save();
        
        // Lấy lại thông tin lessons để trả về cho frontend
        const lessons = await Lesson.find({ module: module._id }).sort({ order: 1 });
        const updatedModule = { ...module.toObject(), lessons };

        res.json(updatedModule);

    } catch (err) {
        console.error("Lỗi khi cập nhật module:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
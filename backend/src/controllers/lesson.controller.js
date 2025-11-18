import Lesson from '../models/lesson.model.js';
import Module from '../models/module.model.js';
import Course from '../models/course.model.js';
import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model.js';

/**
 * @desc    Lấy tất cả các bài học thuộc về một khóa học
 * @route   GET /api/lessons/course/:courseId
 * @access  Public
 */
export const getLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: "Course ID không hợp lệ" });
        }

        // Dùng aggregate để lấy tất cả bài học, nhóm theo module
        const modulesWithLessons = await Module.aggregate([
            { $match: { course: new mongoose.Types.ObjectId(courseId) } },
            { $sort: { order: 1 } },
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'module',
                    as: 'lessons',
                    pipeline: [{ $sort: { order: 1 } }]
                }
            }
        ]);
        res.json(modulesWithLessons);
    } catch (err) {
        console.error("Lỗi khi lấy nội dung khóa học:", err);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};


/**
 * @desc    Giáo viên tạo một bài học mới trong một module
 * @route   POST /api/lessons
 * @access  Private/Teacher
 */
// export const createLesson = async (req, res) => {
//     try {
//         console.log("--- BẮT ĐẦU createLesson ---");
//         console.log("Dữ liệu nhận được (req.body):", req.body);
//         console.log("File nhận được (req.file):", req.file);

//         const { title, type, moduleId } = req.body;
//         const file = req.file;

//         if (!title || !type || !moduleId || !file) {
//             return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin và file bài học' });
//         }
//         if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//             return res.status(400).json({ message: 'Module ID không hợp lệ.' });
//         }

//         const module = await Module.findById(moduleId).populate('course');
//         if (!module || !module.course || module.course.teacher.toString() !== req.user.id) {
//             return res.status(403).json({ message: 'Bạn không có quyền thêm bài học vào khóa học này.' });
//         }

//         const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
//         const newOrder = (lastLesson?.order || 0) + 1;
        
//         const newLesson = new Lesson({
//             title,
//             type,
//             module: moduleId,
//             order: newOrder,
//             fileUrl: file.path,
//             fileType: file.mimetype,
//         });

//         await newLesson.save();
//         res.status(201).json(newLesson);

//     } catch (err) {
//         console.error("--- LỖI 500 KHI TẠO LESSON ---");
//         console.error(err);
//         if (err.name === 'ValidationError') {
//             return res.status(400).json({ message: err.message });
//         }
//         res.status(500).json({ message: 'Lỗi máy chủ khi tạo bài học' });
//     }
// };


// export const createLesson = async (req, res) => {
//     try {
//         console.log("--- BẮT ĐẦU createLesson ---");
//         console.log("Dữ liệu nhận được (req.body):", req.body);
        
//         // --- LOG CHI TIẾT ĐỐI TƯỢNG FILE ---
//         console.log("File nhận được từ Multer-Cloudinary (req.file):");
//         console.dir(req.file, { depth: null });

//         const { title, type, moduleId } = req.body;
//         const file = req.file;

//         if (!file) {
//             console.error("Lỗi: Không có file nào được upload.");
//             return res.status(400).json({ message: 'Vui lòng chọn một file để tải lên.' });
//         }
//        const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
//         const newOrder = (lastLesson?.order || 0) + 1;
//         const newLessonData = {
//             title,
//             type,
//             module: moduleId,
//             order: newOrder,
//             fileUrl: file.secure_url, // `path` thường là URL đầy đủ và an toàn (https)
//             fileType: file.mimetype,
//         };

//         // Nếu file.path không hoạt động, hãy thử file.secure_url
//         // fileUrl: file.secure_url

//         console.log("Dữ liệu chuẩn bị lưu vào DB:", newLessonData);

//         const newLesson = new Lesson(newLessonData);
//         await newLesson.save();
//         console.log("Lưu lesson vào DB thành công.");

//         res.status(201).json(newLesson);

//     } catch (err) {
//         console.error("--- LỖI 500 KHI TẠO LESSON ---");
//         console.error(err);
//         if (err.name === 'ValidationError') {
//             return res.status(400).json({ message: err.message });
//         }
//         res.status(500).json({ message: 'Lỗi máy chủ khi tạo bài học' });
//     }
// };

export const createLesson = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Invalid form data.' });
        }
        
        const { title, type, moduleId, promptText } = req.body;
        const files = req.files || {};
        const promptFile = files.promptFile ? files.promptFile[0] : null;
        const lessonFile = files.lessonFile ? files.lessonFile[0] : null;

        if (!title || !type || !moduleId) {
            return res.status(400).json({ message: 'Missing required fields: title, type, or module.' });
        }

        const module = await Module.findById(moduleId).populate('course');
        if (!module || !module.course || module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Permission denied.' });
        }

        const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
        const newOrder = (lastLesson?.order || 0) + 1;

        const newLessonData = {
            title, type, module: moduleId, order: newOrder,
        };

        if (promptFile) {
            newLessonData.promptType = promptFile.mimetype.startsWith('image/') ? 'image' : 'pdf';
            newLessonData.prompt = promptFile.path;
        } else if (promptText) {
            newLessonData.promptType = 'text';
            newLessonData.prompt = promptText;
        }

        if (lessonFile) {
            newLessonData.fileUrl = lessonFile.path;
            newLessonData.fileType = lessonFile.mimetype;
        }

        const newLesson = new Lesson(newLessonData);
        await newLesson.save();
        res.status(201).json(newLesson);

    } catch (err) {
        console.error("CREATE LESSON ERROR:", err);
        res.status(500).json({ message: "Server error while creating lesson." });
    }
};

/**
 * @desc    Giáo viên xóa một bài học
 * @route   DELETE /api/lessons/:id
 * @access  Private/Teacher
 */
export const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }
        if (!lesson.module || !lesson.module.course || lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài học này' });
        }

        // TODO: Xóa file trên Cloudinary nếu có

        await lesson.deleteOne();
        res.json({ message: 'Bài học đã được xóa' });
    } catch (err) {
        console.error("Lỗi khi xóa bài học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Giáo viên cập nhật một bài học
 * @route   PUT /api/lessons/:id
 * @access  Private/Teacher
 */
export const updateLesson = async (req, res) => {
    try {
        const { title, type } = req.body;
        const { id: lessonId } = req.params;

        if (!title || !type) {
            return res.status(400).json({ message: 'Vui lòng cung cấp title và type' });
        }

        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }
        if (!lesson.module || !lesson.module.course || lesson.module.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài học này' });
        }

        lesson.title = title;
        lesson.type = type;
        // Lưu ý: Không xử lý upload file mới ở đây để giữ cho logic đơn giản.
        // Việc thay đổi file nên là một quy trình riêng (xóa file cũ, upload file mới).

        await lesson.save();
        res.json(lesson);

    } catch (err) {
        console.error("Lỗi khi cập nhật bài học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Lấy thông tin chi tiết một bài học
 * @route   GET /api/lessons/:id
 * @access  Private (Chỉ học viên đã ghi danh, giáo viên hoặc admin mới được xem)
 */
export const getLessonById = async (req, res) => {
    try {
        const { id: lessonId } = req.params;
        const studentId = req.user.id;

        const lesson = await Lesson.findById(lessonId).populate({
            path: 'module',
            select: 'course'
        });

        if (!lesson || !lesson.module) { // Kiểm tra cả lesson và lesson.module
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }

        // --- KIỂM TRA QUYỀN TRUY CẬP ---
        // 1. Kiểm tra xem user có phải là học viên đã ghi danh không
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: lesson.module.course
        });
        
        // 2. Kiểm tra xem user có phải là admin hoặc giáo viên của khóa học không
        const course = await Course.findById(lesson.module.course);
        const isTeacherOrAdmin = req.user.role === 'admin' || (req.user.role === 'teacher' && course && course.teacher.toString() === req.user.id);

        // Nếu không phải là học viên đã ghi danh VÀ cũng không phải giáo viên/admin
        if (!enrollment && !isTeacherOrAdmin) {
            return res.status(403).json({ message: 'Bạn chưa ghi danh vào khóa học này để xem bài học' });
        }

        res.json(lesson);

    } catch (err) {
        console.error("Lỗi khi lấy chi tiết bài học:", err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
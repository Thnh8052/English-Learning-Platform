    import { useState, useEffect } from 'react';
    import { useNavigate, useParams } from 'react-router-dom';
    import api from '../../services/api';
    import styles from './editCoursePage.module.css';
    import AddLessonModal from '../../components/modals/LessonModal.jsx';
    import AddModuleModal from '../../components/modals/AddModuleModal.jsx';

    const EditCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
        //Data states
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);

        // Form state
    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        description: '',
        category: '',
        level: '',
    });

        // Loading & error states
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

        // Modal states
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add | edit
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [selectedModuleId, setSelectedModuleId] = useState(null);

    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [moduleModalMode, setModuleModalMode] = useState('add');
    const [selectedModule, setSelectedModule] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        try {
            const [courseRes, contentRes] = await Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(`/lessons/course/${courseId}`), // backend trả về modules + lessons
            ]);

            setCourse(courseRes.data);
            setModules(contentRes.data);
            setFormData({
            name: courseRes.data.name || '',
            summary: courseRes.data.summary || '',
            description: courseRes.data.description || '',
            category: courseRes.data.category || '',
            level: courseRes.data.level || '',
            });
        } catch (err) {
            setError('Failed to load course data.');
            console.error('Failed to load course data:', err);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [courseId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        try {
        await api.put(`/courses/${courseId}`, formData);
        alert('Course updated successfully!');
        } catch (err) {
        console.error(err);
        alert('Failed to save course changes.');
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleResubmit = async () => {
        if (!window.confirm('Resubmit this course for admin review?')) return;
        setIsSubmitting(true);
        try {
        await api.post(`/courses/${courseId}/submit-for-review`);
        alert('Course resubmitted successfully!');
        navigate('/dashboard');
        } catch (err) {
        console.error(err);
        alert('Failed to resubmit course.');
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleOpenEditModuleModal = (module) => {
    setModuleModalMode('edit');
    setSelectedModule(module);
    setIsModuleModalOpen(true);
    };
    //thực hiện thêm module
    const handleOpenAddModuleModal = () => {
    setModuleModalMode('add');
    setSelectedModule(null);
    setIsModuleModalOpen(true);
    };

    const handleCloseModuleModal = () => {
    setIsModuleModalOpen(false);
    setSelectedModule(null);
    setModuleModalMode('add');
    };
    const handleAddModule = async (courseId, title) => {
        try {
        const res = await api.post('/modules', { courseId, title });
        setModules((prev) => [...prev, res.data]);
        alert('Module added successfully!');
        } catch (err) {
        console.error('Failed to add module:', err);
        alert(err.response?.data?.message || 'Failed to add module.');
        }
    };

    const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module and all its lessons?")) return;
    try {
        await api.delete(`/modules/${moduleId}`);
        setModules((prev) => prev.filter((m) => m._id !== moduleId));
        alert("Module deleted successfully!");
    } catch (error) {
        console.error("Failed to delete module:", error);
        alert(error.response?.data?.message || "Failed to delete module.");
    }
    };
    const handleSaveModule = async (courseId, title, moduleId = null) => {
    try {
    let res, updatedModule;
    if (moduleModalMode === 'add') {
      res = await api.post('/modules', { courseId, title });
      updatedModule = res.data;
      setModules((prev) => [...prev, updatedModule]);
    } else if (moduleModalMode === 'edit' && moduleId) {
      res = await api.put(`/modules/${moduleId}`, { title });
      updatedModule = res.data;
      setModules((prev) =>
        prev.map((m) => (m._id === updatedModule._id ? updatedModule : m))
      );
    }

    setIsModuleModalOpen(false);
    alert('Module saved successfully!');
  } catch (error) {
    console.error('Failed to save module:', error);
    alert(error.response?.data?.message || 'Failed to save module.');
  }
};

    

    //thực hiện thêm lesson
const handleOpenAddLessonModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setSelectedLesson(null);
    setModalMode('add');
    setIsLessonModalOpen(true);
};

// Mở modal sửa bài học
const handleOpenEditLessonModal = (lesson, moduleId) => {
    setSelectedLesson(lesson);
    setSelectedModuleId(moduleId);
    setModalMode('edit');
    setIsLessonModalOpen(true);
};

// Đóng modal
const handleCloseLessonModal = () => {
    setIsLessonModalOpen(false);
    setSelectedLesson(null);
    setSelectedModuleId(null);
};
const handleSaveLesson = async (lessonDataOrId, data) => {
    try {
        let updatedLesson;

        if (modalMode === 'add') {
            // Gửi request POST /lessons
            const res = await api.post('/lessons', lessonDataOrId, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updatedLesson = res.data;
        } else {
            // Gửi request PUT /lessons/:id
            const res = await api.put(`/lessons/${lessonDataOrId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updatedLesson = res.data;
        }

        // Cập nhật UI ngay sau khi thêm hoặc sửa
        setModules(prevModules => 
            prevModules.map(module => {
                if (module._id === updatedLesson.module) {
                    const lessons = module.lessons || [];
                    const existing = lessons.some(l => l._id === updatedLesson._id);
                    if (existing) {
                        // Cập nhật bài học
                        return {
                            ...module,
                            lessons: lessons.map(l =>
                                l._id === updatedLesson._id ? updatedLesson : l
                            )
                        };
                    } else {
                        // Thêm bài học mới
                        return {
                            ...module,
                            lessons: [...lessons, updatedLesson]
                        };
                    }
                }
                return module;
            })
        );

        handleCloseLessonModal();
    } catch (error) {
        console.error(`Failed to ${modalMode} lesson:`, error);
        alert(error.response?.data?.message || `Failed to ${modalMode} lesson.`);
    }
};

    const handleAddLesson = async (lessonData) => {
        try {
        const res = await api.post('/lessons', lessonData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newLesson = res.data;

        setModules((prev) =>
            prev.map((m) =>
            m._id === newLesson.module
                ? { ...m, lessons: [...m.lessons, newLesson] }
                : m
            )
        );
        } catch (err) {
        console.error('Failed to add lesson:', err);
        alert('Error adding lesson.');
        }
    };

    const handleDeleteLesson = async (moduleId, lessonId) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
        await api.delete(`/lessons/${lessonId}`);
        setModules((prev) =>
            prev.map((m) =>
            m._id === moduleId
                ? { ...m, lessons: m.lessons.filter((l) => l._id !== lessonId) }
                : m
            )
        );
        alert('Lesson deleted.');
        } catch (err) {
        console.error(err);
        alert('Failed to delete lesson.');
        }
    };

    if (loading) return <div className={styles.pageContainer}><p>Loading...</p></div>;
    if (error) return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
    if (!course) return null;

    return (
        <div className={styles.pageContainer}>
        <aside className={styles.sidebar}>
            <h3>Editing Course</h3>
            <h2>{course.name}</h2>
            <p>
            Status:{' '}
            <span className={`${styles.statusBadge} ${styles[`status_${course.status}`]}`}>
                {course.status.replace('_', ' ')}
            </span>
            </p>

            <button onClick={handleSaveChanges} className="btn btn-primary-teacher" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>

            <button onClick={handleResubmit} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
            Resubmit for Review
            </button>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className={styles.mainContent}>
            {/*Thông tin khóa học */}
            <div className={styles.section}>
            <h3>Course Information</h3>
            <form className={styles.form}>
                <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" />
                </div>

                <div className="form-group">
                <label className="form-label">Summary</label>
                <textarea name="summary" value={formData.summary} onChange={handleChange} className="form-input" rows="2"></textarea>
                </div>

                <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows="5"></textarea>
                </div>

                <div className={styles.grid}>
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                    <option value="Speaking">Speaking</option>
                    <option value="Writing">Writing</option>
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Grammar">Grammar</option>
                    <option value="Vocabulary">Vocabulary</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Level</label>
                    <select name="level" value={formData.level} onChange={handleChange} className="form-select">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    </select>
                </div>
                </div>
            </form>
            </div>

            {/* Nội dung khóa học */}
            <div className={styles.section}>
            <div className={styles.header}>
                <h3>Course Content</h3>
                <button onClick={handleOpenAddModuleModal} className="btn btn-primary-teacher">
                + Add Module
                </button>
            </div>

        <div className={styles.moduleList}>
        {modules.length > 0 ? (
            modules.map((module) => (
            <div key={module._id} className={styles.module}>
                {/* ===== MODULE HEADER ===== */}
                <div className={styles.moduleHeader}>
                <strong>{module.title}</strong>
                <div className={styles.moduleActions}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleOpenEditModuleModal(module)}>
                    Edit
                    </button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteModule(module._id)}>
                    Delete
                    </button>
                </div>
                </div>

                {/* ===== LESSON LIST ===== */}
                <div className={styles.lessonList}>
                {module.lessons && module.lessons.length > 0 ? (
                    module.lessons.map((lesson) => (
                    <div key={lesson._id} className={styles.lesson}>
                        <span>{lesson.title}</span>
                        <div className={styles.lessonActions}>
                        {/* <button
                            onClick={() => handleOpenEditLessonModal(lesson, module._id)}
                            className="btn btn-outline btn-sm"
                        >
                            Edit Lesson
                        </button> */}
                        <button onClick={() => handleDeleteLesson(module._id, lesson._id)} className="btn btn-danger-outline btn-sm">
                            Delete
                        </button>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className={styles.noLessonText}>
                    No lessons in this module yet.
                    </p>
                )}

                {/* ===== ADD LESSON BUTTON ===== */}
                <button onClick={() => handleOpenAddLessonModal(module._id)} className={styles.addLessonBtn}>
                    + Add Lesson
                </button>
                </div>
            </div>
            ))
        ) : (
            <p>This course has no content yet. Start by adding a module.</p>
        )}
        </div>
        </div>
        </main>
        <AddLessonModal
            isOpen={isLessonModalOpen}
            onClose={handleCloseLessonModal}
            onSave={handleAddLesson}
            moduleId={selectedModuleId}
        />

        <AddModuleModal
        isOpen={isModuleModalOpen}
        onClose={handleCloseModuleModal}
        courseId={courseId}
        mode={moduleModalMode}
        initialData={selectedModule}
        onSave={handleSaveModule}
        />
        </div>
    );
    };

    export default EditCoursePage;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import styles from './editCoursePage.module.css';

// Import đúng 2 file modal
import LessonModal from '../../components/modals/LessonModal.jsx';
import ModuleModal from '../../components/modals/ModuleModal.jsx';

const EditCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // ----------------- DATA STATES -----------------
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);

    // ----------------- FORM STATE -----------------
    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        description: '',
        category: '',
        level: '',
    });

    // ----------------- UI STATES -----------------
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // ----------------- MODAL STATES -----------------
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    
    // State cho Module (Add/Edit)
    const [moduleModalMode, setModuleModalMode] = useState('add'); 
    const [selectedModule, setSelectedModule] = useState(null);
    
    // State cho Lesson (Chỉ Add)
    const [selectedModuleId, setSelectedModuleId] = useState(null);

    // ----------------- FETCH DATA -----------------
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [courseRes, contentRes] = await Promise.all([
                    api.get(`/courses/${courseId}`),
                    api.get(`/lessons/course/${courseId}`),
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
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    // ----------------- COURSE INFO HANDLERS -----------------
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

    // ----------------- MODULE HANDLERS -----------------
    const handleOpenAddModuleModal = () => {
        setModuleModalMode('add');
        setSelectedModule(null);
        setIsModuleModalOpen(true);
    };

    const handleOpenEditModuleModal = (module) => {
        setModuleModalMode('edit');
        setSelectedModule(module);
        setIsModuleModalOpen(true);
    };

    const handleCloseModuleModal = () => {
        setIsModuleModalOpen(false);
        setSelectedModule(null);
        setModuleModalMode('add');
    };

    const handleSaveModule = async (idFromModal, title, moduleId = null) => {
        try {
            let res;
            if (moduleModalMode === 'add') {
                res = await api.post('/modules', { courseId, title });
                setModules((prev) => [...prev, res.data]);
            } else {
                res = await api.put(`/modules/${moduleId}`, { title });
                setModules((prev) =>
                    prev.map((m) => (m._id === moduleId ? { ...m, title: res.data.title } : m))
                );
            }
            handleCloseModuleModal();
        } catch (error) {
            console.error('Failed to save module:', error);
            throw new Error(error.response?.data?.message || 'Failed to save module.');
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

    // ----------------- LESSON HANDLERS -----------------
    const handleOpenAddLessonModal = (moduleId) => {
        setSelectedModuleId(moduleId);
        setIsLessonModalOpen(true);
    };

    const handleCloseLessonModal = () => {
        setIsLessonModalOpen(false);
        setSelectedModuleId(null);
    };

    const handleAddLesson = async (formData) => {
        try {
            const res = await api.post('/lessons', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newLesson = res.data;

            setModules((prev) =>
                prev.map((m) =>
                    m._id === newLesson.module
                        ? { ...m, lessons: [...(m.lessons || []), newLesson] }
                        : m
                )
            );
        } catch (err) {
            console.error('Failed to add lesson:', err);
            throw new Error(err.response?.data?.message || 'Error adding lesson.');
        }
    };

    const handleOpenEditLessonModal = (lesson) => {
        // Placeholder for edit logic (future implementation)
        alert("Edit lesson info feature coming soon for: " + lesson.title);
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

    // ----------------- RENDER -----------------
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

                {/* Đã thay style inline bằng class sidebarBtn */}
                <button onClick={handleResubmit} className={`btn btn-secondary ${styles.sidebarBtn}`}>
                    Resubmit for Review
                </button>
            </aside>

            <main className={styles.mainContent}>
                {course.status === 'requires_changes' && (
                    <div className={styles.adminFeedback}>
                        <h4>Admin Feedback</h4>
                        <p>{course.adminFeedback || "No specific feedback was provided."}</p>
                    </div>
                )}

                {/* Form thông tin khóa học */}
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

                                    <div className={styles.lessonList}>
                                        {module.lessons?.map((lesson) => (
                                            <div key={lesson._id} className={styles.lesson}>
                                                <span>
                                                    {lesson.type === 'quiz' && (
                                                        <span className={`badge badge-warning ${styles.lessonBadge}`}>
                                                            QUIZ
                                                        </span>
                                                    )}
                                                    {lesson.title}
                                                </span>
                                                
                                                <div className={styles.lessonActions}>
                                                    {lesson.type === 'speaking_prompt' && (
                                                        <button 
                                                            onClick={() => navigate(`/teacher/lesson/${lesson._id}/speaking`)} 
                                                            className="btn btn-primary-teacher btn-sm"
                                                        >
                                                            Manage Questions
                                                        </button>
                                                    )}
                                                    
                                                    {lesson.type === 'quiz' && (
                                                        <button
                                                            onClick={() => navigate(`/teacher/quiz-builder/${lesson._id}`)}
                                                            className="btn btn-primary-teacher btn-sm"
                                                        >
                                                            Manage Questions
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleOpenEditLessonModal(lesson)}
                                                        className="btn btn-outline btn-sm"
                                                    >
                                                        Edit Info
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteLesson(module._id, lesson._id)}
                                                        className="btn btn-danger-outline btn-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

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

            {/* MODALS */}
            <LessonModal
                isOpen={isLessonModalOpen}
                onClose={handleCloseLessonModal}
                moduleId={selectedModuleId}
                onSave={handleAddLesson} 
            />

            <ModuleModal
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
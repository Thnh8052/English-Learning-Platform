import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import styles from './editCoursePage.module.css';

import AddLessonModal from '../../components/modals/LessonModal.jsx';
import AddModuleModal from '../../components/modals/ModuleModal.jsx';

const EditCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // ----------------- DATA STATES -----------------
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);

    // ----------------- COURSE FORM -----------------
    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        description: '',
        category: '',
        level: '',
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // ----------------- MODAL STATES -----------------
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

    const [modalMode, setModalMode] = useState('add');
    const [moduleModalMode, setModuleModalMode] = useState('add');

    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    // ----------------- FETCH DATA -----------------
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [courseRes, modulesRes] = await Promise.all([
                    api.get(`/courses/${courseId}`),
                    api.get(`/lessons/course/${courseId}`),
                ]);

                setCourse(courseRes.data);
                setModules(modulesRes.data);

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

    // ----------------- HANDLERS -----------------
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
            alert('Failed to save course changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResubmit = async () => {
        if (!window.confirm('Resubmit this course for review?')) return;
        setIsSubmitting(true);
        try {
            await api.post(`/courses/${courseId}/submit-for-review`);
            navigate('/dashboard');
        } catch (err) {
            alert('Failed to resubmit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------------- MODULE MODAL ----------------
    const openAddModule = () => {
        setModuleModalMode('add');
        setSelectedModule(null);
        setIsModuleModalOpen(true);
    };

    const openEditModule = (module) => {
        setModuleModalMode('edit');
        setSelectedModule(module);
        setIsModuleModalOpen(true);
    };

    const handleSaveModule = async (courseId, title, moduleId = null) => {
        try {
            let res;
            if (moduleModalMode === 'add') {
                res = await api.post('/modules', { courseId, title });
                setModules((prev) => [...prev, res.data]);
            } else {
                res = await api.put(`/modules/${moduleId}`, { title });
                setModules((prev) =>
                    prev.map((m) => (m._id === res.data._id ? res.data : m))
                );
            }
            alert('Module saved.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save module.');
        }
    };

    const handleDeleteModule = async (moduleId) => {
        if (!window.confirm("Delete this module?")) return;

        try {
            await api.delete(`/modules/${moduleId}`);
            setModules((prev) => prev.filter((m) => m._id !== moduleId));
        } catch (err) {
            alert('Failed to delete module.');
        }
    };

    // ---------------- LESSON MODAL ----------------
    const openAddLesson = (moduleId) => {
        setSelectedModuleId(moduleId);
        setModalMode('add');
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = async (formData) => {
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
            throw new Error(err.response?.data?.message || 'Add lesson failed.');
        }
    };

    const handleDeleteLesson = async (moduleId, lessonId) => {
        if (!window.confirm("Delete this lesson?")) return;

        try {
            await api.delete(`/lessons/${lessonId}`);
            setModules((prev) =>
                prev.map((m) =>
                    m._id === moduleId
                        ? { ...m, lessons: m.lessons.filter((l) => l._id !== lessonId) }
                        : m
                )
            );
        } catch (err) {
            alert('Failed to delete lesson.');
        }
    };

    // ---------------- UI ----------------
    if (loading) return <p>Loading...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;
    if (!course) return null;

    return (
        <div className={styles.pageContainer}>
            {/* SIDEBAR */}
            <aside className={styles.sidebar}>
                <h3>Editing Course</h3>
                <h2>{course.name}</h2>

                <button onClick={handleSaveChanges}
                        className="btn btn-primary-teacher"
                        disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

                <button onClick={handleResubmit}
                        className="btn btn-secondary"
                        style={{ marginTop: '12px' }}>
                    Resubmit
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className={styles.mainContent}>
                {/* COURSE INFO */}
                <div className={styles.section}>
                    <h3>Course Information</h3>

                    <form className={styles.form}>
                        <div className="form-group">
                            <label>Name</label>
                            <input name="name"
                                   value={formData.name}
                                   onChange={handleChange}
                                   className="form-input" />
                        </div>

                        <div className="form-group">
                            <label>Summary</label>
                            <textarea name="summary"
                                      value={formData.summary}
                                      onChange={handleChange}
                                      className="form-input" />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description"
                                      value={formData.description}
                                      onChange={handleChange}
                                      className="form-input" />
                        </div>
                    </form>
                </div>

                {/* MODULES */}
                <div className={styles.section}>
                    <div className={styles.header}>
                        <h3>Course Content</h3>
                        <button onClick={openAddModule}
                                className="btn btn-primary-teacher">
                            + Add Module
                        </button>
                    </div>

                    {modules.map((module) => (
                        <div key={module._id} className={styles.module}>
                            <div className={styles.moduleHeader}>
                                <strong>{module.title}</strong>
                                <div>
                                    <button className="btn btn-outline btn-sm"
                                            onClick={() => openEditModule(module)}>
                                        Edit
                                    </button>

                                    <button className="btn btn-danger-outline btn-sm"
                                            onClick={() => handleDeleteModule(module._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* LESSONS */}
                            <div className={styles.lessonList}>
                                {module.lessons?.map((lesson) => (
                                    <div key={lesson._id} className={styles.lesson}>
                                        <span>{lesson.title}</span>
                                        <button className="btn btn-danger-outline btn-sm"
                                                onClick={() =>
                                                    handleDeleteLesson(module._id, lesson._id)
                                                }>
                                            Delete
                                        </button>
                                    </div>
                                ))}

                                <button className={styles.addLessonBtn}
                                        onClick={() => openAddLesson(module._id)}>
                                    + Add Lesson
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* MODALS */}
            <AddLessonModal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                onSave={handleSaveLesson}
                moduleId={selectedModuleId}
            />

            <AddModuleModal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                courseId={courseId}
                mode={moduleModalMode}
                initialData={selectedModule}
                onSave={handleSaveModule}
            />
        </div>
    );
};

export default EditCoursePage;

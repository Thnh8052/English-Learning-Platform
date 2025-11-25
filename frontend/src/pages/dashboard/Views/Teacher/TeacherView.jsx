import { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourses } from '../../../../contexts/CoursesContext';
import api from '../../../../services/api';
import styles from './teacherView.module.css';

// --- COMPONENT CARD KHÓA HỌC ---
const CourseCard = ({ course, onEdit, onSubmitReview, onRetract, onDelete, onManage, onQuickGrade }) => {
    const isPublished = course.status === 'published';

    const stats = {
        enrolled: course.studentCount || 0,
        pendingTasks: course.pendingSubmissions || 0,
        completedRate: course.completionRate || 0 
    };

    const StatusBadge = () => {
        switch (course.status) {
            case 'draft': return <span className={`${styles.badge} ${styles.draft}`}>Draft</span>;
            case 'pending_review': return <span className={`${styles.badge} ${styles.pending}`}>Pending Review</span>;
            case 'published': return <span className={`${styles.badge} ${styles.published}`}>Published</span>;
            case 'requires_changes': return <span className={`${styles.badge} ${styles.requiresChanges}`}>Requires Changes</span>;
            default: return null;
        }
    };

    return (
        <div className={styles.courseCard}>
            <div className={styles.cardImage} style={{ backgroundColor: course.color || '#e2e8f0' }}>
                <StatusBadge />
                
                {isPublished && (
                    <div className={styles.publishedOverlay}>
                        <div className={styles.statItem} title="Students Enrolled">
                            {/* Icon User Group */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                            </svg>
                            <span>{stats.enrolled}</span>
                        </div>
                        {/* Ẩn tỉ lệ hoàn thành nếu = 0 để đỡ rối */}
                        {stats.completedRate > 0 && (
                            <div className={styles.statItem} title="Completion Rate">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                </svg>
                                <span>{stats.completedRate}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.cardContent}>
                <h4 title={course.name}>{course.name}</h4>
                
                {isPublished && stats.pendingTasks > 0 ? (
                     <div className={styles.gradingAlert}>
                        <span className={styles.pulseDot}></span>
                        {stats.pendingTasks} submissions to grade
                     </div>
                ) : (
                    <p className={styles.cardDescription}>
                        {course.summary ? (course.summary.length > 60 ? course.summary.substring(0, 60) + "..." : course.summary) : "No summary available."}
                    </p>
                )}

                {/* --- CARD ACTIONS --- */}
                <div className={styles.cardActions}>
                    {isPublished ? (
                        <>
                            <button onClick={() => onManage(course._id)} className="btn btn-primary-teacher" style={{flex: 1}}>
                                Manage
                            </button>
                            
                            {stats.pendingTasks > 0 ? (
                                <button onClick={() => onQuickGrade(course._id)} className={`${styles.btn} ${styles.btnWarningOutline}`} title="Grade Submissions">
                                    Grade
                                </button>
                            ) : (
                                <button onClick={() => onEdit(course)} className={`${styles.btn} ${styles.btnSecondaryOutline}`} title="Edit Content">
                                    Edit
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button onClick={() => onEdit(course)} className="btn btn-secondary">Edit</button>

                            {course.status === 'pending_review' && (
                                <button onClick={() => onRetract(course._id)} className={`${styles.btn} ${styles.btnWarning}`}>Retract</button>
                            )}

                            {(course.status === 'draft' || course.status === 'requires_changes') && (
                                <button onClick={() => onSubmitReview(course._id)} className="btn btn-primary-teacher">Submit</button>
                            )}
                            
                            {(course.status === 'draft' || course.status === 'requires_changes') && (
                                <button onClick={() => onDelete(course._id)} className={`${styles.btn} ${styles.btnDanger}`}>Delete</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
const TeacherView = () => {
    // Context sẽ tự động gọi API getMyTeachingCourses mới khi component mount
    const { myCourses, loading, setMyCourses } = useCourses();
    const [activeTab, setActiveTab] = useState('pending');
    const navigate = useNavigate();

    // Logic lọc tab
    const filteredCourses = useMemo(() => {
        if (!myCourses) return [];
        switch (activeTab) {
            case 'published': return myCourses.filter(c => c.status === 'published');
            case 'rejected': return myCourses.filter(c => c.status === 'requires_changes');
            case 'pending':
            default: return myCourses.filter(c => c.status === 'draft' || c.status === 'pending_review');
        }
    }, [myCourses, activeTab]);

    const handleManageCourse = (courseId) => {
        navigate(`/teacher/courses/${courseId}/dashboard`);
    };

    const handleQuickGrade = (courseId) => {
        navigate(`/teacher/courses/${courseId}/grading`);
    };

    const handleSubmitReview = async (courseId) => {
        if (!window.confirm("Are you sure you want to submit this course for review?")) return;
        try {
            const res = await api.post(`/courses/${courseId}/submit-for-review`);
            setMyCourses(prev => prev.map(c => c._id === courseId ? res.data : c));
            alert("Course submitted successfully!");
        } catch (error) { 
            console.error(error);
            alert("Failed to submit course."); 
        }
    };

    const handleRetract = async (courseId) => {
        if (!window.confirm("Retract this course from review?")) return;
        try {
            const res = await api.post(`/courses/${courseId}/retract`);
            setMyCourses(prev => prev.map(c => c._id === courseId ? res.data : c));
        } catch (error) { alert("Error retracting course."); }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm("WARNING: Delete this course? This cannot be undone.")) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setMyCourses(prev => prev.filter(c => c._id !== courseId));
        } catch (error) { 
            alert(error.response?.data?.message || "Error deleting course."); 
        }
    };

    const handleEdit = (course) => {
        navigate(`/teacher/edit-course/${course._id}`);
    };

    if (loading) return <div className="p-8 text-center">Loading your courses...</div>;

    return (
        <div>
            <div className={styles.header}>
                <h3>Your Courses</h3>
                <Link to="/teacher/create-course" className="btn btn-primary-teacher">+ New Course</Link>
            </div>

            <div className={styles.tabContainer}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending & Drafts
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'published' ? styles.active : ''}`}
                    onClick={() => setActiveTab('published')}
                >
                    Published
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.active : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Requires Changes
                </button>
            </div>
            
            <div className={styles.courseGrid}>
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <CourseCard 
                            key={course._id} 
                            course={course} 
                            onEdit={handleEdit} 
                            onSubmitReview={handleSubmitReview} 
                            onRetract={handleRetract}
                            onDelete={handleDelete}
                            onManage={handleManageCourse}
                            onQuickGrade={handleQuickGrade}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <p>No courses found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherView;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../services/api';
import AdminUsers from './AdminUser.jsx';
import StudentListModal from './StudentListModal.jsx';
import styles from './adminDashboard.module.css';

const AdminView = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [viewingStudentsCourseId, setViewingStudentsCourseId] = useState(null);

    useEffect(() => {
        if (activeTab === 'users') return;

        const fetchCoursesByStatus = async () => {
            setLoading(true);
            let endpoint = '';
            switch (activeTab) {
                case 'published': endpoint = '/admin/courses/published'; break;
                case 'rejected': endpoint = '/admin/courses/rejected'; break;
                case 'pending': default: endpoint = '/admin/courses/pending'; break;
            }
            try {
                const res = await api.get(endpoint);
                setCourses(res.data);
            } catch (error) {
                console.error(`Failed to fetch ${activeTab}:`, error);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCoursesByStatus();
    }, [activeTab]);

    return (
        <section className={`section ${styles.page}`}>
            <header className="section-header">
                <div>
                    <p className={styles.eyebrow}>Admin Portal</p>
                    <h2 className="section-title">Dashboard</h2>
                </div>
            </header>

            <div className={styles.tabContainer}>
                <button className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`} onClick={() => setActiveTab('pending')}>
                    Pending Review
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'published' ? styles.active : ''}`} onClick={() => setActiveTab('published')}>
                    Published Courses
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.active : ''}`} onClick={() => setActiveTab('rejected')}>
                    Rejected
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
                    User Management
                </button>
            </div>
            
            <div className={styles.listWrapper} aria-live="polite">
                {/* USERS TAB */}
                {activeTab === 'users' ? (
                    <AdminUsers />
                ) : (
                    /* COURSE TABS */
                    <>
                        {loading ? (
                            <div className={styles.stateCard}>Loading...</div>
                        ) : courses.length === 0 ? (
                            <div className={styles.stateCard}>No courses found.</div>
                        ) : (
                            <ul className={styles.courseList}>
                                {courses.map(course => (
                                    <li key={course._id} className={`card ${styles.courseItem}`}>
                                        <div className={styles.courseMeta}>
                                            <div>
                                                <p className={styles.courseName}>{course.name}</p>
                                                <p className={styles.courseTeacher}>by {course.teacher?.name || 'Unknown'}</p>
                                            </div>
                                            <span className={`${styles.status} ${styles[activeTab]}`}>
                                                {activeTab}
                                            </span>
                                        </div>
                                        
                                        <div className={styles.actions}>
                                            {/* Show "Students" button only for published courses */}
                                            {activeTab === 'published' && (
                                                <button 
                                                    className={`btn ${styles.secondaryBtn}`}
                                                    onClick={() => setViewingStudentsCourseId(course._id)}
                                                >
                                                    View Students
                                                </button>
                                            )}
                                            
                                            <Link to={`/admin/review/${course._id}`} className={`btn btn-outline ${styles.viewButton}`}>
                                                {activeTab === 'pending' ? 'Review Now' : 'Details'}
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>

            {viewingStudentsCourseId && (
                <StudentListModal 
                    courseId={viewingStudentsCourseId} 
                    onClose={() => setViewingStudentsCourseId(null)} 
                />
            )}
        </section>
    );
};

export default AdminView;
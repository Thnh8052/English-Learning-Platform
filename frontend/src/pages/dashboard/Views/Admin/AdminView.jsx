import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../services/api';
import styles from './adminDashboard.module.css';

const AdminView = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const [courses, setCourses] = useState([]);
    const [pendingCourses, setPendingCourses] = useState([]);
    const [loading, setLoading] = useState(true);

 useEffect(() => {
        const fetchCoursesByStatus = async () => {
            setLoading(true);
            let endpoint = '';
            switch (activeTab) {
                case 'published':
                    endpoint = '/admin/courses/published';
                    break;
                case 'rejected':
                    endpoint = '/admin/courses/rejected';
                    break;
                case 'pending':
                default:
                    endpoint = '/admin/courses/pending';
                    break;
            }
            try {
                const res = await api.get(endpoint);
                setCourses(res.data);
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} courses:`, error);
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
                    <p className={styles.eyebrow}>Admin</p>
                    <h2 className="section-title">Course Review</h2>
                    <p className={styles.subtitle}>
                        Approve, request changes, or reject courses awaiting your review.
                    </p>
                </div>
            </header>

            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Review
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
                    Rejected
                </button>
            </div>
            
            <div className={styles.listWrapper} aria-live="polite">
                {loading ? (
                    <div className={styles.stateCard}>Loading...</div>
                ) : courses.length === 0 ? (
                    <div className={styles.stateCard}>No courses in this category.</div>
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
                                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    </span>
                                </div>
                                <Link to={`/admin/review/${course._id}`} className={`btn btn-outline ${styles.viewButton}`}>
                                    View & Review
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default AdminView;
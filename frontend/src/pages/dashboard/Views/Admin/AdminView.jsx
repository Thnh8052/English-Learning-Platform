// src/pages/dashboard/Views/Admin/AdminView.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../services/api';
import styles from '../Teacher/teacherView.module.css';

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
        <div>
            <h2>🛠️ Admin Dashboard, {user.name}</h2>
            
            <div className={styles.tabContainer} style={{ marginTop: 'var(--spacing-4)' }}>
                <button className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`} onClick={() => setActiveTab('pending')}>
                    Pending Review
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'published' ? styles.active : ''}`} onClick={() => setActiveTab('published')}>
                    Published
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.active : ''}`} onClick={() => setActiveTab('rejected')}>
                    Rejected
                </button>
            </div>
            
            <div style={{ marginTop: 'var(--spacing-3)' }}>
                {loading ? <p>Loading...</p> : (
                    courses.length === 0 ? <p>No courses in this category.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {courses.map(course => (
                                <li key={course._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <div>
                                        <strong>{course.name}</strong>
                                        <p style={{ margin: 0, color: 'var(--color-gray-500)' }}>by {course.teacher?.name}</p>
                                    </div>
                                    <Link to={`/admin/review/${course._id}`} className="btn btn-secondary">
                                        View & Review
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>
        </div>
    );
};

export default AdminView;
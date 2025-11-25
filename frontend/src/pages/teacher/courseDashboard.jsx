import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './courseDashboard.module.css';

const CourseDashboard = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Gọi API backend chúng ta vừa tạo
                const res = await api.get(`/courses/${courseId}/dashboard`);
                setData(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [courseId]);

    if (loading) return <div className="p-4">Loading dashboard...</div>;
    if (error) return <div className="p-4 text-error">{error}</div>;
    if (!data) return null;

    const { course, stats, recentPending, recentStudents } = data;

    return (
        <div className={styles.container}>
            {/* --- SIDEBAR --- */}
            <aside className={styles.sidebar}>
                <div className={styles.courseTitle}>
                    {course.name}
                </div>
                
                <nav className={styles.navMenu}>
                    <button className={`${styles.navItem} ${styles.active}`}>
                        <span className={styles.navIcon}>📊</span> Dashboard
                    </button>
                    <button 
                        className={styles.navItem} 
                        onClick={() => navigate(`/teacher/courses/${courseId}/grading`)}
                    >
                        <span className={styles.navIcon}>📝</span> Grading 
                        {stats.pendingGrading > 0 && (
                            <span className="badge badge-warning" style={{marginLeft: 'auto', fontSize: '0.7rem'}}>
                                {stats.pendingGrading}
                            </span>
                        )}
                    </button>
                    <button className={styles.navItem} onClick={() => alert("Comming Soon")}>
                        <span className={styles.navIcon}>👥</span> Students
                    </button>
                    <button className={styles.navItem} onClick={() => navigate(`/teacher/edit-course/${courseId}`)}>
                        <span className={styles.navIcon}>⚙️</span> Settings
                    </button>
                    <button className={styles.navItem} onClick={() => navigate('/dashboard')}>
                        <span className={styles.navIcon}>⬅️</span> Back to All Courses
                    </button>
                </nav>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Overview</h1>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <Link to={`/courses/${courseId}`} target="_blank" className="btn btn-outline">
                            View as Student
                        </Link>
                    </div>
                </div>

                {/* 1. STATS CARDS */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Students</span>
                        <span className={styles.statValue}>{stats.totalStudents}</span>
                        <div className={styles.statTrend}>
                            <span>👥 Active Learners</span>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${stats.pendingGrading > 0 ? styles.warning : ''}`}>
                        <span className={styles.statLabel}>Pending Grading</span>
                        <span className={styles.statValue}>{stats.pendingGrading}</span>
                        <div className={styles.statTrend} style={{color: stats.pendingGrading > 0 ? 'var(--color-warning-hover)' : 'inherit'}}>
                            {stats.pendingGrading > 0 ? '⚡ Needs Attention' : '✅ All caught up'}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Submissions</span>
                        <span className={styles.statValue}>{stats.totalSubmissions}</span>
                        <div className={styles.statTrend}>
                            <span>📚 Total assignments submitted</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionGrid}>
                    {/* 2. RECENT PENDING SUBMISSIONS (Cần chấm gấp) */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Needs Grading</h3>
                            <button 
                                onClick={() => navigate(`/teacher/courses/${courseId}/grading`)} 
                                className={styles.viewAllLink}
                                style={{background:'none', border:'none', cursor:'pointer'}}
                            >
                                View All &rarr;
                            </button>
                        </div>
                        <div className={styles.list}>
                            {recentPending.length > 0 ? (
                                recentPending.map(sub => (
                                    <div key={sub._id} className={styles.listItem}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.avatarPlaceholder}>
                                                {sub.student?.name?.charAt(0) || 'S'}
                                            </div>
                                            <div className={styles.itemText}>
                                                <h5>{sub.lesson?.title || 'Unknown Lesson'}</h5>
                                                <p>by {sub.student?.name || 'Unknown Student'} • {new Date(sub.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button 
                                            className={`${styles.actionBtn} ${styles.btnGrade}`}
                                            onClick={() => navigate(`/teacher/grading/${sub._id}`)} // Link tới trang chấm chi tiết 1 bài
                                        >
                                            Grade Now
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>🎉 No pending submissions. Good job!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. RECENT STUDENTS (Học viên mới) */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Recent Students</h3>
                        </div>
                        <div className={styles.list}>
                            {recentStudents.length > 0 ? (
                                recentStudents.map(enroll => (
                                    <div key={enroll._id} className={styles.listItem}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.avatarPlaceholder} style={{backgroundColor: '#e2e8f0', color: '#64748b'}}>
                                                {enroll.student?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className={styles.itemText}>
                                                <h5>{enroll.student?.name}</h5>
                                                <p>Joined {new Date(enroll.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>No students yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseDashboard;
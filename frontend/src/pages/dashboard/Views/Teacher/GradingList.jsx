import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../../services/api';
import styles from './Grading.module.css';

const GradingList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('submitted'); // 'submitted', 'completed', 'all'

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            try {
                // Gọi API lấy danh sách bài nộp theo CourseID
                const res = await api.get(`/courses/${courseId}/submissions?status=${filter === 'all' ? '' : filter}`);
                setSubmissions(res.data);
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [courseId, filter]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(`/teacher/courses/${courseId}/dashboard`)} className={styles.backBtn}>
                    &larr; Back to Dashboard
                </button>
                <h2>Grading Dashboard</h2>
            </div>

            {/* --- TABS --- */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${filter === 'submitted' ? styles.activeTab : ''}`}
                    onClick={() => setFilter('submitted')}>
                    Needs Grading
                </button>
                <button 
                    className={`${styles.tab} ${filter === 'completed' ? styles.activeTab : ''}`}
                    onClick={() => setFilter('completed')}>
                    Completed
                </button>
                <button 
                    className={`${styles.tab} ${filter === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setFilter('all')}>
                    All Submissions
                </button>
            </div>

            {/* --- TABLE --- */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <p className={styles.loading}>Loading submissions...</p>
                ) : submissions.length === 0 ? (
                    <div className={styles.emptyState}>No submissions found in this category.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Lesson</th>
                                <th>Submitted At</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <tr key={sub._id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar}>
                                                {sub.student?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className={styles.studentName}>{sub.student?.name}</div>
                                                <div className={styles.studentEmail}>{sub.student?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{sub.lesson?.title}</td>
                                    <td>{new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td>
                                    <span className={`${styles.statusBadge} ${styles[sub.status]}`}>
                                        {sub.status === 'submitted' && 'New'}
                                        {sub.status === 'ai_graded' && 'AI Evaluated'}
                                        {sub.status === 'completed' && 'Graded'}
                                    </span>
                                    </td>
                                    <td>
                                        {sub.score ? (
                                            <span className={styles.scoreDisplay}>
                                                {typeof sub.score === 'object' ? sub.score.overall : sub.score}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <Link 
                                            to={`/teacher/grading/${sub._id}`} 
                                            className={`btn btn-sm ${sub.status === 'submitted' ? 'btn-primary-teacher' : 'btn-outline'}`}
                                        >
                                            {sub.status === 'submitted' ? 'Grade Now' : 'Review'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GradingList;
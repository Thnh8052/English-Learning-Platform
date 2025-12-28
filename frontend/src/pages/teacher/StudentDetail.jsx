import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentManagement.module.css';

const StudentDetail = () => {
    const { courseId, studentId } = useParams();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/courses/${courseId}/students/${studentId}/submissions`);
                setSubmissions(res.data);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [courseId, studentId]);

    // Thống kê nhanh
    const stats = {
        total: submissions.length,
        graded: submissions.filter(s => s.status === 'completed').length,
        avgScore: 0
    };

    if (loading) return <div className={styles.container}><p className={styles.textCenter}>Loading detail...</p></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <button onClick={() => navigate(`/teacher/courses/${courseId}/students`)} className="btn btn-outline">
                        &larr; Back to Student List
                    </button>
                    <h2 style={{marginTop: '1rem'}}>Student Progress</h2>
                </div>
            </div>

            <div className={styles.profileSummary}>
                <div className={styles.studentInfo}>
                    <div className={`${styles.avatar} ${styles.avatarLarge}`}>S</div>
                    <div>
                        <span className={`${styles.name} ${styles.nameLarge}`}>Student ID: {studentId}</span>
                        <span className={styles.email}>Submission history and performance tracking</span>
                    </div>
                </div>

                <div className={styles.statGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>{stats.total}</span>
                        <span className={styles.statLabel}>Submissions</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>{stats.graded}</span>
                        <span className={styles.statLabel}>Graded</span>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <h3 className={styles.tableTitle}>Submission History</h3>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Lesson</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th className={styles.textCenter}>Status</th>
                            <th className={styles.textRight}>Score</th>
                            <th className={styles.textRight}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length === 0 ? (
                            <tr className={styles.emptyRow}>
                                <td colSpan="6" className={styles.textCenter}>No submissions yet.</td>
                            </tr>
                        ) : (
                            submissions.map(sub => (
                                <tr key={sub._id}>
                                    <td><span className={styles.name}>{sub.lesson?.title}</span></td>
                                    <td className={styles.textCenter}>{sub.lesson?.type}</td>
                                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                    <td className={styles.textCenter}>
                                        <span className={`badge badge-${sub.status === 'completed' ? 'success' : 'warning'}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className={`${styles.textRight} ${styles.name}`}>
                                        {sub.score?.overall || sub.score || '-'}
                                    </td>
                                    <td className={styles.textRight}>
                                        <Link to={`/teacher/grading/${sub._id}`} className="btn btn-outline">
                                            {sub.status === 'completed' ? 'Review' : 'Grade'}
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default StudentDetail;
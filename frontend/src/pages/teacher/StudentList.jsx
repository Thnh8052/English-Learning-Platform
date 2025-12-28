import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentManagement.module.css';

const StudentList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStudents(); }, [courseId]);

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/courses/${courseId}/students`);
            setStudents(res.data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    if (loading) return <div className={styles.container}><p className={styles.textCenter}>Loading students...</p></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <button onClick={() => navigate(`/teacher/courses/${courseId}/dashboard`)} className="btn btn-outline">
                        &larr; Back to Dashboard
                    </button>
                    <div style={{marginTop: '1rem'}}>
                        <h2>Enrolled Students</h2>
                        <span className={styles.subTitle}>Total: {students.length} students</span>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.colStudent}>Student</th>
                            <th className={styles.colDate}>Enrolled Date</th>
                            <th className={styles.colProgress}>Progress</th>
                            <th className={`${styles.colActions} ${styles.textRight}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr className={styles.emptyRow}>
                                <td colSpan="4" className={styles.textCenter}>No students enrolled yet.</td>
                            </tr>
                        ) : (
                            students.map(std => (
                                <tr key={std._id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar}>
                                                {std.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <span className={styles.name}>{std.name}</span>
                                                <span className={styles.email}>{std.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(std.enrolledAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.progressBarBg}>
                                            <div 
                                                className={styles.progressBarFill} 
                                                style={{ '--width': `${std.progress || 0}%`, width: 'var(--width)' }}
                                            ></div>
                                        </div>
                                        <span className={styles.progressText}>{std.progress || 0}% Completed</span>
                                    </td>
                                    <td className={styles.textRight}>
                                        <div className={styles.actionGroup}>
                                            <Link to={`/teacher/courses/${courseId}/students/${std._id}`} className="btn btn-outline">
                                                View Progress
                                            </Link>
                                            <button className="btn btn-secondary">Remove</button>
                                        </div>
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
export default StudentList;
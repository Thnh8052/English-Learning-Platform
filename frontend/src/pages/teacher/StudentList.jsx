import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentManagement.module.css';

const StudentList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/courses/${courseId}/students`);
                setStudents(res.data);
            } catch (error) {
                console.error("Fetch students error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [courseId]);

    if (loading) return <div className="p-4">Loading students...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <button onClick={() => navigate(`/teacher/courses/${courseId}/dashboard`)} className={styles.backBtn} style={{marginBottom:'10px'}}>
                        &larr; Back to Dashboard
                    </button>
                    <h2>Enrolled Students</h2>
                    <span className={styles.subTitle}>Total: {students.length} students</span>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Enrolled Date</th>
                            <th>Progress (Est.)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>No students enrolled yet.</td></tr>
                        ) : (
                            students.map(std => (
                                <tr key={std._id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar}>
                                                {std.avatar ? <img src={std.avatar} alt="avt" /> : std.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className={styles.name}>{std.name}</span>
                                                <span className={styles.email}>{std.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(std.enrolledAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{width: '100px', height: '8px', background: '#e2e8f0', borderRadius:'4px', overflow:'hidden'}}>
                                            <div style={{width: `${std.progress}%`, height:'100%', background:'#3b82f6'}}></div>
                                        </div>
                                        <small>{std.progress}%</small>
                                    </td>
                                    <td>
                                        <Link 
                                            to={`/teacher/courses/${courseId}/students/${std._id}`} 
                                            className={styles.actionBtn}
                                        >
                                            View Progress
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

export default StudentList;
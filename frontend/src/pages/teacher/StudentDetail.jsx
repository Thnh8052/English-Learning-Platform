import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentManagement.module.css';

const StudentDetail = () => {
    const { courseId, studentId } = useParams();
    const navigate = useNavigate();
    
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Có thể fetch thêm info student nếu API submissions không trả về đủ
    const [studentInfo, setStudentInfo] = useState(null); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi API lấy submissions
                const res = await api.get(`/courses/${courseId}/students/${studentId}/submissions`);
                setSubmissions(res.data);
                
                // Lấy tạm thông tin student từ submission đầu tiên (nếu có)
                // Hoặc bạn có thể gọi thêm API /users/:id nếu cần
                if (res.data.length > 0 && res.data[0].student) {
                    // Nếu backend populate student trong submission
                    // setStudentInfo(res.data[0].student);
                }
            } catch (error) {
                console.error("Fetch detail error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId, studentId]);

    // Tính toán thống kê nhanh
    const stats = {
        total: submissions.length,
        graded: submissions.filter(s => s.status === 'completed').length,
        avgScore: 0
    };

    if (stats.graded > 0) {
        const totalScore = submissions.reduce((acc, curr) => {
            let score = 0;
            if (curr.score && typeof curr.score === 'object') {
                score = parseFloat(curr.score.overall || curr.score.percentage || 0);
            } else if (curr.score) {
                score = parseFloat(curr.score);
            }
            return acc + score;
        }, 0);
        stats.avgScore = (totalScore / stats.graded).toFixed(1);
    }

    if (loading) return <div className="p-4">Loading detail...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <button onClick={() => navigate(`/teacher/courses/${courseId}/students`)} className={styles.backBtn} style={{marginBottom:'10px'}}>
                        &larr; Back to Student List
                    </button>
                    <h2>Student Progress</h2>
                </div>
            </div>

            {/* Profile & Stats Summary */}
            <div className={styles.profileSummary}>
                <div className={styles.studentInfo}>
                    <div className={styles.avatar} style={{width:'60px', height:'60px', fontSize:'1.5rem'}}>
                        S
                    </div>
                    <div>
                        {/* Vì API submission list hiện tại của chúng ta có thể chưa populate student info đầy đủ ở root, 
                            ta có thể hiển thị ID hoặc sửa backend để trả về object bao gồm cả info student */}
                        <span className={styles.name} style={{fontSize:'1.2rem'}}>Student ID: {studentId}</span>
                        <span className={styles.email}>View submissions history</span>
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
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>{stats.avgScore}</span>
                        <span className={styles.statLabel}>Avg. Score</span>
                    </div>
                </div>
            </div>

            {/* Submission List Table */}
            <div className={styles.tableCard}>
                <h3 style={{padding:'1rem', margin:0, borderBottom:'1px solid #eee'}}>Submission History</h3>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Lesson Title</th>
                            <th>Type</th>
                            <th>Submitted Date</th>
                            <th>Attempt</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length === 0 ? (
                            <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem'}}>No submissions yet.</td></tr>
                        ) : (
                            submissions.map(sub => (
                                <tr key={sub._id}>
                                    <td>{sub.lesson?.title || 'Unknown Lesson'}</td>
                                    <td style={{textTransform:'capitalize'}}>{sub.lesson?.type}</td>
                                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                                    <td>{sub.attempt || 1}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[sub.status === 'completed' ? 'completed' : sub.status === 'grading' ? 'grading' : 'submitted']}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td style={{fontWeight:'bold'}}>
                                        {sub.score ? (typeof sub.score === 'object' ? (sub.score.overall || sub.score.percentage) : sub.score) : '-'}
                                    </td>
                                    <td>
                                        <Link 
                                            to={`/teacher/grading/${sub._id}`} 
                                            className={styles.actionBtn}
                                        >
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
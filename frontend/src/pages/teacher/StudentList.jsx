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
        fetchStudents();
    }, [courseId]);

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

    // --- XỬ LÝ XÓA HỌC SINH ---
    const handleRemoveStudent = async (studentId, studentName) => {
        const confirmMsg = `Bạn có chắc chắn muốn xóa học sinh "${studentName}" khỏi khóa học này?\nHành động này cũng sẽ xóa toàn bộ bài làm và điểm số của họ.`;
        
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/courses/${courseId}/students/${studentId}`);
            
            setStudents(prev => prev.filter(std => std._id !== studentId));
            
            alert(`Đã xóa học sinh ${studentName} thành công.`);
        } catch (error) {
            console.error("Remove student error:", error);
            alert(error.response?.data?.message || "Lỗi khi xóa học sinh. Vui lòng thử lại.");
        }
    };

    if (loading) return <div className={styles.container}><p>Loading students...</p></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <button onClick={() => navigate(`/teacher/courses/${courseId}/dashboard`)} className={styles.backBtn}>
                        &larr; Back to Dashboard
                    </button>
                    <div>
                        <h2>Enrolled Students</h2>
                        <span className={styles.subTitle}>Total: {students.length} students</span>
                    </div>
                </div>
                
                {/* Có thể thêm nút "Mời học sinh" ở đây nếu cần */}
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{width: '35%'}}>Student</th>
                            <th style={{width: '15%'}}>Enrolled Date</th>
                            <th style={{width: '20%'}}>Progress</th>
                            <th style={{width: '30%', textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem', color: 'var(--text-secondary)'}}>No students enrolled yet.</td></tr>
                        ) : (
                            students.map(std => (
                                <tr key={std._id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar}>
                                                {std.avatar ? <img src={std.avatar} alt="avt" /> : std.name?.charAt(0) || 'S'}
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
                                                style={{width: `${std.progress || 0}%`}}
                                            ></div>
                                        </div>
                                        <small style={{color: 'var(--text-secondary)'}}>{std.progress || 0}% Completed</small>
                                    </td>
                                    <td style={{textAlign: 'right'}}>
                                        <div className={styles.actionGroup}>
                                            <Link 
                                                to={`/teacher/courses/${courseId}/students/${std._id}`} 
                                                className={`${styles.actionBtn} ${styles.btnView}`}
                                                title="View Detail & Progress"
                                            >
                                                View Progress
                                            </Link>
                                            
                                            <button 
                                                onClick={() => handleRemoveStudent(std._id, std.name)}
                                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                                title="Remove from Course"
                                            >
                                                Remove
                                            </button>
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
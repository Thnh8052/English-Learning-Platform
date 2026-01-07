import { useState, useEffect } from 'react';
import api from '../../../../services/api';
import styles from './adminDashboard.module.css';
import { DEFAULT_AVATAR } from '../../../../constants/media';

const StudentListModal = ({ courseId, onClose }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/admin/courses/${courseId}/students`);
                setStudents(res.data); //return array of Enrollments
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [courseId]);

    const handleKick = async (studentId) => {
        if(!window.confirm("Remove this student from the course?")) return;
        try {
            await api.delete(`/admin/courses/${courseId}/students/${studentId}`);
            setStudents(students.filter(s => s.student._id !== studentId));
        } catch (error) {
            alert("Failed to remove student");
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <h3>Enrolled Students</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </header>
                
                <div className={styles.modalBody}>
                    {loading ? <p>Loading...</p> : students.length === 0 ? (
                        <p className={styles.emptyState}>No students enrolled yet.</p>
                    ) : (
                        <ul className={styles.studentList}>
                            {students.map(({ student, enrolledAt }) => (
                                <li key={student._id} className={styles.studentItem}>
                                    <div className={styles.userCell}>
                                        <img src={student.avatar || DEFAULT_AVATAR} alt="avatar" className={styles.miniAvatar} />
                                        <div>
                                            <p className={styles.userName}>{student.name}</p>
                                            <p className={styles.userEmail}>{student.email}</p>
                                        </div>
                                    </div>
                                    <div className={styles.actionRow}>
                                        <span className={styles.dateInfo}>{new Date(enrolledAt).toLocaleDateString()}</span>
                                        <button onClick={() => handleKick(student._id)} className={styles.kickBtn}>Remove</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentListModal;
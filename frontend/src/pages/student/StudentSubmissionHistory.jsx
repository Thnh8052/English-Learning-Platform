import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentHistory.module.css';

const StudentSubmissionHistory = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/submissions/history');
                setSubmissions(res.data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusClass = (status) => {
        if (status === 'completed') return styles.statusCompleted;
        if (status === 'submitted') return styles.statusSubmitted;
        return styles.statusPending;
    };

    const renderScorePreview = (sub) => {
        if (!sub.score) return '-';
        if (typeof sub.score === 'object') {
            return sub.score.overall || (sub.score.percentage ? `${sub.score.percentage}%` : '-');
        }
        return sub.score;
    };

    if (loading) return <div className={styles.container}>Loading history...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Lịch sử học tập</h1>
            
            <div className={styles.tableContainer}>
                {submissions.length === 0 ? (
                    <div className={styles.emptyState}>Bạn chưa nộp bài tập nào.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Bài học</th>
                                <th>Khóa học</th>
                                <th>Ngày nộp</th>
                                <th>Trạng thái</th>
                                <th className={styles.cellScore}>Điểm</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <tr key={sub._id} className={styles.row}>
                                    <td>
                                        <span className={styles.cellTitle}>{sub.lesson?.title}</span>
                                        <span className={styles.cellType}>{sub.lesson?.type}</span>
                                    </td>
                                    <td>{sub.lesson?.module?.course?.name}</td>
                                    <td>{new Date(sub.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                                            {sub.status === 'completed' ? 'Đã chấm' : 'Đang chờ'}
                                        </span>
                                    </td>
                                    <td className={styles.cellScore}>{renderScorePreview(sub)}</td>
                                    <td>
                                        <button 
                                            className="btn btn-outline"
                                            onClick={() => navigate(`/student/submissions/${sub._id}`)}
                                        >
                                            Chi tiết
                                        </button>
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

export default StudentSubmissionHistory;
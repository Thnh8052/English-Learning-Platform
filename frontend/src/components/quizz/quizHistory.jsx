import { useState, useEffect } from "react";
import api from "../../services/api";
import styles from "./quizHistory.module.css";

const QuizHistory = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get("/students/me/submissions/quiz");
                setSubmissions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <p>Đang tải lịch sử quiz...</p>;
    if (submissions.length === 0) return <p>Chưa có quiz nào được làm.</p>;

    return (
        <div className={styles.historyContainer}>
            <h2>Lịch sử Quiz của bạn</h2>
            <table className={styles.historyTable}>
                <thead>
                    <tr>
                        <th>Bài học</th>
                        <th>Ngày làm</th>
                        <th>Điểm (%)</th>
                        <th>Đúng/Tổng</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map(sub => (
                        <tr key={sub._id}>
                            <td>{sub.lesson.title}</td>
                            <td>{new Date(sub.updatedAt).toLocaleString()}</td>
                            <td>{sub.score?.percentage || 0}</td>
                            <td>{sub.score?.correct || 0}/{sub.score?.total || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QuizHistory;

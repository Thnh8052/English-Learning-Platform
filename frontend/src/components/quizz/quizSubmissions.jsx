import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

const QuizSubmissions = () => {
    const { lessonId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/lessons/${lessonId}/submissions`);
                setSubmissions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [lessonId]);

    if (loading) return <p>Đang tải...</p>;
    if (submissions.length === 0) return <p>Chưa có học viên nào làm bài.</p>;

    return (
        <div>
            <h2>Điểm Quiz - Giáo viên</h2>
            <table>
                <thead>
                    <tr>
                        <th>Học viên</th>
                        <th>Ngày làm</th>
                        <th>Điểm (%)</th>
                        <th>Đúng/Tổng</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map(sub => (
                        <tr key={sub._id}>
                            <td>{sub.student.name}</td>
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

export default QuizSubmissions;

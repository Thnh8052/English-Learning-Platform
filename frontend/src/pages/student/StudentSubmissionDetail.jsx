import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentHistory.module.css';

// Map tên key sang nhãn hiển thị đẹp hơn
const LABEL_MAP = {
    fluency: 'Fluency & Coherence',
    vocabulary: 'Lexical Resource',
    grammar: 'Grammar Range & Accuracy',
    pronunciation: 'Pronunciation',
    task_response: 'Task Response',
    coherence: 'Coherence & Cohesion'
};

const StudentSubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/submissions/${id}`);
                setSubmission(res.data);
            } catch (error) {
                console.error("Error:", error);
                alert("Không thể tải chi tiết bài nộp.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // --- HÀM XỬ LÝ ĐƯỜNG DẪN AUDIO (QUAN TRỌNG) ---
    const getAudioSrc = (path) => {
        if (!path) return '';
        // 1. Nếu là link online (Cloudinary/S3) -> Giữ nguyên
        if (path.startsWith('http')) return path;

        // 2. Xử lý đường dẫn Local:
        // Đổi dấu gạch ngược '\' (Windows) thành '/'
        let cleanPath = path.replace(/\\/g, '/');
        
        // Xóa dấu '/' ở đầu nếu có để tránh trùng lặp
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

        // Ghép với Base URL của Server (VD: http://localhost:5000/)
        // api.defaults.baseURL thường là 'http://localhost:5000/api', ta cần lấy root domain
        // Cách an toàn nhất: Hardcode hoặc lấy từ biến môi trường, hoặc cắt chuỗi từ baseURL
        // Giả sử api.defaults.baseURL là 'http://localhost:5000/api' -> lấy 'http://localhost:5000'
        
        const baseUrl = api.defaults.baseURL.replace('/api', ''); 
        return `${baseUrl}/${cleanPath}`;
    };

    if (loading) return <div className={styles.container}>Đang tải...</div>;
    if (!submission) return <div className={styles.container}>Không tìm thấy dữ liệu.</div>;

    const { lesson, score, feedback, status, content, answers } = submission;

    // --- 1. RENDER KẾT QUẢ ĐÁNH GIÁ ---
    const renderAssessment = () => {
        if (score === undefined || score === null) return null;

        // A. Điểm đơn
        if (typeof score !== 'object') {
            return (
                <div className={styles.scoreSingle}>
                    <span>Điểm số:</span> <strong>{score}</strong>
                </div>
            );
        }

        // B. Quiz
        if (score.total !== undefined) {
            return (
                <div className={styles.scoreGrid}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>Câu đúng</span>
                        <div className={styles.scoreValue}>{score.correct}/{score.total}</div>
                    </div>
                    <div className={`${styles.scoreItem} ${styles.scoreOverall}`}>
                        <span className={styles.scoreLabel}>Kết quả</span>
                        <div className={styles.scoreValue}>{score.percentage ?? 0}%</div>
                    </div>
                </div>
            );
        }

        // C. Speaking/Writing
        const { overall, ...criteria } = score;
        return (
            <div>
                {overall !== undefined && (
                    <div className={styles.overallBadge}>
                        OVERALL BAND: <strong>{overall}</strong>
                    </div>
                )}
                <div className={styles.criteriaGrid}>
                    {Object.entries(criteria).map(([key, value]) => (
                        <div key={key} className={styles.criteriaItem}>
                            <span className={styles.criteriaLabel}>{LABEL_MAP[key] || key}</span>
                            <span className={styles.criteriaScore}>{(value !== null && value !== '') ? value : '-'}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- 2. RENDER BÀI LÀM CỦA HỌC SINH ---
    const renderStudentWork = () => {
// Case A: WRITING
        if (lesson?.type === 'assignment') {
            return (
                <div className={styles.writingPaper}>
                    <div className="prose-content" dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        }

        // Case B: SPEAKING
        if (lesson?.type === 'speaking_prompt') {
            if (!answers || answers.length === 0) return <div>Không tìm thấy file ghi âm.</div>;
            return (
                <div className={styles.audioList}>
                    {answers.map((ans, idx) => (
                        <div key={idx} className={styles.audioItem}>
                            <div className={styles.questionLabel}>
                                <strong>Question {idx + 1}:</strong> {ans.questionText}
                            </div>
                            {ans.audioUrl && (
                                <div className={styles.audioContainer}>
                                    <audio controls className={styles.audioPlayer} preload="metadata">
                                        <source src={getAudioSrc(ans.audioUrl)} />
                                    </audio>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // Case C: QUIZ
        if (lesson?.type === 'quiz') {
            const questions = lesson.questions || [];
            if (!answers || answers.length === 0) return <div>Chưa có dữ liệu câu trả lời.</div>;

            return (
                <div className={styles.quizReviewList}>
                     {answers.map((ans, idx) => {
                        const originalQuestion = questions[ans.questionIndex] || {};
                        const options = originalQuestion.options || [];
                        return (
                            <div key={idx} className={`${styles.quizReviewItem} ${status === 'completed' ? (ans.isCorrect ? styles.correct : styles.wrong) : ''}`}>
                                <div className={styles.quizHeader}>
                                    <strong>Câu {idx + 1}: {originalQuestion.questionText || "Câu hỏi"}</strong>
                                    {status === 'completed' && (
                                        <span className={ans.isCorrect ? styles.tagSuccess : styles.tagError}>
                                            {ans.isCorrect ? " Đúng" : " Sai"}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.quizOptions}>
                                    {options.map((opt, optIdx) => {
                                        let optionClass = styles.optionNormal;
                                        if (ans.selectedOptionIndex === optIdx) {
                                            optionClass = ans.isCorrect ? styles.optionSelectedCorrect : styles.optionSelectedWrong;
                                        } else if (status === 'completed' && originalQuestion.correctAnswerIndex === optIdx) {
                                            optionClass = styles.optionCorrectAnswer;
                                        }
                                        return (
                                            <div key={optIdx} className={`${styles.optionRow} ${optionClass}`}>
                                                <span className={styles.optionLetter}>{String.fromCharCode(65 + optIdx)}.</span>
                                                <span>{opt}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return <div className={styles.textContent}>{content}</div>;
    };

    return (
        <div className={styles.container}>
            <div className={styles.detailHeader}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>&larr; Quay lại</button>
                <div className={styles.headerInfo}>
                    <span>Chi tiết bài nộp:</span>
                    <strong>{lesson?.title}</strong>
                </div>
            </div>

            {status === 'completed' ? (
                <div className={`${styles.sectionCard} ${styles.assessmentCard}`}>
                    <h3 className={styles.cardTitle} style={{color: '#166534'}}>Kết quả & Đánh giá</h3>
                    {feedback && (
                        <div className={styles.feedbackBox}>
                            <div className={styles.feedbackHeader}>💬 Nhận xét của giáo viên:</div>
                            <div className={styles.feedbackText}>{feedback}</div>
                        </div>
                    )}
                    <div className={styles.scoreSection}>{renderAssessment()}</div>
                </div>
            ) : (
                <div className={`${styles.sectionCard} ${styles.pendingCard}`}>
                    <h3 className={styles.cardTitle}>Trạng thái</h3>
                    <p>Bài làm đang chờ chấm điểm.</p>
                </div>
            )}

            <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Bài làm của bạn</h3>
                {renderStudentWork()}
            </div>
        </div>
    );
};

export default StudentSubmissionDetail;
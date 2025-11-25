import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import styles from './Grading.module.css';

const GradingDetail = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State cho form chấm điểm
    const [feedback, setFeedback] = useState('');
    // Giả sử chấm speaking theo 4 tiêu chí IELTS (0-9)
    const [scores, setScores] = useState({
        fluency: '',
        vocabulary: '',
        grammar: '',
        pronunciation: ''
    });

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/submissions/${submissionId}`);
                setSubmission(res.data);
                
                // Nếu đã chấm rồi thì fill dữ liệu cũ vào
                if (res.data.status === 'completed') {
                    setFeedback(res.data.feedback || '');
                    if (res.data.score && typeof res.data.score === 'object') {
                        setScores(res.data.score);
                    }
                }
            } catch (error) {
                console.error("Error fetching submission:", error);
                alert("Failed to load submission.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [submissionId]);

    const handleScoreChange = (e) => {
        const { name, value } = e.target;
        setScores(prev => ({ ...prev, [name]: value }));
    };

    const calculateOverall = () => {
        const vals = Object.values(scores).map(v => parseFloat(v) || 0);
        const sum = vals.reduce((a, b) => a + b, 0);
        return vals.length ? (sum / vals.length).toFixed(1) : 0;
    };

    const handleSubmitGrade = async () => {
        try {
            const overall = calculateOverall();
            const finalScore = { ...scores, overall };

            await api.post(`/submissions/${submissionId}/grade`, {
                score: finalScore,
                feedback
            });
            
            alert(`Grading saved! Overall Score: ${overall}`);
            navigate(-1); // Quay lại trang danh sách
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save grade.");
        }
    };

    if (loading) return <div className={styles.loading}>Loading submission details...</div>;
    if (!submission) return <div className={styles.error}>Submission not found.</div>;

    // Parse câu hỏi nếu nó là JSON string (do SpeakingBuilder lưu JSON)
    let questionData = [];
    try {
        questionData = JSON.parse(submission.questions || "[]");
    } catch (e) {
        // Fallback nếu không phải JSON
    }

    return (
        <div className={styles.detailContainer}>
            {/* --- CỘT TRÁI: BÀI LÀM CỦA HỌC SINH --- */}
            <div className={styles.leftPanel}>
                <div className={styles.panelHeader}>
                    <button onClick={() => navigate(-1)} className={styles.backBtn}>&larr; Back</button>
                    <h3>Student Submission</h3>
                </div>

                <div className={styles.studentProfileCard}>
                    <div className={styles.avatarLarge}>
                        {submission.student?.name?.charAt(0)}
                    </div>
                    <div>
                        <h4>{submission.student?.name}</h4>
                        <p>{submission.lesson?.title}</p>
                        <span className={styles.date}>Submitted: {new Date(submission.createdAt).toLocaleString()}</span>
                    </div>
                </div>

                <div className={styles.submissionContent}>
                    <h4>Student's Answer</h4>
                    
                    {/* Nếu là Speaking, backend sẽ gửi về các file audio */}
                    {/* Giả sử logic: backend trả về field audio_0, audio_1... hoặc map với câu hỏi */}
                    {/* Ở đây tôi demo hiển thị đơn giản dựa trên model Submission.content (URL file) */}
                    
                    {/* Cách 1: Nếu submission lưu từng file riêng trong 1 object/array */}
                    {questionData.length > 0 ? (
                        questionData.map((q, index) => (
                            <div key={index} className={styles.questionBlock}>
                                <p className={styles.questionText}><strong>Q{index + 1}:</strong> {q.text}</p>
                                
                                {/* Logic tìm file audio tương ứng */}
                                {/* Giả sử bạn cần update Backend để trả về URL file audio chuẩn xác */}
                                {/* Tạm thời hiển thị placeholder player */}
                                <audio controls className={styles.audioPlayer}>
                                    <source src={`${api.defaults.baseURL}/uploads/audio/${submission._id}_${index}.webm`} type="audio/webm" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ))
                    ) : (
                        // Fallback cho bài writing hoặc single file
                        <div className={styles.singleContent}>
                            {submission.lesson?.type === 'speaking_prompt' ? (
                                <audio controls src={submission.content} className={styles.audioPlayer} />
                            ) : (
                                <div className={styles.textContent}>{submission.content}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- CỘT PHẢI: FORM CHẤM ĐIỂM --- */}
            <div className={styles.rightPanel}>
                <div className={styles.panelHeader}>
                    <h3>Grading & Feedback</h3>
                </div>

                <div className={styles.gradingForm}>
                    <div className={styles.scoreGrid}>
                        <div className={styles.scoreInputGroup}>
                            <label>Fluency (0-9)</label>
                            <input type="number" name="fluency" min="0" max="9" step="0.5" value={scores.fluency} onChange={handleScoreChange} />
                        </div>
                        <div className={styles.scoreInputGroup}>
                            <label>Vocabulary (0-9)</label>
                            <input type="number" name="vocabulary" min="0" max="9" step="0.5" value={scores.vocabulary} onChange={handleScoreChange} />
                        </div>
                        <div className={styles.scoreInputGroup}>
                            <label>Grammar (0-9)</label>
                            <input type="number" name="grammar" min="0" max="9" step="0.5" value={scores.grammar} onChange={handleScoreChange} />
                        </div>
                        <div className={styles.scoreInputGroup}>
                            <label>Pronunciation (0-9)</label>
                            <input type="number" name="pronunciation" min="0" max="9" step="0.5" value={scores.pronunciation} onChange={handleScoreChange} />
                        </div>
                    </div>

                    <div className={styles.totalScore}>
                        <span>Overall Band Score:</span>
                        <strong>{calculateOverall()}</strong>
                    </div>

                    <div className={styles.feedbackSection}>
                        <label>Detailed Feedback</label>
                        <textarea 
                            rows="8" 
                            placeholder="Write your feedback to the student here..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        ></textarea>
                    </div>

                    <div className={styles.actionButtons}>
                        <button className="btn btn-primary-teacher" style={{width: '100%'}} onClick={handleSubmitGrade}>
                            Submit Grade
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingDetail;
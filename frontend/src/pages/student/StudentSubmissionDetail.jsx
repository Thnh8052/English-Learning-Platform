import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './StudentHistory.module.css';

const LABEL_MAP = {
    fluency: 'Fluency & Coherence',
    vocabulary: 'Lexical Resource',
    grammar: 'Grammar Range & Accuracy',
    pronunciation: 'Pronunciation',
    task_response: 'Task Response',
    coherence: 'Coherence & Cohesion',
    taskResponse: 'Task Response',
    lexical: 'Lexical Resource'
};

const SCORING_METHOD_MAP = {
    'average_per_question': 'Điểm trung bình cộng các câu hỏi',
    'overall': 'Đánh giá tổng quát',
    'manual': 'Giáo viên chấm thủ công'
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

    const getAudioSrc = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // Xử lý đường dẫn Windows (\) thành (/)
        let cleanPath = path.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

        const baseUrl = api.defaults.baseURL.replace('/api', ''); 
        return `${baseUrl}/${cleanPath}`;
    };

    if (loading) return <div className={styles.container}>Đang tải...</div>;
    if (!submission) return <div className={styles.container}>Không tìm thấy dữ liệu.</div>;

    const { lesson, score, feedback, status, content, answers, aiResult } = submission;
    
    // --- HÀM RENDER BOX ĐIỂM SỐ (DÙNG CHUNG CHO CẢ AI VÀ GIÁO VIÊN) ---
    const renderScoreCard = (scoreData, title, isOfficial) => {
        if (!scoreData) return null;

        // Xử lý Quiz
        if (lesson?.type === 'quiz' && scoreData.correct !== undefined) {
            return (
                <div className={styles.scoreGrid}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>Câu đúng</span>
                        <div className={styles.scoreValue}>{scoreData.correct}/{scoreData.total}</div>
                    </div>
                    <div className={`${styles.scoreItem} ${styles.scoreOverall}`}>
                        <span className={styles.scoreLabel}>Kết quả</span>
                        <div className={styles.scoreValue}>{scoreData.percentage ?? 0}%</div>
                    </div>
                </div>
            );
        }

        const overall = scoreData.overall;
        let criteria = {};
        
        try {
            criteria = typeof scoreData.details === 'string' 
                ? JSON.parse(scoreData.details) 
                : (scoreData.details || {});
        } catch (e) {
            criteria = {};
        }

        const gradingMethod = criteria.method;

        return (
            <div style={{ marginBottom: '20px' }}>
                {/* Header của Box điểm */}
                <h4 style={{ 
                    borderBottom: '1px solid #e5e7eb', 
                    paddingBottom: '8px', 
                    marginBottom: '12px',
                    color: isOfficial ? '#047857' : '#7c3aed', // Màu xanh lá cho GV, Tím cho AI
                    fontWeight: '700',
                    fontSize: '1.1rem'
                }}>
                    {title}
                </h4>

                {overall !== undefined && overall !== null && (
                    <div className={styles.overallBadge} style={{ backgroundColor: isOfficial ? '#10b981' : '#8b5cf6' }}>
                        Band Score: <strong>{overall}</strong>
                    </div>
                )}

                {gradingMethod && (
                    <div style={{ textAlign: 'center', marginBottom: '15px', color: '#6b7280', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        Phương pháp: <strong>{SCORING_METHOD_MAP[gradingMethod] || gradingMethod}</strong>
                    </div>
                )}
                {Object.keys(criteria).length > 0 && (
                    <div className={styles.criteriaGrid}>
                        {Object.entries(criteria).map(([key, value]) => {
                            if (key === 'overall' || key === 'method' || key === 'questionScores' || typeof value === 'object') return null;
                            return (
                                <div key={key} className={styles.criteriaItem}>
                                    <div className={styles.criteriaHeader}>
                                        <span className={styles.criteriaLabel}>
                                            {LABEL_MAP[key] || key}
                                        </span>
                                    </div>
                                    <div className={styles.criteriaBody}>
                                        <span className={styles.criteriaScore}>
                                            {(value !== null && value !== '') ? value : '-'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

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
            if (!answers || answers.length === 0) return <div className={styles.emptyState}>Không tìm thấy dữ liệu.</div>;
            return (
                <div className={styles.quizReviewList}>
                    {answers.map((ans, idx) => (
                        <div key={idx} className={styles.quizReviewItem}>
                            <div className={styles.quizHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <strong>Câu {idx + 1}: {ans.questionText}</strong>
                                    {ans.score > 0 && (
                                        <span className={styles.statusBadge} style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                                            AI: {ans.score}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Transcript */}
                            {ans.content && (
                                <div className={styles.textContent} style={{ marginTop: '10px' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#6b7280' }}>TRANSCRIPT:</strong>
                                    <p style={{ margin: 0 }}>{ans.content}</p>
                                </div>
                            )}
                            
                            {/* AI Feedback */}
                            {ans.feedback && (
                                <div style={{ marginTop: '10px', padding: '10px', background: '#ecfdf5', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                                    <strong style={{ color: '#047857', fontSize: '0.9rem' }}>🤖 AI Nhận xét:</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: '#064e3b' }}>{ans.feedback}</p>
                                </div>
                            )}
                            
                            {/* Audio Player */}
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
            if (!answers) return <div className={styles.emptyState}>Chưa có dữ liệu.</div>;
            return (
                <div className={styles.quizReviewList}>
                    {answers.map((ans, idx) => {
                        const originalQuestion = questions[ans.questionIndex] || {};
                        const options = originalQuestion.options || [];
                        return (
                            <div key={idx} className={`${styles.quizReviewItem} ${status === 'completed' ? (ans.isCorrect ? styles.correct : styles.wrong) : ''}`}>
                                <div className={styles.quizHeader}>
                                    <strong>Câu {idx + 1}: {originalQuestion.questionText}</strong>
                                    {status === 'completed' && (
                                        <span className={ans.isCorrect ? styles.tagSuccess : styles.tagError}>
                                            {ans.isCorrect ? "✓ Đúng" : "✗ Sai"}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.quizOptions}>
                                    {options.map((opt, optIdx) => (
                                        <div key={optIdx} className={`${styles.optionRow} ${ans.selectedOptionIndex === optIdx ? (ans.isCorrect ? styles.optionSelectedCorrect : styles.optionSelectedWrong) : (status === 'completed' && originalQuestion.correctAnswerIndex === optIdx ? styles.optionCorrectAnswer : styles.optionNormal)}`}>
                                            <span className={styles.optionLetter}>{String.fromCharCode(65 + optIdx)}.</span>
                                            <span>{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return <div className={styles.textContent}>{content}</div>;
    };

    const renderImprovementTips = () => {
        const hasTips = aiResult?.improvementTips?.length > 0;
        if (!hasTips) return null;
        return (
            <div className={styles.tipsSection}>
                <h4>💡 Mẹo nâng Band điểm:</h4>
                <ul className={styles.tipsList}>
                    {aiResult.improvementTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.detailHeader}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>← Quay lại</button>
                <div className={styles.headerInfo}>
                    <span>Chi tiết bài nộp:</span>
                    <strong>{lesson?.title}</strong>
                </div>
            </div>

            {/* --- KHU VỰC HIỂN THỊ KẾT QUẢ --- */}
            
            {/* 1. Nếu đã có giáo viên chấm -> Hiển thị Box chính thức + Box AI (tham khảo) */}
            {status === 'completed' && score?.teacher && (
                <div className={`${styles.sectionCard} ${styles.assessmentCard}`}>
                    <h3 className={styles.cardTitle}>🏆 Kết quả Chính thức</h3>
                    
                    {feedback && (
                        <div className={styles.feedbackBox}>
                            <div className={styles.feedbackHeader}>Lời phê của giáo viên:</div>
                            <div className={styles.feedbackText}>{feedback}</div>
                        </div>
                    )}

                    {/* Render điểm giáo viên */}
                    {renderScoreCard(score.teacher, "Đánh giá của Giáo viên", true)}

                    <hr style={{ margin: '20px 0', border: '0', borderTop: '1px dashed #cbd5e1' }} />
                    
                    {/* Render điểm AI (Tham khảo) */}
                    {score?.ai && renderScoreCard(score.ai, "🤖 AI Chấm tham khảo", false)}
                    
                    {renderImprovementTips()}
                </div>
            )}

            {/* 2. Nếu CHƯA chấm xong nhưng đã có AI chấm (Trạng thái ai_graded) */}
            {status === 'ai_graded' && (
                <div className={`${styles.sectionCard} ${styles.aiPendingCard}`}>
                    <h3 className={styles.cardTitle}>🤖 Đánh giá từ Trợ lý AI</h3>
                    
                    {aiResult?.isOffTopic && (
                        <div className={styles.offTopicWarning}>
                            <strong>⚠️ Lạc đề:</strong>
                            <p>{aiResult.offTopicAnalysis}</p>
                        </div>
                    )}

                    {/* Chỉ render điểm AI */}
                    {renderScoreCard(score?.ai, "AI Chấm dự kiến", false)}

                    {submission.aiFeedback && (
                        <div className={styles.aiFeedbackBox}>
                            <div className={styles.aiFeedbackHeader}>Phân tích tổng quan:</div>
                            <div className={styles.feedbackText}>{submission.aiFeedback}</div>
                        </div>
                    )}

                    {renderImprovementTips()}
                </div>
            )}

            {/* 3. Nếu chưa có gì cả */}
            {status === 'submitted' && (
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
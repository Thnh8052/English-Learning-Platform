import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import styles from './Grading.module.css';

// Cấu hình tiêu chí chấm điểm cho từng loại bài
const GRADING_CRITERIA = {
    speaking_prompt: [
        { key: 'fluency', label: 'Fluency & Coherence' },
        { key: 'vocabulary', label: 'Lexical Resource' },
        { key: 'grammar', label: 'Grammar Range & Accuracy' },
        { key: 'pronunciation', label: 'Pronunciation' }
    ],
    assignment: [ // Writing
        { key: 'task_response', label: 'Task Response / Achievement' },
        { key: 'coherence', label: 'Coherence & Cohesion' },
        { key: 'vocabulary', label: 'Lexical Resource' },
        { key: 'grammar', label: 'Grammar Range & Accuracy' }
    ],
    default: [
        { key: 'score', label: 'Score (0-10)' }
    ]
};

const GradingDetail = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [feedback, setFeedback] = useState('');
    const [aiScores, setAiScores] = useState({});
    const [scores, setScores] = useState({});
    const [criteriaList, setCriteriaList] = useState([]);
    

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/submissions/${submissionId}`);
                const sub = res.data;
                setSubmission(sub);
                
                // Xác định danh sách tiêu chí
                const type = sub.lesson?.type || 'default';
                const criteria = GRADING_CRITERIA[type] || GRADING_CRITERIA['default'];
                setCriteriaList(criteria);

                setFeedback(sub.feedback || '');

                //ĐIỂM AI
                let aiData = {};
                if (sub.score?.ai?.details) {
                    Object.entries(sub.score.ai.details).forEach(([key, val]) => {
                        const scoreVal = (typeof val === 'object' && val?.score) ? val.score : val;
                        aiData[key] = scoreVal; 
                        aiData[toCamelCase(key)] = scoreVal;
                    });
                }
                setAiScores(aiData);

                //ĐIỂM Teacher
                let teacherInputScores = {};

                if (sub.score?.teacher?.details) {
                    //Giáo viên đã chấm -> Load điểm giáo viên
                    const details = typeof sub.score.teacher.details === 'string' 
                        ? JSON.parse(sub.score.teacher.details) 
                        : sub.score.teacher.details;
                    
                    const { overall, ...rest } = details;
                    teacherInputScores = rest;
                } else {
                    // Chưa chấm ->điểm AI 
                    teacherInputScores = { ...aiData };
                }
                const initialFormState = {};
                criteria.forEach(c => {
                    initialFormState[c.key] = teacherInputScores[c.key] || teacherInputScores[toCamelCase(c.key)] || '';
                });
                
                setScores(initialFormState);

            } catch (error) {
                console.error("Error fetching submission:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [submissionId]);

    const toCamelCase = (str) => {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    };

    const getAudioSrc = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        let cleanPath = path.replace(/\\/g, '/');
        
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

        const baseUrl = api.defaults.baseURL.replace('/api', ''); 
        return `${baseUrl}/${cleanPath}`;
    };

    const handleScoreChange = (e) => {
        const { name, value } = e.target;
        setScores(prev => ({ ...prev, [name]: value }));
    };

    // Tính điểm trung bình (Overall Band)
    const calculateOverall = () => {
        const vals = Object.values(scores).map(v => parseFloat(v));
        const validVals = vals.filter(v => !isNaN(v));
        
        if (validVals.length === 0) return 0;

        const sum = validVals.reduce((a, b) => a + b, 0);
        
        if (criteriaList.length === 1) return sum; 
        
        const average = sum / validVals.length;
        const roundedScore = Math.round(average * 2) / 2;

        return roundedScore.toFixed(1);
    };

    const handleSubmitGrade = async () => {
        try {
            const overall = calculateOverall();
            const finalScore = { ...scores, overall };

            await api.post(`/submissions/${submissionId}/grade`, {
                score: finalScore,
                feedback
            });
            
            alert(`Grading saved successfully! Result: ${overall}`);
            navigate(-1);
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save grade.");
        }
    };

    // --- RENDER HELPERS ---
    const renderStudentContent = () => {
        const type = submission.lesson?.type;
        
        // Case 1: Speaking (Có danh sách câu hỏi & Audio)
        if (type === 'speaking_prompt') {
            if (submission.answers && submission.answers.length > 0) {
                 return submission.answers.map((ans, index) => (
                    <div key={index} className={styles.questionBlock}>
                        <p className={styles.questionText}><strong>Q{index + 1}:</strong> {ans.questionText}</p>                       
                        {ans.audioUrl ? (
                            <audio controls className={styles.audioPlayer} preload="metadata">
                                <source src={getAudioSrc(ans.audioUrl)} />
                                Trình duyệt không hỗ trợ file này.
                            </audio>
                        ) : <span className={styles.audioError}>Audio missing</span>}
                    </div>
                 ));
            }
                        let questionData = [];
            try {
                questionData = typeof submission.questions === 'string' 
                    ? JSON.parse(submission.questions) 
                    : (submission.questions || []); 
            } catch (e) {}

            if (questionData.length > 0) {
                return questionData.map((q, index) => (
                    <div key={index} className={styles.questionBlock}>
                        <p className={styles.questionText}><strong>Q{index + 1}:</strong> {q.text}</p>
                        <audio controls className={styles.audioPlayer}>
                             <source src={getAudioSrc(submission.content)} />
                        </audio>
                    </div>
                ))
            }

            return (
                <div className={styles.singleContent}>
                    <p>Audio Submission:</p>
                    <audio controls src={getAudioSrc(submission.content)} className={styles.audioPlayer} />
                </div>
            );
        }

        // Case 2: Writing (Assignment) - Render HTML
if (type === 'assignment') {
    return (
        <div className={styles.writingContent}>
            <div 
                className="prose-content" 
                dangerouslySetInnerHTML={{ __html: submission.content }} 
            />
        </div>
    );
}

        // Default: Text plain
        return <div className={styles.textContent}>{submission.content}</div>;
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!submission) return <div className={styles.error}>Not found.</div>;

    return (
        <div className={styles.detailContainer}>
            <div className={styles.leftPanel}>
                <div className={styles.panelHeader}>
                    <button onClick={() => navigate(-1)} className={styles.backBtn}>&larr; Back</button>
                </div>

                <div className={styles.studentProfileCard}>
                    <div className={styles.avatarLarge}>{submission.student?.name?.charAt(0)}</div>
                    <div>
                        <h4>{submission.student?.name}</h4>
                        <p>{submission.lesson?.title}</p>
                        <span className={styles.date}>Status: <strong>{submission.status}</strong></span>
                    </div>
                </div>

                <div className={styles.submissionContent}>
                    {renderStudentContent()}
                </div>
                    {submission.aiFeedback && (
                        <div className={styles.aiResultCard}>
                            {submission.score?.ai?.isOffTopic && (
                            <div className={styles.offTopicWarning}>
                                CẢNH BÁO TỪ AI: BÀI LÀM CÓ DẤU HIỆU LẠC ĐỀ
                                <p className={styles.offTopicDetail}>
                                    {submission.score.ai.offTopicAnalysis}
                                </p>
                            </div>
                        )}
                            <div className={styles.aiHeader}>
                                <span>AI Assistant Suggestion</span>
                            </div>
                            <div className={styles.aiBody}>
                                <p><strong>Suggested Score:</strong> {submission.score?.ai?.overall || 'N/A'}</p>
                                <div className={styles.aiText}>{submission.aiFeedback}</div>
                            </div>
                        </div>
                    )}
            </div>

            {/* --- CỘT PHẢI: FORM CHẤM --- */}
            <div className={styles.rightPanel}>
                <div className={styles.panelHeader}>
                    <h3>Teacher's Final Grade</h3>
                </div>

                <div className={styles.gradingForm}>
                    <div className={styles.scoreGrid}>
                        {criteriaList.map((crit) => (
                            <div key={crit.key} className={styles.scoreInputGroup}>
                                <div className={styles.labelRow}>
                                    <label>{crit.label}</label>
                                        {aiScores[toCamelCase(crit.key)] !== undefined && (
                                        <span className={styles.aiBadge} title="AI Suggestion">
                                            AI: {aiScores[toCamelCase(crit.key)]}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    name={crit.key}
                                    min="0" 
                                    max="9" 
                                    step="0.5" 
                                    value={scores[crit.key] || ''} 
                                    onChange={handleScoreChange} 
                                    placeholder="0-9"
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.totalScore}>
                        <span>Overall Score:</span>
                        <strong>{calculateOverall()}</strong>
                    </div>

                    <div className={styles.feedbackSection}>
                        <label>Detailed Feedback</label>
                        <textarea 
                            rows="10" 
                            placeholder="Nhận xét chi tiết về bài làm..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        ></textarea>
                    </div>

                    <div className={styles.actionButtons}>
                        <button className="btn btn-primary-teacher" onClick={handleSubmitGrade}>
                            Submit Grade
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingDetail;
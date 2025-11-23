import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
// Tái sử dụng CSS của QuizBuilder cho nhanh, hoặc tạo file mới nếu muốn
import styles from './quizBuilder.module.css'; 

const SpeakingBuilder = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    
    const [questions, setQuestions] = useState([]);
    const [lessonTitle, setLessonTitle] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');
    const [loading, setLoading] = useState(true);

    // 1. Load dữ liệu
    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                setLessonTitle(res.data.title);
                setQuestions(res.data.questions || []);
            } catch (err) {
                alert("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);
    
    // 2. Thêm câu hỏi Speaking (Gọi API Mới)
    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestionText.trim()) return;

        try {
            // Gọi route riêng cho speaking
            const res = await api.post(`/lessons/${lessonId}/speaking-questions`, { 
                questionText: newQuestionText 
            });
            
            setQuestions(prev => [...prev, res.data]);
            setNewQuestionText(''); // Reset form
        } catch (error) {
            console.error(error);
            alert("Failed to add question.");
        }
    };

    // 3. Xóa câu hỏi Speaking (Gọi API Mới)
    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await api.delete(`/lessons/${lessonId}/speaking-questions/${questionId}`);
            setQuestions(prev => prev.filter(q => q._id !== questionId));
        } catch (error) {
            alert("Failed to delete question.");
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(-1)} className="btn btn-outline">← Back</button>
                <h2>Speaking Builder: {lessonTitle}</h2>
            </div>
            
            <div className={styles.builderLayout}>
                {/* CỘT TRÁI: Form nhập liệu đơn giản */}
                <div className={styles.formSection}>
                    <form onSubmit={handleAddQuestion} className={styles.form}>
                        <h3>Add Speaking Question</h3>
                        <div className="form-group">
                            <label>Question / Prompt</label>
                            <textarea 
                                className="form-input" 
                                rows="4"
                                value={newQuestionText} 
                                onChange={e => setNewQuestionText(e.target.value)}
                                placeholder="E.g: Describe a memorable trip you took..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary-teacher w-100">
                            Add Question
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: Danh sách câu hỏi */}
                <div className={styles.listSection}>
                    <h3>Questions List ({questions.length})</h3>
                    {questions.length === 0 && <p style={{color: '#666'}}>No questions yet.</p>}
                    
                    {questions.map((q, idx) => (
                        <div key={q._id} className={styles.questionItem}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem'}}>
                                <strong>Question {idx + 1}</strong>
                                <button 
                                    onClick={() => handleDeleteQuestion(q._id)} 
                                    className="btn btn-danger-outline btn-sm"
                                >
                                    Delete
                                </button>
                            </div>
                            <p style={{margin: 0, whiteSpace: 'pre-wrap'}}>{q.questionText}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SpeakingBuilder;
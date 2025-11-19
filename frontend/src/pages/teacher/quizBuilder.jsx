import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './quizBuilder.module.css'; // Sẽ tạo file này sau

const QuizBuilder = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [lessonTitle, setLessonTitle] = useState('');

    // State cho form thêm câu hỏi
    const [qText, setQText] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [option3, setOption3] = useState('');
    const [option4, setOption4] = useState('');
    const [correctIndex, setCorrectIndex] = useState(0);

    // 1. Load dữ liệu bài học và câu hỏi hiện có
    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                setLessonTitle(res.data.title);
                setQuestions(res.data.questions || []);
            } catch (err) {
                alert("Failed to load quiz data");
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    // 2. Xử lý thêm câu hỏi
    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!qText || !option1 || !option2) {
            return alert("Please enter question and at least 2 options");
        }

        const newQuestionData = {
            questionText: qText,
            options: [option1, option2, option3, option4].filter(opt => opt !== ''), // Loại bỏ option rỗng
            correctAnswerIndex: Number(correctIndex)
        };

        try {
            const res = await api.post(`/lessons/${lessonId}/questions`, newQuestionData);
            // Thêm câu hỏi mới vào danh sách hiển thị
            setQuestions([...questions, res.data]);
            
            // Reset form
            setQText(''); setOption1(''); setOption2(''); setOption3(''); setOption4(''); setCorrectIndex(0);
        } catch (err) {
            console.error(err);
            alert("Failed to add question");
        }
    };

    // 3. Xử lý xóa câu hỏi
    const handleDeleteQuestion = async (questionId) => {
        if(!confirm("Delete this question?")) return;
        try {
            await api.delete(`/lessons/${lessonId}/questions/${questionId}`);
            setQuestions(questions.filter(q => q._id !== questionId));
        } catch (err) {
            alert("Failed to delete");
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(-1)} className="btn btn-outline">← Back</button>
                <h2>Quiz Builder: {lessonTitle}</h2>
            </div>

            <div className={styles.layout}>
                {/* CỘT TRÁI: Form nhập liệu */}
                <div className={styles.formCard}>
                    <h3>Add New Question</h3>
                    <form onSubmit={handleAddQuestion}>
                        <div className="form-group">
                            <label>Question Text</label>
                            <textarea 
                                className="form-input" 
                                rows="3"
                                value={qText} 
                                onChange={e => setQText(e.target.value)}
                                placeholder="Enter your question here..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Options</label>
                            <input className="form-input mb-2" placeholder="Option 1 (A)" value={option1} onChange={e => setOption1(e.target.value)} required />
                            <input className="form-input mb-2" placeholder="Option 2 (B)" value={option2} onChange={e => setOption2(e.target.value)} required />
                            <input className="form-input mb-2" placeholder="Option 3 (C)" value={option3} onChange={e => setOption3(e.target.value)} />
                            <input className="form-input mb-2" placeholder="Option 4 (D)" value={option4} onChange={e => setOption4(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Correct Answer</label>
                            <select 
                                className="form-select" 
                                value={correctIndex} 
                                onChange={e => setCorrectIndex(e.target.value)}
                            >
                                <option value={0}>Option 1</option>
                                <option value={1}>Option 2</option>
                                <option value={2}>Option 3</option>
                                <option value={3}>Option 4</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary-teacher w-100">
                            Add Question
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: Danh sách câu hỏi đã tạo */}
                <div className={styles.previewList}>
                    <h3>Questions ({questions.length})</h3>
                    {questions.length === 0 && <p style={{color: '#666'}}>No questions yet.</p>}
                    
                    {questions.map((q, idx) => (
                        <div key={q._id} className={styles.questionItem}>
                            <div className={styles.qHeader}>
                                <strong>{idx + 1}. {q.questionText}</strong>
                                <button 
                                    onClick={() => handleDeleteQuestion(q._id)} 
                                    className="btn btn-danger-outline btn-sm"
                                >
                                    Delete
                                </button>
                            </div>
                            <ul className={styles.optionsList}>
                                {q.options.map((opt, i) => (
                                    <li key={i} className={i === q.correctAnswerIndex ? styles.correct : ''}>
                                        {opt} {i === q.correctAnswerIndex && "✅"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizBuilder;
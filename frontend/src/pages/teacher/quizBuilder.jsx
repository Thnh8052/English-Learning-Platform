import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './quizBuilder.module.css';
import AiGeneratorModal from './AiGeneratorModal.jsx';

const QuizBuilder = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [lessonTitle, setLessonTitle] = useState('');
    
    // State AI Modal
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // State Form thủ công
    const [qText, setQText] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [option3, setOption3] = useState('');
    const [option4, setOption4] = useState('');
    const [correctIndex, setCorrectIndex] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                setLessonTitle(res.data.title);
                setQuestions(res.data.questions || []);
            } catch (err) {
                alert("Lỗi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    const handleToggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Chọn tất cả / Bỏ chọn tất cả
    const handleSelectAll = () => {
        if (selectedIds.length === questions.length) {
            setSelectedIds([]); // Bỏ chọn hết
        } else {
            setSelectedIds(questions.map(q => q._id)); // Chọn hết
        }
    };

    // Xóa những câu đã chọn
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} câu hỏi đã chọn?`)) return;

        try {
            await api.delete(`/lessons/${lessonId}/questions/bulk`, {
                data: { questionIds: selectedIds }
            });

            // Cập nhật UI
            setQuestions(questions.filter(q => !selectedIds.includes(q._id)));
            setSelectedIds([]);
            alert("Đã xóa thành công!");

        } catch (err) {
            console.error(err);
            alert("Lỗi khi xóa nhiều câu hỏi.");
        }
    };

    //CALLBACK KHI AI TẠO XONG
    const handleAiQuestionsReceived = async (aiData) => {
        try {
            //ấy mảng 'questions' từ object trả về
            const questionsArray = aiData.questions || aiData;

            if (!Array.isArray(questionsArray)) {
                throw new Error("AI response format error: Expected an array.");
            }
            // AI trả về: { question: "...", options: {A: "...", B: "..."}, correct: "A" }
            // DB cần: { questionText: "...", options: ["...", "..."], correctAnswerIndex: 0 }
            const promises = questionsArray.map(q => {
                const optionsList = Object.values(q.options || {});
                
                let correctIdx = 0;
                if (q.correct && typeof q.correct === 'string') {
                    const charCode = q.correct.toUpperCase().charCodeAt(0);
                    correctIdx = charCode - 65; // 'A' is 65
                }

                const formattedQuestion = {
                    questionText: q.question,
                    options: optionsList,
                    correctAnswerIndex: correctIdx >= 0 && correctIdx < 4 ? correctIdx : 0
                };

                return api.post(`/lessons/${lessonId}/questions`, formattedQuestion);
            });

            await Promise.all(promises);
            
            // Refresh lại danh sách (để lấy ID thật từ DB)
            const res = await api.get(`/lessons/${lessonId}`);
            setQuestions(res.data.questions);
            
            alert(`Đã thêm thành công ${questionsArray.length} câu hỏi!`);
        } catch (error) {
            console.error("Error processing AI questions:", error);
            alert("Lỗi khi lưu câu hỏi vào database. Kiểm tra console để xem chi tiết.");
        }
    };

    // --- LOGIC THỦ CÔNG ---
    const handleAddQuestion = async (e) => {
        e.preventDefault();
        const newQ = {
            questionText: qText,
            options: [option1, option2, option3, option4].filter(o => o !== ''),
            correctAnswerIndex: Number(correctIndex)
        };
        try {
            const res = await api.post(`/lessons/${lessonId}/questions`, newQ);
            setQuestions([...questions, res.data]);
            setQText(''); setOption1(''); setOption2(''); setOption3(''); setOption4(''); setCorrectIndex(0);
        } catch (err) { alert("Lỗi thêm câu hỏi"); }
    };

    const handleDeleteQuestion = async (id) => {
        if(!confirm("Xóa câu hỏi này?")) return;
        try {
            await api.delete(`/lessons/${lessonId}/questions/${id}`);
            setQuestions(questions.filter(q => q._id !== id));
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } catch (err) { alert("Lỗi xóa câu hỏi"); }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitleGroup}>
                    <button onClick={() => navigate(-1)} className={`${styles.btn} ${styles.btnOutline}`}>&larr; Back</button>
                    <h2>Quiz Builder: {lessonTitle}</h2>
                </div>
                <button onClick={() => setIsAiModalOpen(true)} className={`${styles.btn} ${styles.btnAi}`}>
                    ✨ Tạo bằng AI
                </button>
            </div>

            <div className={styles.layout}>
                <div className={styles.formCard}>
                    <h3>Thêm thủ công</h3>
                    <form onSubmit={handleAddQuestion}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nội dung câu hỏi</label>
                            <textarea className={styles.formTextarea} rows="3" value={qText} onChange={e => setQText(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Đáp án</label>
                            <input className={`${styles.formInput} ${styles.mb2}`} placeholder="A" value={option1} onChange={e => setOption1(e.target.value)} required />
                            <input className={`${styles.formInput} ${styles.mb2}`} placeholder="B" value={option2} onChange={e => setOption2(e.target.value)} required />
                            <input className={`${styles.formInput} ${styles.mb2}`} placeholder="C" value={option3} onChange={e => setOption3(e.target.value)} />
                            <input className={`${styles.formInput} ${styles.mb2}`} placeholder="D" value={option4} onChange={e => setOption4(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Đáp án đúng</label>
                            <select className={styles.formSelect} value={correctIndex} onChange={e => setCorrectIndex(e.target.value)}>
                                <option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option>
                            </select>
                        </div>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.w100}`}>Thêm câu hỏi</button>
                    </form>
                </div>

                <div className={styles.previewList}>
                    
                    <div className={styles.bulkActionsHeader}>
                        <div className={styles.checkboxWrapper} onClick={handleSelectAll}>
                            <input 
                                type="checkbox" 
                                className={styles.checkbox}
                                checked={questions.length > 0 && selectedIds.length === questions.length}
                                readOnly
                            />
                            <span>
                                {selectedIds.length > 0 
                                    ? `Đã chọn ${selectedIds.length} câu` 
                                    : `Danh sách câu hỏi (${questions.length})`}
                            </span>
                        </div>

                        {selectedIds.length > 0 && (
                            <button onClick={handleBulkDelete} className={`${styles.btn} ${styles.btnDanger} ${styles.fadeIn}`}>
                                Xóa {selectedIds.length} câu
                            </button>
                        )}
                    </div>

                    {questions.map((q, idx) => (
                        <div key={q._id} className={styles.questionItem}>
                            <div className={styles.questionItemContent}>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    style={{ marginTop: '5px' }}
                                    checked={selectedIds.includes(q._id)}
                                    onChange={() => handleToggleSelect(q._id)}
                                />

                                <div className={styles.questionMain}>
                                    <div className={styles.qHeader}>
                                        <span><strong>{idx + 1}.</strong> {q.questionText}</span>
                                        <button onClick={() => handleDeleteQuestion(q._id)} className={`${styles.btn} ${styles.btnDelete}`}>Xóa</button>
                                    </div>
                                    <ul className={styles.optionsList}>
                                        {q.options.map((opt, i) => (
                                            <li key={i} className={i === q.correctAnswerIndex ? styles.correct : ''}>
                                                {String.fromCharCode(65 + i)}. {opt} {i === q.correctAnswerIndex && "✅"}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {questions.length === 0 && <p style={{textAlign:'center', color:'#9ca3af'}}>Chưa có câu hỏi nào.</p>}
                </div>
            </div>

            <AiGeneratorModal 
                isOpen={isAiModalOpen} 
                onClose={() => setIsAiModalOpen(false)} 
                onQuestionsReceived={handleAiQuestionsReceived} 
            />
        </div>
    );
};

export default QuizBuilder;
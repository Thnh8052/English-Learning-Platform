import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './quizAnswers.module.css';

const QuizAnswers = ({ lesson }) => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Lưu dạng { indexCâu: indexĐápÁn }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null); // Lưu kết quả trả về từ server

    const questions = lesson.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    // Xử lý khi chọn đáp án
    const handleOptionSelect = (optionIndex) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    // Chuyển câu hỏi
    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // Nộp bài
    const handleSubmit = async () => {
        // Kiểm tra xem đã làm hết chưa (tùy chọn)
        if (Object.keys(userAnswers).length < questions.length) {
            if (!window.confirm("Bạn chưa trả lời hết các câu hỏi. Bạn có chắc muốn nộp bài?")) return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/submissions/quiz', {
                lessonId: lesson._id,
                userAnswers: userAnswers
            });
            setResult(res.data); // Lưu kết quả để hiển thị màn hình điểm số
        } catch (error) {
            console.error("Submit quiz failed:", error);
            alert("Có lỗi xảy ra khi nộp bài.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- MÀN HÌNH KẾT QUẢ ---
    if (result) {
        return (
            <div className={styles.resultContainer}>
                <div className={styles.scoreCard}>
                    <h2>🎉 Quiz Completed!</h2>
                    <div className={styles.scoreCircle}>
                        <span>{result.score.percentage}%</span>
                    </div>
                    <p>You got <strong>{result.score.correct}</strong> out of <strong>{result.score.total}</strong> questions correct.</p>
                    
                    <button 
                        className="btn btn-primary-student" 
                        onClick={() => navigate(`/courses/${lesson.module.course}`)} // Quay về trang khóa học
                    >
                        Back to Course
                    </button>
                    
                    {/* (Nâng cao) Có thể hiển thị chi tiết đúng sai từng câu ở đây */}
                </div>
            </div>
        );
    }

    // --- MÀN HÌNH LÀM BÀI ---
    if (questions.length === 0) return <p>This quiz has no questions yet.</p>;

    return (
        <div className={styles.playerContainer}>
            {/* Progress Bar */}
            <div className={styles.progressBar}>
                <div 
                    className={styles.progressFill} 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className={styles.questionCard}>
                <span className={styles.questionCount}>Question {currentQuestionIndex + 1} / {questions.length}</span>
                <h3 className={styles.questionText}>{currentQuestion.questionText}</h3>

                <div className={styles.optionsList}>
                    {currentQuestion.options.map((option, idx) => (
                        <div 
                            key={idx} 
                            className={`${styles.optionItem} ${userAnswers[currentQuestionIndex] === idx ? styles.selected : ''}`}
                            onClick={() => handleOptionSelect(idx)}
                        >
                            <span className={styles.optionLabel}>{String.fromCharCode(65 + idx)}</span>
                            <span className={styles.optionText}>{option}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <button 
                    className="btn btn-outline" 
                    onClick={handlePrev} 
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </button>

                {isLastQuestion ? (
                    <button 
                        className="btn btn-primary-student" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary-student" 
                        onClick={handleNext}
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizAnswers;
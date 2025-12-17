import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './quizAnswers.module.css';

const QuizAnswers = ({ lesson }) => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

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
            
            // --- SỬA LỖI Ở ĐÂY ---
            const submissionData = res.data.submission || res.data;
            setResult(submissionData);

            alert("Nộp bài thành công!");
            
            // Reload trang để LessonView nhận diện trạng thái 'completed' và hiển thị màn hình kết quả chung
            window.location.reload(); 

        } catch (error) {
            console.error("Submit quiz failed:", error);
            alert("Có lỗi xảy ra khi nộp bài.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- MÀN HÌNH KẾT QUẢ ---
    // Hiển thị trong lúc chờ reload hoặc nếu reload thất bại
    if (result) {
        const percentage = result.score?.percentage ?? 0;
        const correct = result.score?.correct ?? 0;
        const total = result.score?.total ?? 0;

        return (
            <div className={styles.resultContainer}>
                <div className={styles.scoreCard}>
                    <h2>🎉 Quiz Completed!</h2>
                    <div className={styles.scoreCircle}>
                        <span>{percentage}%</span>
                    </div>
                    <p>Bạn trả lời đúng <strong>{correct}</strong> trên tổng số <strong>{total}</strong> câu.</p>
                    
                    <button 
                        className="btn btn-primary-student" 
                        onClick={() => window.location.reload()}
                    >
                        Xem chi tiết kết quả
                    </button>
                </div>
            </div>
        );
    }

    // --- MÀN HÌNH LÀM BÀI ---
    if (questions.length === 0) return <p>Bài trắc nghiệm chưa có câu hỏi.</p>;

    return (
        <div className={styles.playerContainer}>
            <div className={styles.progressBar}>
                <div 
                    className={styles.progressFill} 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className={styles.questionCard}>
                <span className={styles.questionCount}>Câu hỏi {currentQuestionIndex + 1} / {questions.length}</span>
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
                    Quay lại
                </button>

                {isLastQuestion ? (
                    <button 
                        className="btn btn-primary-student" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary-student" 
                        onClick={handleNext}
                    >
                        Tiếp theo
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizAnswers;
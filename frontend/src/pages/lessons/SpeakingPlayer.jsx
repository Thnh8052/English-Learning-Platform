import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AudioRecorder from '../../components/exam/audioRecord.jsx'; // Đảm bảo đường dẫn đúng
import styles from './speakingPlayer.module.css';

const SpeakingPlayer = ({ lesson }) => {
    const navigate = useNavigate();
    
    // State quản lý
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [recordings, setRecordings] = useState({}); // Object lưu: { 0: blob, 1: blob ... }
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lấy danh sách câu hỏi từ props
    const questions = lesson?.questions || [];
    const currentQuestion = questions[currentQIndex];
    const isLastQuestion = currentQIndex === questions.length - 1;

    // --- HANDLERS ---

    // Khi ghi âm xong 1 câu, lưu blob vào state theo index
    const handleRecordingComplete = (blob) => {
        setRecordings(prev => ({
            ...prev,
            [currentQIndex]: blob
        }));
    };

    const handleNext = () => {
        // (Tùy chọn) Bắt buộc ghi âm mới cho qua câu sau
        if (!recordings[currentQIndex]) {
            alert("Vui lòng ghi âm câu trả lời trước khi sang câu tiếp theo.");
            return;
        }
        setCurrentQIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // 1. Validate số lượng câu trả lời
        const answeredCount = Object.keys(recordings).length;
        const totalQuestions = questions.length;

        if (answeredCount < totalQuestions) {
            const confirmSkip = window.confirm(
                `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu hỏi. Các câu bỏ trống sẽ bị 0 điểm. Bạn có chắc chắn muốn nộp không?`
            );
            if (!confirmSkip) return;
        } else {
            if (!window.confirm("Bạn có chắc chắn muốn nộp bài không?")) return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            
            // Thông tin cơ bản
            formData.append('lessonId', lesson._id);
            // formData.append('userId', user.id); // Không cần thiết nếu backend lấy từ req.user (token)

            // Loop qua state recordings để đóng gói file
            // QUAN TRỌNG: Key phải là `audio_${index}` để khớp với Backend
            Object.keys(recordings).forEach(key => {
                const index = parseInt(key); // Đảm bảo index là số
                const blob = recordings[key];
                
                // Append file: key, file, filename
                formData.append(`audio_${index}`, blob, `answer_q${index}.webm`);
            });

            // Gửi request (Header 'Content-Type': 'multipart/form-data' thường được axios tự xử lý, nhưng khai báo rõ cũng tốt)
            const response = await api.post('/submissions/speaking', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log("Submission success:", response.data);
            alert("Nộp bài thành công! Hệ thống đang chấm điểm...");
            
            // Điều hướng về trang danh sách bài học hoặc trang kết quả
            navigate(`/courses/${lesson.module.course}`); // Hoặc trang chi tiết submission

        } catch (error) {
            console.error("Submission error:", error);
            const msg = error.response?.data?.message || "Có lỗi xảy ra khi nộp bài.";
            alert(`Nộp bài thất bại: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Nếu không có câu hỏi nào
    if (questions.length === 0) {
        return <div className={styles.error}>Bài học này chưa có câu hỏi nào.</div>;
    }

    return (
        <div className={styles.playerContainer}>
            {/* Header: Progress Bar */}
            <div className={styles.header}>
                <h3>
                    Speaking Practice - {currentQuestion?.part ? currentQuestion.part.replace(/(\d+)/, ' $1').toUpperCase() : 'Part 1'}
                </h3>                
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                    <span className={styles.questionCount}>
                        Question {currentQIndex + 1} / {questions.length}
                    </span>
                </div>
            </div>

            {/* Question Card */}
            <div className={styles.questionCard}>
                <div className={styles.questionContent}>
                    <h2 className={styles.questionText}>
                        {currentQuestion?.questionText || "Loading question..."}
                    </h2>
                    {/* Hiển thị gợi ý/sample nếu có (tùy chọn) */}
                    {currentQuestion?.sampleAnswer && (
                        <details className={styles.sampleAnswer}>
                            <summary>Xem gợi ý câu trả lời</summary>
                            <p>{currentQuestion.sampleAnswer}</p>
                        </details>
                    )}
                </div>
                
                <div className={styles.recordingArea}>
                    {/* Key quan trọng để Reset recorder khi đổi câu hỏi */}
                    <AudioRecorder 
                        key={currentQIndex} 
                        onRecordingComplete={handleRecordingComplete}
                        existingAudioBlob={recordings[currentQIndex]} 
                    />
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className={styles.navigation}>
                <button 
                    className={`btn ${styles.btnPrev}`} 
                    onClick={handlePrev} 
                    disabled={currentQIndex === 0 || isSubmitting}
                >
                    Previous
                </button>
                
                {isLastQuestion ? (
                    <button 
                        className={`btn btn-primary ${styles.btnSubmit}`}
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                    </button>
                ) : (
                    <button 
                        className={`btn btn-primary ${styles.btnNext}`} 
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpeakingPlayer;
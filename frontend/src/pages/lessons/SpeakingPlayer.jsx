import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AudioRecorder from '../../components/exam/audioRecord.jsx';
import styles from './speakingPlayer.module.css'; // Tái sử dụng CSS của Quiz

const SpeakingPlayer = ({ lesson }) => {
    const navigate = useNavigate();
    const [currentQIndex, setCurrentQIndex] = useState(0);
    // Lưu trữ blob cho từng câu hỏi: { 0: Blob, 1: Blob }
    const [recordings, setRecordings] = useState({}); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questions = lesson.questions || [];
    const currentQuestion = questions[currentQIndex];
    const isLastQuestion = currentQIndex === questions.length - 1;

    const handleRecordingComplete = (blob) => {
        setRecordings(prev => ({
            ...prev,
            [currentQIndex]: blob // Lưu blob vào index tương ứng
        }));
    };

    const handleNext = () => {
        if (!recordings[currentQIndex]) {
            alert("Please record your answer before moving to the next question.");
            return;
        }
        setCurrentQIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        setCurrentQIndex(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!recordings[currentQIndex]) {
            alert("Please record your answer for the last question.");
            return;
        }
        if (!confirm("Submit all your speaking answers?")) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('lessonId', lesson._id);
        
        // Gửi danh sách câu hỏi (text) để backend lưu lại đối chiếu
        formData.append('questions', JSON.stringify(questions));

        // Gửi các file ghi âm
        // Tên field phải là `audio_${index}` để backend map đúng
        Object.keys(recordings).forEach(index => {
            const blob = recordings[index];
            // File name: answer_0.webm, answer_1.webm
            formData.append(`audio_${index}`, blob, `answer_${index}.webm`);
        });

        try {
            await api.post('/submissions/speaking', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Speaking test submitted successfully! AI result will be available soon.");
            navigate(`/courses/${lesson.module.course}`);
        } catch (error) {
            console.error(error);
            alert("Failed to submit speaking test.");
        } finally {
            setIsSubmitting(false);
        }
    };

return (
        <div className={styles.playerContainer}>
            <div className={styles.header}>
                <h3>
                    Speaking Practice - {currentQuestion?.part?.replace('part', 'Part ') || 'Part 1'}
                </h3>                
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <p className={styles.questionCount}>Question {currentQIndex + 1} / {questions.length}</p>
            </div>

            {/* Khu vực câu hỏi */}
            <div className={styles.questionCard}>
                <h2 className={styles.questionText}>{currentQuestion?.questionText || "No question text"}</h2>
                
                {/* Khu vực ghi âm - Thay style inline bằng class styles.recordingArea */}
                <div className={styles.recordingArea}>
                    <AudioRecorder 
                        key={currentQIndex} 
                        onRecordingComplete={handleRecordingComplete}
                        existingAudioBlob={recordings[currentQIndex]} 
                    />
                </div>
            </div>

            {/* Điều hướng - Class styles.navigation đã được update giống footer */}
            <div className={styles.navigation}>
                <button className="btn btn-outline" onClick={handlePrev} disabled={currentQIndex === 0}>
                    Previous
                </button>
                
                {isLastQuestion ? (
                    <button className="btn btn-success" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                    </button>
                ) : (
                    <button className="btn btn-primary-student" onClick={handleNext}>
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpeakingPlayer;
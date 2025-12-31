import { useState, useRef, useEffect } from 'react';
import styles from './audioRecord.module.css';

const AudioRecorder = ({ onRecordingComplete, existingAudioBlob }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // --- 1. Xử lý file audio có sẵn (khi quay lại câu hỏi cũ) ---
    useEffect(() => {
        let objectUrl = null;

        if (existingAudioBlob) {
            objectUrl = URL.createObjectURL(existingAudioBlob);
            setAudioUrl(objectUrl);
        } else {
            // Quan trọng: Nếu không có blob (bị xóa hoặc chưa có), phải reset url
            setAudioUrl(null);
        }

        // Cleanup function: Xóa URL khỏi bộ nhớ khi component unmount hoặc blob thay đổi
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [existingAudioBlob]);

    // --- 2. Đồng hồ đếm giờ ---
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    // --- 3. Bắt đầu ghi âm ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Kiểm tra trình duyệt hỗ trợ định dạng nào
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4'; // Fallback cho Safari (nếu cần)
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = []; // Reset chunks

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Tạo Blob từ các chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                
                // Tạo URL để play ngay lập tức
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url); // Cập nhật state nội bộ để hiện player ngay
                
                // Gửi blob ra ngoài cho SpeakingPlayer lưu trữ
                onRecordingComplete(audioBlob);
                
                // Tắt mic hoàn toàn (đèn đỏ trên tab tắt)
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Xóa URL cũ nếu có để tránh rác bộ nhớ (dù useEffect đã lo, nhưng làm kỹ không thừa)
            if (audioUrl) URL.revokeObjectURL(audioUrl); 
            setAudioUrl(null); 

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Không thể truy cập Microphone. Vui lòng kiểm tra quyền truy cập.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleRecordAgain = () => {
        if (window.confirm("Bản ghi âm hiện tại sẽ bị xóa. Bạn có chắc chắn muốn ghi âm lại?")) {
            // Xóa URL cũ khỏi bộ nhớ
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            
            setAudioUrl(null);
            onRecordingComplete(null); // Báo cho cha biết là đã xóa
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className={styles.recorderContainer}>
            {/* Case 1: Chưa ghi âm & Chưa có file */}
            {!isRecording && !audioUrl && (
                <button onClick={startRecording} className="btn btn-primary-student">
                    🎙️ Start Recording
                </button>
            )}

            {/* Case 2: Đang ghi âm */}
            {isRecording && (
                <div className={styles.recordingStatus}>
                    <div className={styles.indicator}>
                        <span>●</span> Recording {formatTime(recordingTime)}
                    </div>
                    <button onClick={stopRecording} className="btn btn-danger">
                        ⏹️ Stop
                    </button>
                </div>
            )}

            {/* Case 3: Đã có file (Vừa ghi xong hoặc Load từ history) */}
            {audioUrl && !isRecording && (
                <div className={styles.playbackContainer}>
                    <audio src={audioUrl} controls className={styles.audioPlayer} />
                    <div className={styles.actions}>
                        <button onClick={handleRecordAgain} className="btn btn-outline-danger">
                            ↺ Record Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
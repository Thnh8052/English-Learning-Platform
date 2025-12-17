import { useState, useRef, useEffect } from 'react';
import styles from './audioRecord.module.css';

const AudioRecorder = ({ onRecordingComplete, existingAudioBlob }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    //Nếu component mount lại mà đã có audio trước đó (dùng cho tính năng Resume/Back)
    useEffect(() => {
        if (existingAudioBlob) {
            const url = URL.createObjectURL(existingAudioBlob);
            setAudioUrl(url);
        }
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [existingAudioBlob]); // Thêm dependency existingAudioBlob

    //Đồng hồ đếm giờ
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                audioChunksRef.current = []; // Reset chunks
                
                //Gửi blob ra ngoài cho component cha
                onRecordingComplete(audioBlob);
                
                //Tắt mic (đèn đỏ trên tab)
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null); //Xóa audio cũ nếu có
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access denied or not found.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleRecordAgain = () => {
        if (confirm("This will delete your current recording. Are you sure?")) {
            setAudioUrl(null);
            onRecordingComplete(null); //Xóa blob ở cha
        }
    };

    //Format giây thành mm:ss
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className={styles.recorderContainer}>
            
            {/*Trạng thái chưa ghi âm & chưa có file */}
            {!isRecording && !audioUrl && (
                <button onClick={startRecording} className="btn btn-primary-student">
                    🎙️ Start Recording
                </button>
            )}

            {/* Đang ghi âm */}
            {isRecording && (
                <div className={styles.recordingStatus}>
                    <div className={styles.indicator}>
                        ● Recording {formatTime(recordingTime)}
                    </div>
                <button onClick={stopRecording} className="btn btn-primary-admin">
                    ⏹️ Stop
                </button>
                </div>
            )}

            {/*Đã ghi âm xong (Playback & Retry) */}
            {audioUrl && (
                <div className={styles.playbackContainer}>
                    <audio src={audioUrl} controls className={styles.audioPlayer} />
                    <div className={styles.actions}>
                        <button onClick={handleRecordAgain} className="btn btn-outline">
                            ↺ Record Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
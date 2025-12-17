import React, { useState } from 'react';
import api from '../../services/api';
import styles from '../../pages/teacher/quizBuilder.module.css';

const AiGeneratorModal = ({ isOpen, onClose, onQuestionsReceived }) => {
    const [activeTab, setActiveTab] = useState('text');
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState(null);
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        
        try {
            let response;
            if (activeTab === 'text') {
                response = await api.post('/ai/generate-from-text', { text: inputText, numQuestions });
            } else {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('numQuestions', numQuestions);
                response = await api.post('/ai/generate-from-file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success) {
                onQuestionsReceived(response.data.data);
                onClose();
                setInputText(''); setFile(null); // Reset form
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Lỗi khi gọi AI. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>✨ AI Quiz Generator</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'text' ? styles.active : ''}`} onClick={() => setActiveTab('text')}>Nhập Văn Bản</button>
                    <button className={`${styles.tab} ${activeTab === 'file' ? styles.active : ''}`} onClick={() => setActiveTab('file')}>Upload File</button>
                </div>

                <div className={styles.modalBody}>
                    {activeTab === 'text' ? (
                        <div className={styles.formGroup}>
                            <textarea
                                className={styles.formTextarea}
                                rows="6"
                                placeholder="Dán nội dung bài học vào đây..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className={styles.formGroup}>
                            <div className={styles.fileUploadBox} onClick={() => document.getElementById('fileInput').click()}>
                                <input 
                                    id="fileInput" type="file" hidden 
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                <p>{file ? `📄 ${file.name}` : "Bấm để chọn file (PDF, DOCX)"}</p>
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className={styles.formLabel} style={{ marginBottom: 0 }}>Số lượng câu hỏi:</label>
                        <input 
                            type="number" min="1" max="20"
                            className={styles.formInput} style={{ width: '80px' }}
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(e.target.value)}
                        />
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}
                </div>

                <div className={styles.modalFooter}>
                    <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onClose} disabled={loading}>Hủy</button>
                    <button 
                        className={`${styles.btn} ${styles.btnAi}`} 
                        onClick={handleGenerate} 
                        disabled={loading || (activeTab === 'text' && !inputText) || (activeTab === 'file' && !file)}
                    >
                        {loading ? 'Đang xử lý...' : '🚀 Tạo câu hỏi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiGeneratorModal;
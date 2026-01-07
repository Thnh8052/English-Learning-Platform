import { useState, useEffect } from 'react';
import styles from './LessonModal.module.css';

const LessonModal = ({ isOpen, onClose, onSave, moduleId }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('assignment');
    const [promptType, setPromptType] = useState('text');
    const [promptText, setPromptText] = useState('');
    const [promptFile, setPromptFile] = useState(null);
    const [lessonFile, setLessonFile] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setType('assignment');
            setPromptType('text');
            setPromptText('');
            setPromptFile(null);
            setLessonFile(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('moduleId', moduleId);

        if (promptType === 'text') {
            formData.append('promptText', promptText);
        } else if (promptFile) {
            formData.append('promptFile', promptFile);
        }

        if (lessonFile) {
            formData.append('lessonFile', lessonFile);
        }

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showMainFile = ['video', 'reading', 'listening_audio'].includes(type);
    const showPrompt = ['assignment', 'speaking_prompt', 'quiz'].includes(type);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                <div className={styles.modalHeader}>
                    <h3>Add New Lesson</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="form-group">
                        <label className="form-label">Lesson Title</label>
                        <input className="form-input" 
                               value={title}
                               placeholder="e.g., Introduction to IELTS Writing"
                               onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Lesson Type</label>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)} 
                            className={`form-select ${styles.select}`}
                        >
                            <option value="assignment">Writing Assignment</option>
                            <option value="speaking_prompt">Speaking Practice</option>
                            <option value="video">Video Lesson</option>
                            <option value="reading">Reading Material (PDF)</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>

                    {showPrompt && (
                        <div className="form-group">
                            <label className="form-label">Prompt / Question Content</label>
                            <div className={styles.radioGroup}>
                                <label>
                                    <input type="radio" value="text"
                                           checked={promptType === 'text'}
                                           onChange={() => setPromptType('text')} />
                                    Text Input
                                </label>
                                
                                <label>
                                    <input type="radio" value="file"
                                           checked={promptType === 'file'}
                                           onChange={() => setPromptType('file')} />
                                    Upload File
                                </label>
                            </div>

                            {promptType === 'text' ? (
                                <textarea className="form-input"
                                          rows="4"
                                          placeholder="Enter the essay topic, question, or instructions here..."
                                          value={promptText}
                                          onChange={(e) => setPromptText(e.target.value)} />
                            ) : (
                                <input type="file" className="form-input"
                                       onChange={(e) => setPromptFile(e.target.files[0])} />
                            )}
                        </div>
                    )}

                    {showMainFile && (
                        <div className="form-group">
                            <label className="form-label">Main Content File</label>
                            <input type="file"
                                   className="form-input"
                                   accept={type === 'video' ? 'video/*' : '.pdf'}
                                   onChange={(e) => setLessonFile(e.target.files[0])} />
                            <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display:'block' }}>
                                {type === 'video' ? 'Upload MP4/WebM video' : 'Upload PDF document'}
                            </small>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className="btn btn-outline">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary-teacher" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Add Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LessonModal;
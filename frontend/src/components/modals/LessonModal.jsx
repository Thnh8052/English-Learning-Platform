import { useState, useEffect } from 'react';
import styles from './LessonModal.module.css';

const AddLessonModal = ({ isOpen, onClose, onSave, moduleId }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('video');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form mỗi khi modal được mở
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setType('video');
            setFile(null);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('type', type);
            formData.append('moduleId', moduleId);
            if (file) formData.append('lessonFile', file);

            await onSave(formData); // Gọi callback thêm bài học
            onClose(); // Đóng modal sau khi thêm xong
        } catch (err) {
            console.error('Error adding lesson:', err);
            setError(err.message || 'Failed to add lesson.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Add New Lesson</h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.errorText}>{error}</p>}

                    <div className="form-group">
                        <label className="form-label">Lesson Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Lesson Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                                <option value="video">Video Lecture</option>
                                <option value="reading">Reading Passage (PDF/Docx)</option>
                                <option value="listening_audio">Listening Audio (MP3)</option>
                                <option value="speaking_prompt">Speaking Practice (Prompt only)</option>
                                <option value="assignment">Writing Assignment</option>
                                <option value="quiz">Quiz</option>
                                <option value="speaking">Speaking Assignment</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Upload Lesson File</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="form-input"
                            required
                        />
                        {file && <span className={styles.fileName}>Selected: {file.name}</span>}
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary-teacher" disabled={isSubmitting}>
                            {isSubmitting ? 'Uploading...' : 'Add Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLessonModal;

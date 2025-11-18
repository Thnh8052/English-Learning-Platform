import { useState, useEffect } from 'react';
import styles from './LessonModal.module.css';

const ModuleModal = ({ courseId, isOpen, onClose, onSave, mode = 'add', initialData = null }) => {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setTitle(initialData.title || '');
        } else {
            setTitle('');
        }
    }, [mode, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return alert('Please enter a module title');
        setIsSubmitting(true);
        setError('');

        try {
            await onSave(courseId, title, initialData?._id);
            setTitle('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save module.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{mode === 'edit' ? 'Edit Module' : 'Add New Module'}</h3>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.errorText}>{error}</p>}

                    <div className="form-group">
                        <label className="form-label">Module Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="e.g., Module 1: Introduction"
                            required
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className="btn btn-outline">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary-teacher" disabled={isSubmitting}>
                            {isSubmitting
                                ? mode === 'edit'
                                    ? 'Saving...'
                                    : 'Adding...'
                                : mode === 'edit'
                                    ? 'Save Changes'
                                    : 'Add Module'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModuleModal;

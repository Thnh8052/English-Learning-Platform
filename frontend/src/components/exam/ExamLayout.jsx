import { useState } from 'react';
import styles from './examLayout.module.css';

const ExamLayout = ({ instructionComponent, answerComponent, onSubmit }) => {
    const [showInstructions, setShowInstructions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit? You won't be able to edit your answer later.")) return;
        
        setIsSubmitting(true);
        try {
            await onSubmit();
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.examContainer}>
            <div className={`${styles.panel} ${showInstructions ? styles.visible : ''}`}>
                <h3 className={styles.panelTitle}>Instructions / Prompt</h3>
                <div className={styles.panelContent}>
                    {instructionComponent}
                </div>
            </div>
            <div className={`${styles.panel} ${!showInstructions ? styles.visible : ''}`}>
                <h3 className={styles.panelTitle}>Your Answer</h3>
                <div className={styles.panelContent}>
                    {answerComponent}
                </div>
            </div>
            <div className={styles.navigation}>
                <button onClick={() => setShowInstructions(true)} disabled={showInstructions} className="btn btn-secondary">
                    View Prompt
                </button>
                <button onClick={() => setShowInstructions(false)} disabled={!showInstructions} className="btn btn-secondary">
                    Start Answering
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting || showInstructions} className="btn btn-primary-student">
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
            </div>
        </div>
    );
};

export default ExamLayout;
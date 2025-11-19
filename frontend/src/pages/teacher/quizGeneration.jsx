import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './quizBuilder.module.css';

const QuizGeneration = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        setError('');

        try {
            // Gọi API Backend
            await api.post('/ai/generate-quiz', {
                lessonId,
                prompt
            });

            // Thành công -> Chuyển hướng sang Quiz Builder để sửa
            alert("AI has generated the questions successfully!");
            navigate(`/teacher/lesson/${lessonId}/quiz`);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to generate quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>✨ AI Quiz Generator</h1>
            <p className={styles.subtitle}>
                Describe your topic, paste a reading passage, or list key concepts. 
                Our AI will generate 5 multiple-choice questions for you.
            </p>

            <form onSubmit={handleGenerate} className={styles.form}>
                <div className="form-group">
                    <label style={{fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>
                        What should this quiz be about?
                    </label>
                    <textarea
                        className="form-input"
                        rows="8"
                        placeholder="E.g., 'Create questions about the Past Simple tense' or paste an article here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                    />
                </div>

                {error && <p className={styles.errorText} style={{color: 'red'}}>{error}</p>}

                <div style={{marginTop: '20px'}}>
                    <button 
                        type="submit" 
                        className="btn btn-primary-teacher" 
                        disabled={loading}
                        style={{ padding: '12px 24px', fontSize: '1.1rem' }}
                    >
                        {loading ? 'Generating (This may take 10-20s)...' : 'Generate Questions with AI 🚀'}
                    </button>
                    
                    <button 
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate(`/teacher/lesson/${lessonId}/quiz`)} // Nút Skip
                        style={{ marginLeft: '10px' }}
                    >
                        Skip to Builder (Manual)
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuizGeneration;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './Auth.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('If an account with that email exists, a password reset link has been sent.');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>Forgot Password</h1>
                <p className={styles.subtitle}>Enter your email and we'll send you a link to reset it.</p>
                
                {message && <div className={styles.successMessage}>{message}</div>}
                {error && <div className={styles.errorMessage}>{error}</div>}
                
                {!message && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                
                <div className={styles.switchText} style={{ marginTop: '1.5rem' }}>
                    <Link to="/login" className={styles.link}>← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
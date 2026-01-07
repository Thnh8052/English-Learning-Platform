import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import styles from './Auth.module.css';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (password.length < 6) return setError("Password must be at least 6 characters long.");
        
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const res = await api.put(`/auth/reset-password/${token}`, { password });
            setMessage('Password reset successfully! Logging you in...');
            setAuthData(res.data);

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>Reset Password</h1>
                <p className={styles.subtitle}>Enter your new password below.</p>

                {message && <div className={styles.successMessage}>{message}</div>}
                {error && <div className={styles.errorMessage}>{error}</div>}
                
                {!message && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                type="password"
                                value={password}
                                className={styles.input}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                className={styles.input}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
                
                <div className={styles.switchText} style={{ marginTop: '1.5rem' }}>
                    <Link to="/login" className={styles.link}>← Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
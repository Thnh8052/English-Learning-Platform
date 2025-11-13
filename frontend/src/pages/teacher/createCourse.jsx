import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './createCourse.module.css';

const CreateCoursePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        description: '',
        category: '',
        level: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            // API sẽ tạo khóa học với status mặc định là 'draft'
            const res = await api.post('/courses', formData);
            alert('Tạo khóa học nháp thành công!');
            // Chuyển hướng đến dashboard của giáo viên sau khi tạo
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>Tạo khóa học mới</h1>
            <p className={styles.pageSubtitle}>Bắt đầu bằng cách điền các thông tin cơ bản. Bạn có thể chỉnh sửa chi tiết sau.</p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <p className={styles.errorText}>{error}</p>}
                
                <div className="form-group">
                    <label className="form-label">Tên khóa học</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Mô tả ngắn (Summary)</label>
                    <textarea name="summary" value={formData.summary} onChange={handleChange} className="form-input" required></textarea>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows="5" required></textarea>
                </div>

                <div className={styles.grid}>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                            <option value="">Chọn kỹ năng</option>
                            <option value="Speaking">Speaking</option>
                            <option value="Writing">Writing</option>
                            <option value="Listening">Listening</option>
                            <option value="Reading">Reading</option>
                            <option value="Grammar">Grammar</option>
                            <option value="Vocabulary">Vocabulary</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Level</label>
                        <select name="level" value={formData.level} onChange={handleChange} className="form-select">
                            <option value="">Chọn trình độ</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary-teacher" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang tạo...' : 'Tạo khóa học'}
                </button>
            </form>
        </div>
    );
};

export default CreateCoursePage;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CourseDetailPage from '../courses/CourseDetailPage.jsx';
import styles from './adminReview.module.css';

const AdminReviewPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    //xử lý từ chối khóa học
    const handleReject = async () => {
        const reason = prompt("Please provide a reason for rejecting this course. This will be shown to the teacher.");
        if (!reason) return; // Nếu admin hủy prompt

        setIsSubmitting(true);
        try {
            await api.put(`/admin/courses/${courseId}/reject`, { reason });
            alert('Course has been rejected.');
            navigate('/dashboard');
        } catch (error) {
            alert('Failed to reject course.');
        } finally {
            setIsSubmitting(false);
        }
    };

    //xử lý phê duyệt khóa học
    const handleApprove = async () => {
        if (!window.confirm("Are you sure you want to approve and publish this course?")) return;
        setIsSubmitting(true);
        try {
            await api.post(`/admin/courses/${courseId}/approve`);
            alert('Course approved and published!');
            navigate('/dashboard');
        } catch (error) {
            alert('Failed to approve course.');
        } finally {
            setIsSubmitting(false);
        }
    };

    //xử lý yêu cầu chỉnh sửa
    const handleRequestChanges = async () => {
        if (!feedback.trim()) {
            alert('Please provide feedback for the teacher.');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post(`/admin/courses/${courseId}/request-changes`, { feedback });
            alert('Request for changes has been sent to the teacher.');
            navigate('/dashboard');
        } catch (error) {
            alert('Failed to request changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

   return (
    <div>
      <CourseDetailPage />

      {}
      <div className={styles.adminContainer}>
        <div className={styles.sectionBox}>
          <h3>Admin Actions</h3>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Request Changes (provide feedback)
            </label>
            <textarea
              className={styles.formInput}
              rows="4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., 'Please improve the course thumbnail.' or 'Module 2 is missing video content.'"
            ></textarea>
          </div>

          <div className={styles.buttonRow}>
            <button
              onClick={handleRequestChanges}
              className={`${styles.btn} ${styles.btnWarning}`}
              disabled={isSubmitting}
            >
              Request Changes
            </button>
            <button
              onClick={handleApprove}
              className={`${styles.btn} ${styles.btnSuccess}`}
              disabled={isSubmitting}
            >
              Approve & Publish
            </button>
            <button onClick={handleReject} className={`${styles.btn} ${styles.btnReject}`} disabled={isSubmitting}>
              Reject Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewPage;
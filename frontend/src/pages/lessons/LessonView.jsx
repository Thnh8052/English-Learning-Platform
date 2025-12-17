import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './lessonView.module.css';
import ExamLayout from '../../components/exam/ExamLayout.jsx';
import SpeakingPlayer from './SpeakingPlayer.jsx';
import QuizAnswers from './quizAnswers.jsx';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const HtmlVideoPlayer = ({ url }) => {
  if (!url) return <p className={styles.errorText}>Video không khả dụng.</p>;
  return (
    <div className={styles.videoContainer}>
      <div className={styles.videoWrapper}>
        <video 
            src={url} 
            controls 
            width="100%" 
            height="auto" 
            controlsList="nodownload" 
            onContextMenu={(e) => e.preventDefault()} 
        />
      </div>
    </div>
  );
};

const PdfReader = ({ url }) => {
  if (!url) return <p className={styles.errorText}>PDF không khả dụng.</p>;
  return (
    <div className={styles.pdfContainer}>
      <iframe src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`} title="PDF Document" className={styles.pdfFrame}></iframe>
    </div>
  );
};

const WritingComponent = ({ lesson, onSubmit }) => {
  const [content, setContent] = useState('');
  return (
    <ExamLayout
      instructionComponent={<div className="prose-content" dangerouslySetInnerHTML={{ __html: lesson.prompt || 'Không có đề bài.' }} />}
      answerComponent={<ReactQuill theme="snow" value={content} onChange={setContent} style={{ height: '300px', marginBottom: '50px' }} />}
      onSubmit={() => onSubmit({ lessonId: lesson._id, content })}
    />
  );
};

const SubmissionResultCard = ({ submission, onReview, onRetry, canRetry }) => {
    const getScoreDisplay = () => {
        const { score } = submission;
        if (score === null || score === undefined) return 'Chờ chấm';
        if (typeof score === 'object') {
            if (score.overall !== undefined && score.overall !== null) return score.overall;
            if (score.correct !== undefined) return `${score.correct}/${score.total}`;
            return 'Đã nộp';
        }
        return score;
    };

    const isCompleted = submission.status === 'completed';

    return (
        <div className={styles.resultCard}>
            <span className={styles.resultIcon}>🎉</span>
            <h2 className={styles.resultTitle}>Lần làm bài thứ {submission.attempt || 1}</h2>
            
            <div className={`${styles.statusBox} ${isCompleted ? styles.statusCompleted : styles.statusPending}`}>
                Trạng thái: {isCompleted ? 'Đã chấm điểm' : 'Đang chờ chấm'}
            </div>

            <div className={styles.scoreBox}>
                Điểm số: <span className={styles.scoreValue}>{getScoreDisplay()}</span>
            </div>

            <div className={styles.actionButtons}>
                <button className="btn btn-outline" onClick={onReview}>Xem chi tiết</button>
                {canRetry && (
                    <button className="btn btn-primary-student" onClick={onRetry}>
                        🔄 Làm lại ({submission.attempt || 1}/5)
                    </button>
                )}
            </div>
            {!canRetry && <p className={styles.retryText}>Bạn đã hết lượt làm bài (5/5).</p>}
        </div>
    );
};

const LessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRetaking, setIsRetaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonRes, subRes, historyRes] = await Promise.all([
          api.get(`/lessons/${lessonId}`),
          api.get(`/submissions/my-submission/${lessonId}`),
          api.get(`/submissions/history/${lessonId}`)
      ]);
      setLesson(lessonRes.data);
      setMySubmission(subRes.data);
      setHistory(historyRes.data || []);
      setIsRetaking(false);
    } catch (err) {
      console.error(err);
      setError('Không thể tải nội dung bài học.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
      if (history.length >= 5) {
          alert("Bạn đã hết lượt làm bài.");
          return;
      }
      setIsRetaking(true);
  };

  const handleSubmitAnswer = async (submissionData) => {
    if (!submissionData.content || submissionData.content === '<p><br></p>') {
      alert('Vui lòng nhập nội dung.');
      return;
    }
    try {
      await api.post('/submissions', submissionData);
      alert('Nộp bài thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Nộp bài thất bại.');
    }
  };

  const renderContent = () => {
    if (!lesson) return null;
    const isExercise = ['quiz', 'assignment', 'speaking_prompt'].includes(lesson.type);
    
    if (isExercise && (!mySubmission || isRetaking)) {
        switch (lesson.type) {
            case 'assignment': return <WritingComponent lesson={lesson} onSubmit={handleSubmitAnswer} />;
            case 'speaking_prompt': return <SpeakingPlayer lesson={lesson} />;
            case 'quiz': return <QuizAnswers lesson={lesson} />;
            default: return <p>Loại bài học không hỗ trợ.</p>;
        }
    }

    if (isExercise && mySubmission) {
        return (
            <SubmissionResultCard 
                submission={mySubmission} 
                onReview={() => navigate(`/student/submissions/${mySubmission._id}`)} 
                onRetry={handleRetry}
                canRetry={history.length < 5}
            />
        );
    }

    switch (lesson.type) {
      case 'video': return <HtmlVideoPlayer url={lesson.fileUrl} />;
      case 'reading': return <PdfReader url={lesson.fileUrl} />;
      default: return <p>Nội dung không khả dụng.</p>;
    }
  };

  const getHistoryScore = (sub) => {
      if (!sub.score) return '...';
      if (typeof sub.score === 'object') {
          if (sub.score.overall !== undefined) return sub.score.overall;
          if (sub.score.percentage !== undefined) return `${sub.score.percentage}%`;
          return '-';
      }
      return sub.score;
  };

  if (loading) return <div className={styles.container}>Đang tải...</div>;
  if (error) return <div className={styles.container}><p className={styles.errorText}>{error}</p></div>;

  return (
    <div className={styles.container}>
        <aside className={styles.sidebar}>
            <div className={styles.historyTitle}>Lịch sử nộp bài</div>
            <div className={styles.historyList}>
                {history.length === 0 ? (
                    <p style={{fontSize:'0.9rem', color:'#64748b'}}>Chưa có bài nộp nào.</p>
                ) : (
                    history.map(sub => (
                        <Link 
                            key={sub._id} 
                            to={`/student/submissions/${sub._id}`}
                            className={`${styles.historyItem} ${mySubmission?._id === sub._id ? styles.active : ''}`}
                        >
                            <div className={styles.attemptHeader}>
                                <span className={styles.attemptLabel}>Lần {sub.attempt || 1}</span>
                                <span className={`${styles.statusTag} ${styles['status_' + sub.status]}`}>
                                    {sub.status === 'completed' ? 'Đã chấm' : 'Đang chấm'}
                                </span>
                            </div>
                            <span className={styles.historyDate}>
                                {new Date(sub.createdAt).toLocaleString('vi-VN')}
                            </span>
                            <span className={styles.historyScore}>
                                Điểm: {getHistoryScore(sub)}
                            </span>
                        </Link>
                    ))
                )}
            </div>
            <Link to={`/courses/${lesson?.module?.course?._id || lesson?.module?.course}`} className={styles.backLink}>
                &larr; Quay lại khóa học
            </Link>
        </aside>

        <div className={styles.mainContentWrapper}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>{lesson?.title}</h1>
                    <div className={styles.breadcrumb}>
                        Module: {lesson?.module?.title}
                    </div>
                </div>
            </header>

            <div className={styles.content}>
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export default LessonView;
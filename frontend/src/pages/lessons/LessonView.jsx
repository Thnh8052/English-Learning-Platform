import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './lessonView.module.css';
import ExamLayout from '../../components/exam/ExamLayout.jsx';
import SpeakingPlayer from './SpeakingPlayer.jsx';
import QuizAnswers from './quizAnswers.jsx';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/* ==========================
   WRITING LESSON COMPONENT
========================== */
const WritingComponent = ({ lesson, onSubmit }) => {
  const [content, setContent] = useState('');

  return (
    <ExamLayout
      instructionComponent={
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: lesson.prompt || 'No prompt provided.' }}
        />
      }
      answerComponent={
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          style={{ height: '400px' }}
        />
      }
      onSubmit={() => onSubmit({ lessonId: lesson._id, content })}
    />
  );
};

// /* ==========================
//    SPEAKING LESSON COMPONENT
// ========================== */
// const SpeakingComponent = ({ lesson, onSubmit }) => {
//   const handleRecord = () => alert('Recording feature coming soon!');

//   return (
//     <ExamLayout
//       instructionComponent={
//         <div
//           className="prose-content"
//           dangerouslySetInnerHTML={{ __html: lesson.prompt || 'No prompt provided.' }}
//         />
//       }
//       answerComponent={
//         <div>
//           <p>Click the button below to start recording your answer (coming soon).</p>
//           <button onClick={handleRecord} className="btn btn-primary-student">
//             Start Recording
//           </button>
//         </div>
//       }
//       onSubmit={() => onSubmit({ lessonId: lesson._id, content: 'audio_placeholder' })}
//     />
//   );
// };

/* ==========================
   VIDEO PLAYER COMPONENT
========================== */
const HtmlVideoPlayer = ({ url }) => {
  if (!url) return <p>No video available.</p>;
  console.log('🎬 Playing video from:', url);

  return (
    <div className={styles.videoWrapper}>
      <video
        src={url}
        controls
        width="100%"
        height="auto"
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedData={() => console.log('Video loaded successfully')}
        onError={(e) => console.error('Video error:', e)}
        style={{
          borderRadius: '8px',
          outline: 'none',
          backgroundColor: 'black',
        }}
      />
    </div>
  );
};

/* ==========================
   PDF VIEWER COMPONENT
========================== */
const PdfReader = ({ url }) => {
  if (!url) return <p>No PDF available.</p>;
  console.log('Displaying PDF:', url);

  return (
    <div className={styles.pdfContainer}>
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
        width="100%"
        height="800px"
        title="PDF Document"
        allow="fullscreen"
      ></iframe>
    </div>
  );
};

/* ==========================
   MAIN LESSON VIEW COMPONENT
========================== */
const LessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/lessons/${lessonId}`);
        setLesson(res.data);
      } catch (err) {
        console.error('Failed to fetch lesson:', err);
        setError(err.response?.data?.message || 'Failed to load lesson content.');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  //Nộp bài cho Writing / Speaking
  const handleSubmitAnswer = async (submissionData) => {
    if (!submissionData.content || submissionData.content.trim() === '<p><br></p>') {
      alert('Your answer cannot be empty.');
      return;
    }

    try {
      await api.post('/submissions', submissionData);
      alert('Your answer has been submitted successfully!');
      navigate(`/courses/${lesson?.module?.course}`);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert(error.response?.data?.message || 'Submission failed.');
    }
  };

  //Chọn component render tương ứng
  const renderContent = () => {
    if (!lesson) return <p>No lesson found.</p>;

    switch (lesson.type) {
      case 'video':
        return <HtmlVideoPlayer url={lesson.fileUrl} />;
      case 'reading':
        return <PdfReader url={lesson.fileUrl} />;
      case 'assignment':
        return <WritingComponent lesson={lesson} onSubmit={handleSubmitAnswer} />;
      case 'speaking_prompt': // Hoặc 'speaking' tùy enum bạn chọn
        return <SpeakingPlayer lesson={lesson} />;
      case 'quiz':
        return <QuizAnswers lesson={lesson} />;
      default:
        return <p>Content type "{lesson.type}" is not supported yet.</p>;
    }
  };

  if (loading)
    return (
      <div className={styles.container}>
        <p>Loading lesson...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.container}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{lesson?.title}</h1>
        <Link
          to={`/courses/${lesson?.module?.course}`}
          className="btn btn-outline"
        >
          Back to Course
        </Link>
      </header>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default LessonView;

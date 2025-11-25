import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/courses/courseDetail.module.css';

const Icons = {
    video: <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/></svg>,
    quiz: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>,
    writing: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
    speaking: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>,
    reading: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    default: <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>
};

const getIcon = (type) => Icons[type] || Icons.default;

const SubmissionStatus = ({ submission }) => {
    if (!submission) return null;

    if (submission.status === 'submitted') {
        return <span className={styles.statusBadgePending}>Đang chấm</span>;
    }

    if (submission.status === 'completed') {
        let scoreDisplay = '';
        let isHigh = false;

        if (typeof submission.score === 'object' && submission.score !== null) {
            scoreDisplay = `${submission.score.percentage}%`;
            isHigh = submission.score.percentage >= 50;
        } else if (typeof submission.score === 'number') {
            scoreDisplay = submission.score;
            isHigh = submission.score >= 5;
        } else {
            return <span className={styles.statusBadgeSuccess}>✓ Xong</span>;
        }

        return (
            <span className={isHigh ? styles.statusBadgeSuccess : styles.statusBadgeFail}>
                {scoreDisplay}
            </span>
        );
    }
    return null;
};

const CourseContentAccordion = ({ modules = [], submissions = {} }) => {
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => {
        if (modules.length > 0) {
            const initialObj = {};
            modules.forEach(m => initialObj[m._id] = true);
            setExpandedModules(initialObj);
        }
    }, [modules]);

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    if (!modules || modules.length === 0) return <p className={styles.emptyState}>Nội dung đang cập nhật.</p>;

    return (
        <div className={styles.accordionContainer}>
            {modules.map((module) => {
                const isOpen = !!expandedModules[module._id];
                return (
                    <div key={module._id} className={styles.accordionItem}>
                        <div 
                            className={styles.accordionHeader} 
                            onClick={() => toggleModule(module._id)}
                        >
                            <div className={styles.accordionTitle}>
                                <svg 
                                    className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`} 
                                    width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                </svg>
                                <span>{module.title}</span>
                            </div>
                            <span className={styles.moduleMeta}>
                                {module.lessons?.length || 0} bài học
                            </span>
                        </div>

                        {isOpen && (
                            <div className={styles.accordionContent}>
                                {module.lessons?.map(lesson => {
                                    const submission = submissions[lesson._id];
                                    return (
                                        <Link 
                                            key={lesson._id} 
                                            to={`/lessons/${lesson._id}`} 
                                            className={styles.lessonItem}
                                        >
                                            <div className={styles.lessonTitle}>
                                                <span className={styles.typeIcon}>
                                                    {getIcon(lesson.type)}
                                                </span>
                                                <span className={styles.lessonText}>{lesson.title}</span>
                                            </div>
                                            
                                            <div className={styles.lessonRightSide}>
                                                <SubmissionStatus submission={submission} />
                                                {!submission && lesson.duration && (
                                                    <span className={styles.lessonDuration}>
                                                        {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CourseContentAccordion;
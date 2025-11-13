import { useRef, useState, useEffect,useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourses } from '../../../../contexts/CoursesContext';
import api from '../../../../services/api';
import styles from './teacherView.module.css';


// --- COMPONENT CON CHO CARD KHÓA HỌC ---
const CourseCard = ({ course, onEdit, onSubmitReview, onRetract, onDelete }) => {
    const StatusBadge = () => {
        switch (course.status) {
            case 'draft':
                return <span className={`${styles.badge} ${styles.draft}`}>Draft</span>;
            case 'pending_review':
                return <span className={`${styles.badge} ${styles.pending}`}>Pending Review</span>;
            case 'published':
                return <span className={`${styles.badge} ${styles.published}`}>Published</span>;
            case 'requires_changes':
                return <span className={`${styles.badge} ${styles.requiresChanges}`}>Requires Changes</span>;
            default:
                return null;
        }
    };

    return (
        <div className={styles.courseCard}>
            <div className={styles.cardImage} style={{ backgroundColor: course.color }}>
                <StatusBadge />
            </div>
            <div className={styles.cardContent}>
                <h4>{course.name}</h4>
                <div className={styles.cardActions}>
                    <button onClick={() => onEdit(course)} className="btn btn-secondary">Edit</button>

                    {course.status === 'pending_review' && (
                        <button onClick={() => onRetract(course._id)} className={`${styles.btn} ${styles.btnWarning}`}>Retract</button>
                    )}

                    {(course.status === 'draft' || course.status === 'requires_changes') && (
                        <button onClick={() => onSubmitReview(course._id)} className="btn btn-primary-teacher">Submit</button>
                    )}
                    
                    {(course.status === 'draft' || course.status === 'requires_changes') && (
                         <button onClick={() => onDelete(course._id)} className={`${styles.btn} ${styles.btnDanger}`}>Delete</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CAROUSEL ĐƯỢC NÂNG CẤP ---
const CourseCarousel = ({ courses, onEdit, onSubmitReview }) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollability = () => {
        const el = scrollContainerRef.current;
        if (el) {
            const isScrollable = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(isScrollable && el.scrollLeft < (el.scrollWidth - el.clientWidth));
        }
    };

    const handleScroll = (direction) => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = 280 + 24;
            el.scrollBy({ left: direction === 'left' ? -scrollAmount * 2 : scrollAmount * 2, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || !courses) return;
        const observer = new ResizeObserver(checkScrollability);
        observer.observe(el);
        el.addEventListener('scroll', checkScrollability);
        checkScrollability();
        return () => {
            observer.disconnect();
            el.removeEventListener('scroll', checkScrollability);
        };
    }, [courses]);


    if (!courses || courses.length === 0) {
        return <p>You haven't created any courses yet.</p>;
    }
    
    if (courses.length <= 4) {
        return (
            <div className={styles.courseList}>
                {courses.map(course => <CourseCard key={course._id} course={course} onEdit={onEdit} onSubmitReview={onSubmitReview} />)}
            </div>
        );
    }
    
    return (
        <div className={styles.carouselContainer}>
            <button className={`${styles.navButton} ${styles.left}`} onClick={() => handleScroll('left')} disabled={!canScrollLeft}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>
            <div className={styles.scrollWrapper} ref={scrollContainerRef}>
                <div className={styles.courseList}>
                    {courses.map(course => (
                        <CourseCard key={course._id} course={course} onEdit={onEdit} onSubmitReview={onSubmitReview} />
                    ))}
                </div>
            </div>
            <button className={`${styles.navButton} ${styles.right}`} onClick={() => handleScroll('right')} disabled={!canScrollRight}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
        </div>
    );
};


// --- COMPONENT CHÍNH ---
const TeacherView = () => {
    // Lấy dữ liệu thật từ context
    const { myCourses, loading, setMyCourses } = useCourses();
    const [activeTab, setActiveTab] = useState('pending');
    const navigate = useNavigate();

    const filteredCourses = useMemo(() => {
        if (!myCourses) return [];
        switch (activeTab) {
            case 'published':
                return myCourses.filter(c => c.status === 'published');
            case 'rejected':
                return myCourses.filter(c => c.status === 'requires_changes');
            case 'pending':
            default:
                return myCourses.filter(c => c.status === 'draft' || c.status === 'pending_review');
        }
    }, [myCourses, activeTab]);

    // Hàm xử lý khi nhấn nút "Submit for Review"
    const handleSubmitReview = async (courseId) => {
        if (!window.confirm("Are you sure you want to submit this course for review? You won't be able to edit it while it's pending.")) {
            return;
        }
        try {
            const res = await api.post(`/courses/${courseId}/submit-for-review`);
            // Cập nhật lại state trong context để UI thay đổi
            setMyCourses(prev => prev.map(c => c._id === courseId ? res.data : c));
            alert("Course submitted successfully!");
        } catch (error) {
            console.error("Failed to submit course for review:", error);
            alert("An error occurred. Please try again.");
        }
    };
    // Hàm xử lý khi nhấn nút "Retract"
    const handleRetract = async (courseId) => {
        if (!window.confirm("Are you sure you want to retract this course from review? It will be moved back to drafts.")) {
            return;
        }
        try {
            const res = await api.post(`/courses/${courseId}/retract`);
            setMyCourses(prev => prev.map(c => c._id === courseId ? res.data : c));
            alert("Course retracted successfully.");
        } catch (error) {
            console.error("Failed to retract course:", error);
            alert("An error occurred.");
        }
    };
    // Hàm xử lý khi nhấn nút "Delete"
    const handleDelete = async (courseId) => {
        if (!window.confirm("WARNING: This will permanently delete the course and all its content. This action cannot be undone. Are you sure?")) {
            return;
        }
        try {
            await api.delete(`/courses/${courseId}`);
            setMyCourses(prev => prev.filter(c => c._id !== courseId)); // Xóa khóa học khỏi state
            alert("Course deleted successfully.");
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert(error.response?.data?.message || "An error occurred.");
        }
    };

    
    // Hàm xử lý khi nhấn nút "Edit"
    const handleEdit = (course) => {
            navigate(`/teacher/edit-course/${course._id}`);
    };

    if (loading) {
        return <p>Loading your courses...</p>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h3>Your Courses</h3>
                <Link to="/teacher/create-course" className="btn btn-primary-teacher">+ New Course</Link>
            </div>

            {/* --- THANH TABS --- */}
            <div className={styles.tabContainer}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending & Drafts
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'published' ? styles.active : ''}`}
                    onClick={() => setActiveTab('published')}
                >
                    Published
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.active : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Requires Changes
                </button>
            </div>
            
            <div className={styles.courseGrid}>
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <CourseCard 
                            key={course._id} 
                            course={course} 
                            onEdit={handleEdit} 
                            onSubmitReview={handleSubmitReview} 
                            onRetract={handleRetract}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <p>No courses in this category.</p>
                )}
            </div>
        </div>
    );
};

export default TeacherView;
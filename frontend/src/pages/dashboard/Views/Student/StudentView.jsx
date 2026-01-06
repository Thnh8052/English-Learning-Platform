import { Link } from 'react-router-dom';
import styles from './studentView.module.css';
import { useCourses } from '../../../../contexts/CoursesContext.jsx'; 

const CourseCard = ({ course }) => (
    <div className={styles.courseCard}>
      <div 
        className={styles.courseCardImage} 
        data-card-bg={course.color}
      ></div>
      <div className={styles.courseCardContent}>
        <h4><Link to={`/courses/${course._id}`}>{course.name}</Link></h4>
      </div>
    </div>
)

const CourseGrid = ({ courses }) => { 
  if (!Array.isArray(courses)) {
    return null;
  }

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.scrollWrapper}>
        <div className={styles.courseList}>
          {courses.map(course => <CourseCard key={course._id} course={course} />)}
        </div>
      </div>
    </div>
  );
};

const StudentView = () => {
  const { myCourses, loading } = useCourses(); 
  
  if (loading) {
    return <p className={styles.loadingText}>Loading your courses...</p>;
  }

  return (
    <section className="section">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student</p>
          <h3 className={styles.title}>My Enrolled Courses</h3>
          <p className={styles.subtitle}>
            Continue where you left off or explore new lessons.
          </p>
        </div>
        {myCourses?.length > 0 && (
          <span className={styles.badgeCount}>{myCourses.length} total</span>
        )}
      </header>

      {myCourses && myCourses.length > 0 ? (
         <CourseGrid courses={myCourses} />
      ) : (
        <div className={styles.emptyState}>
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link to="/courses" className="btn btn-primary-student">
            Browse courses now
          </Link>
        </div>
      )}
    </section>
  );
};

export default StudentView;
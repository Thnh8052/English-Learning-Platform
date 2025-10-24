import { useCourses } from '../../contexts/CoursesContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './course.module.css';
import CourseTooltip from '../../components/course/CourseTooltip.jsx';
import { Link } from 'react-router-dom';

const CourseListPage = () => {
  // --- BƯỚC 1: LẤY DỮ LIỆU TỪ CÁC CONTEXT ---
  const { user } = useAuth();
  const { allCourses, myCourses, loading, enrollCourse } = useCourses();

  // --- BƯỚC 2: XỬ LÝ TRẠNG THÁI LOADING ---
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Available Courses</h1>
        <p className={styles.loadingText}>Loading courses...</p>
      </div>
    );
  }

  // --- BƯỚC 3: XỬ LÝ DỮ LIỆU SAU KHI TẢI XONG ---
  const myCourseIds = Array.isArray(myCourses)
    ? myCourses.map(course => course._id)
    : [];

  const hasCourses = Array.isArray(allCourses) && allCourses.length > 0;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Available Courses</h1>

      {!hasCourses ? (
        <p className={styles.noCoursesText}>
          There are no courses available at the moment. Please check back later!
        </p>
      ) : (
        <div className={styles.courseGrid}>
          {allCourses.map(course => {
            const isEnrolled =
              user &&
              user.role === 'student' &&
              myCourseIds.includes(course._id);

            const isMyTeachingCourse =
              user &&
              user.role === 'teacher' &&
              course.teacher?._id === user.id;

            return (
              <Link
                to={`/courses/${course._id}`}
                key={course._id}
                className={styles.cardLink}
              >
                <div className={styles.courseCardContainer}>
                  <div className={styles.courseCard}>
                    <div
                      className={styles.cardImage}
                      style={{ backgroundColor: course.color }}
                    ></div>

                    <div className={styles.cardContent}>
                      <h4>{course.name}</h4>

                      <div className={styles.cardMeta}>
                        {course.bestseller && (
                          <span
                            className={`${styles.tag} ${styles.bestsellerTag}`}
                          >
                            Bestseller
                          </span>
                        )}

                        <span className={styles.rating}>
                          <span className={styles.ratingAverage}>
                            {course.rating.average.toFixed(1)}
                          </span>

                          {/* SVG Star Icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            width="16"
                            height="16"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.868 2.884c.321-.662 1.215-.662 
                              1.536 0l1.681 3.468 3.82 1.226c.72.231.956 
                              1.141.432 1.658l-2.932 2.862.923 4.14c.143.642
                              -.647 1.13-1.233.82l-3.56-1.872-3.56 1.872c
                              -.586.31-1.376-.178-1.233-.82l.923-4.14-2.932
                              -2.862c-.524-.517-.288-1.427.432-1.658l3.82
                              -1.226 1.681-3.468z"
                              clipRule="evenodd"
                            />
                          </svg>

                          <span className={styles.ratingCount}>
                            ({course.rating.count} ratings)
                          </span>
                        </span>
                      </div>

                      <p className={styles.teacherName}>
                        Taught by: {course.teacher?.name || 'Unknown Teacher'}
                      </p>

                      {user && user.role === 'student' && (
                        isEnrolled ? (
                          <div
                            className={`${styles.btn} ${styles.btnUnenroll}`}
                          >
                            ✓ Enrolled
                          </div>
                        ) : (
                          <div className={`${styles.btn} ${styles.btnEnroll}`}>
                            View Details
                          </div>
                        )
                      )}

                      {user && isMyTeachingCourse && (
                        <span className={styles.tag}>
                          You are teaching this course
                        </span>
                      )}
                    </div>
                  </div>

                  <CourseTooltip course={course} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CourseListPage;

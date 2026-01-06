import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import styles from './course.module.css';
import CourseTooltip from '../../components/course/CourseTooltip.jsx';

const CourseListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myCourses } = useCourses();

  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ URL is the source of truth
  const params = new URLSearchParams(location.search);
  const category = params.get('category') || '';
  const level = params.get('level') || '';
  const hasActiveFilters = params.toString().length > 0;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newParams = new URLSearchParams(location.search);

    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }

    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses${location.search}`);
        setDisplayedCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setDisplayedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [location.search]);

  const myCourseIds = Array.isArray(myCourses)
    ? myCourses.map(c => c._id)
    : [];

  return (
    <div className={styles.pageContainer}>
      {/* 🔹 Sticky Header + Filters */}
      <div className={styles.headerBlock}>
        <h1 className={styles.pageTitle}>
          <p>Explore Courses</p>
        </h1>

        <div className={styles.filterBar}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              name="category"
              value={category}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Categories</option>
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
            <select
              name="level"
              value={level}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔹 Content */}
      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : displayedCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.noCoursesText}>
            No courses match your current filters.
          </p>

          {hasActiveFilters && (
            <button
              className="btn btn-outline"
              onClick={() => navigate('/courses')}
            >
              Clear filters & view all courses
            </button>
          )}
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {displayedCourses.map(course => {
            const isEnrolled =
              user?.role === 'student' && myCourseIds.includes(course._id);

            const isMyTeachingCourse =
              user?.role === 'teacher' && course.teacher?._id === user.id;

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
                    />

                    <div className={styles.cardContent}>
                      <h4>{course.name}</h4>

                      <div className={styles.cardMeta}>
                        {course.bestseller && (
                          <span className={styles.bestsellerTag}>
                            Bestseller
                          </span>
                        )}
                      </div>

                      <p className={styles.teacherName}>
                        Taught by: {course.teacher?.name || '...'}
                      </p>

                      {user?.role === 'student' && (
                        isEnrolled ? (
                          <div className={`${styles.btn} ${styles.btnUnenroll}`}>
                            ✓ Enrolled
                          </div>
                        ) : (
                          <div className={`${styles.btn} ${styles.btnEnroll}`}>
                            View Details
                          </div>
                        )
                      )}

                      {isMyTeachingCourse && (
                        <div className={styles.tag}>Your Course</div>
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

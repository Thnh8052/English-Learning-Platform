import { useCourses } from '../../contexts/CoursesContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './course.module.css';

const CourseListPage = () => {
  // --- BƯỚC 1: LẤY DỮ LIỆU TỪ CÁC CONTEXT ---
  const { user } = useAuth();
  const { allCourses, myCourses, loading, enrollCourse } = useCourses();

  // --- BƯỚC 2: XỬ LÝ TRẠNG THÁI LOADING ---
  // Hiển thị thông báo chờ trong khi dữ liệu đang được tải từ API
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Available Courses</h1>
        <p className={styles.loadingText}>Loading courses...</p>
      </div>
    );
  }

  // --- BƯỚC 3: XỬ LÝ DỮ LIỆU SAU KHI TẢI XONG ---

  // Luôn đảm bảo `myCourseIds` là một mảng, kể cả khi người dùng chưa đăng nhập.
  // Điều này giúp code an toàn và tránh lỗi.
  const myCourseIds = Array.isArray(myCourses) 
    ? myCourses.map(course => course._id) 
    : [];

  // Kiểm tra xem `allCourses` có phải là một mảng hợp lệ và có chứa dữ liệu không.
  const hasCourses = Array.isArray(allCourses) && allCourses.length > 0;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Available Courses</h1>
      
      {!hasCourses ? (
        // Hiển thị thông báo nếu không có khóa học nào từ API
        <p className={styles.noCoursesText}>There are no courses available at the moment. Please check back later!</p>
      ) : (
        // Nếu có khóa học, render danh sách
        <div className={styles.courseGrid}>
          {allCourses.map(course => {
            // Xác định trạng thái của người dùng đối với khóa học này
            const isEnrolled = user && user.role === 'student' && myCourseIds.includes(course._id);
            const isMyTeachingCourse = user && user.role === 'teacher' && course.teacher?._id === user.id;

            return (
              <div key={course._id} className={styles.courseCard}>
                <div className={styles.cardImage} style={{ backgroundColor: course.color }}></div>
                <div className={styles.cardContent}>
                  <h4>{course.name}</h4>
                  {/* Sử dụng optional chaining `?.` để tránh lỗi nếu `teacher` không được populate */}
                  <p className={styles.teacherName}>Taught by: {course.teacher?.name || 'Unknown Teacher'}</p>

                  {/* --- HIỂN THỊ NÚT HÀNH ĐỘNG DỰA TRÊN VAI TRÒ VÀ TRẠNG THÁI --- */}

                  {/* 1. Nếu người dùng là sinh viên */}
                  {user && user.role === 'student' && (
                    isEnrolled ? (
                      <button className={`${styles.btn} ${styles.btnUnenroll}`} disabled>
                        ✓ Enrolled
                      </button>
                    ) : (
                      <button 
                        className={`${styles.btn} ${styles.btnEnroll}`} 
                        onClick={() => enrollCourse(course._id)}
                      >
                        Enroll Now
                      </button>
                    )
                  )}

                  {/* 2. Nếu người dùng là giáo viên và đây là khóa học của họ */}
                  {user && isMyTeachingCourse && (
                    <span className={styles.tag}>You are teaching this course</span>
                  )}
                  
                  {/* 3. Nếu người dùng là khách (chưa đăng nhập), không hiển thị nút nào */}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseListPage;
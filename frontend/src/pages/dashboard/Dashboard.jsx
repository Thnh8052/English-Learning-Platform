import { useState, useEffect } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StudentView from "./Views/Student/StudentView";
import TeacherView from "./Views/Teacher/TeacherView";
import AdminView from "./Views/Admin/AdminView";
import styles from "./dashboard.module.css";

//COMPONENT SIDEBAR TRÁI
const NavigationSidebar = () => {
  const { user } = useAuth();
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toggle menu
  const toggleCourses = () => {
    setIsCoursesExpanded(prevState => !prevState);
  };

  // Fetch dữ liệu khóa học dựa trên Role
  useEffect(() => {
    const fetchSidebarCourses = async () => {
      if (!user) return;
      setLoading(true);
      try {
        let res;
        if (user.role === 'student') {
          res = await api.get('/courses/my-courses');
        } else if (user.role === 'teacher') {
          res = await api.get('/courses/my-teaching-courses');
        }
        
        if (res && res.data) {
          setCourses(res.data);
        }
      } catch (error) {
        console.error("Failed to load sidebar courses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarCourses();
  }, [user]);

  // Xác định đường dẫn dựa trên Role
  const getCourseLink = (courseId) => {
    if (user.role === 'teacher') {
      return `/teacher/courses/${courseId}/dashboard`; // Giáo viên -> Trang quản lý
    }
    return `/courses/${courseId}`; // Học viên -> Trang chi tiết khóa học
  };

  return (
    <div className={styles.block}>
      <h3>Navigation</h3>
      <nav>
        <ul className={styles.navList}>
          <li><Link to="/dashboard" className={styles.navLinkActive}>Dashboard</Link></li>
          <li><Link to="/" className={styles.navLink}>Site home</Link></li>
          
          {/* Mục My Courses */}
          {(user.role === 'student' || user.role === 'teacher') && (
            <li>
              <div className={styles.navLink} onClick={toggleCourses}>
                <span>My courses</span>
                <svg className={`${styles.navIcon} ${isCoursesExpanded ? styles.expanded : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </div>
              
              <ul className={`${styles.courseSublist} ${isCoursesExpanded ? styles.expanded : ''}`}>
                {loading ? (
                  <li className={styles.loadingItem}>Loading...</li>
                ) : courses.length > 0 ? (
                  courses.map(course => (
                    <li key={course._id}>
                      <Link to={getCourseLink(course._id)} title={course.name}>
                        › {course.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className={styles.emptyItem}>No courses found</li>
                )}
              </ul>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};


// --- COMPONENT SIDEBAR PHẢI (Giữ nguyên logic cũ) ---
const CalendarSidebar = ({ user }) => (
  <>
    <div className={styles.block}>
      <h3>October 2025</h3>
      <div className={styles.calendarGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayInitial, index) => (
          <span key={`${dayInitial}-${index}`} className={styles.dayHeader}>
            {dayInitial}
          </span>
        ))}
        <span></span><span></span><span></span>
        {[...Array(31).keys()].map(i => {
          const day = i + 1;
          let className = styles.day;
          if (day === 22) className += ` ${styles.today}`;
          if (day === 26) className += ` ${styles.eventDue}`;
          return <span key={day} className={className}>{day}</span>;
        })}
      </div>
    </div>
    <div className={styles.block}>
      <h3>Upcoming events</h3>
      <div className={styles.eventItem}>
        <a href="#">Homework Chapter 2 due</a>
        <p>Sunday, 26 October, 11:59 PM</p>
      </div>
      {user.role === 'teacher' && (
        <button className={styles.addEventButton}>+ Add new event</button>
      )}
    </div>
  </>
);


export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <p>Loading...</p>;

  const RoleView = {
    student: StudentView,
    teacher: TeacherView,
    admin: AdminView,
  }[user.role] || (() => <p>Unknown role</p>);

  if (user.role === 'admin') {
    return <AdminView user={user} />;
  }

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.navSidebar}><NavigationSidebar /></aside>
      
      <main className={styles.mainContent}>
        <h1 className={styles.mainTitle}>Dashboard</h1>
        <p className={styles.mainSubtitle}>Welcome back, {user.name}!</p>
        <RoleView user={user} />
      </main>

      <aside className={styles.calendarSidebar}><CalendarSidebar user={user} /></aside>
    </div>
  );
}
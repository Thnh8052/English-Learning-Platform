import { useState } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../contexts/CoursesContext";
import { Link } from 'react-router-dom';
import StudentView from "./Views/Student/StudentView";
import TeacherView from "./Views/Teacher/TeacherView";
import AdminView from "./Views/Admin/AdminView";
import styles from "./dashboard.module.css";

// --- COMPONENTS ---
const MobileHeader = ({ onToggleMenu }) => (
  <div className={styles.mobileHeader}>
    <button onClick={onToggleMenu} className={styles.menuToggle} aria-label="Toggle Menu">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </button>
    <span className={styles.mobileTitle}>Dashboard</span>
  </div>
);

const NavigationSidebar = ({ isMobileOpen, onClose }) => {
  const { user } = useAuth();
  const { visibleMyCourses, loading } = useCourses();
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);

  if (!user) return null;

  return (
    <>
      <div 
        className={`${styles.sidebarOverlay} ${isMobileOpen ? styles.show : ''}`} 
        onClick={onClose}
      />
      
      <div className={`${styles.navSidebarContent} ${isMobileOpen ? styles.open : ''}`}>
        <div className={styles.block}>
          <div className={styles.navHeader}>
            <h3>Navigation</h3>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          </div>
          
          <nav>
            <ul className={styles.navList}>
              <li>
                <Link to="/" className={styles.navLink}>
                  <span className={styles.icon}></span> Back to Homepage
                </Link>
              </li>

              <li>
                <Link to="/dashboard" className={styles.navLinkActive}>
                  <span className={styles.icon}></span> Dashboard
                </Link>
              </li>

              {(user.role === 'student' || user.role === 'teacher') && (
                <li>
                  <div className={styles.navLink} onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}>
                    <span className={styles.flexCenter}><span className={styles.icon}></span> My courses</span>
                    <svg
                      className={`${styles.chevron} ${isCoursesExpanded ? styles.expanded : ''}`}
                      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  <ul className={`${styles.courseSublist} ${isCoursesExpanded ? styles.expanded : ''}`}>
                    {loading ? (
                      <li className={styles.loadingItem}>Loading...</li>
                    ) : visibleMyCourses.length > 0 ? (
                      visibleMyCourses.map(course => (
                        <li key={course._id}>
                        <Link to={`/courses/${course._id}`}>
                          {course.name}
                        </Link>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No active courses</li>
                    )}
                  </ul>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

// --- DYNAMIC CALENDAR COMPONENT ---
const CalendarSidebar = ({ user }) => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthName = today.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const emptySlots = Array(firstDayIndex).fill(null);

  const daysArray = [...Array(daysInMonth).keys()].map(i => i + 1);

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.block}>
        <div className={styles.calendarHeader}>
            <h3>{monthName} {currentYear}</h3>
        </div>
        <div className={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className={styles.dayHeader}>{d}</span>
          ))}
          
          {emptySlots.map((_, i) => <span key={`empty-${i}`}></span>)}

          {daysArray.map(day => {
            let className = styles.day;
            if (day === currentDay) className += ` ${styles.activeDay}`;
            
            return <span key={day} className={className}>{day}</span>;
          })}
        </div>
      </div>

      <div className={styles.block}>
        <h3>Upcoming Tasks</h3>
         <div className={styles.eventItem}>
        </div>

        {user.role === 'teacher' && (
          <button className={styles.addEventButton}>
            <span>+</span> Add Event
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function Dashboard() {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <p className="container">Loading...</p>;

  const RoleView = {
    student: StudentView,
    teacher: TeacherView,
    admin: AdminView,
  }[user.role] || StudentView;

  if (user.role === 'admin') {
     return <AdminView user={user} />;
  }

  return (
    <div className={`${styles.dashboardLayout} ${styles[`role-${user.role}`]}`}>
      
      <MobileHeader onToggleMenu={() => setSidebarOpen(true)} />

      <aside className={styles.navSidebar}>
        <NavigationSidebar 
          isMobileOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.welcomeBanner}>
            <div>
                <h1 className={styles.mainTitle}>Dashboard</h1>
                <p className={styles.mainSubtitle}>Welcome back, <strong>{user.name}</strong>!</p>
            </div>
        </header>
        
        <RoleView user={user} />
      </main>

      <aside className={styles.calendarSidebar}>
        <CalendarSidebar user={user} />
      </aside>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Header.module.css";
import avatarDefault from "../../assets/default-avatar.png";
import Searchbar from "./searchBar";


export default function StudentHeader() {
  const { user } = useAuth();
  {user && user.role === "admin" && <NavLink to="/admin">Admin Panel</NavLink>}
  {user && user.role === "teacher" && <NavLink to="/teacher">My Courses</NavLink>}
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // 🔹 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.StudentHeader}>
      {/* Logo */}
      <NavLink to="/" className={styles.logo}>
        IELTS Hub
      </NavLink>

      <Searchbar />

      {/*Bên phải */}
      <div className={styles.rightSection}>
        {/* Notification Bell */}
        {user && (
          <div className={styles.notificationWrapper} ref={notifRef}>
            <button
              className={styles.bellBtn}
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              🔔
              <span className={styles.bellDot}></span>
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className={styles.notifDropdown}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className={styles.notifTitle}>Notifications</p>
                  <div className={styles.notifList}>
                    <div className={styles.notifItem}>
                      🗓️ New IELTS Speaking class available!
                    </div>
                    <div className={styles.notifItem}>
                      📝 Your Writing Task 2 feedback is ready.
                    </div>
                    <div className={styles.notifItem}>
                      🎯 You completed Lesson 3: Writing Cohesion.
                    </div>
                  </div>
                  <button
                    className={styles.viewAllBtn}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                  >
                    View all →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Menu */}
        {!user ? (
          <div className={styles.links}>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </div>
        ) : (
          <div className={styles.profileMenu} ref={profileRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <img
                src={user.avatar || avatarDefault}
                alt="user avatar"
                className={styles.avatar}
              />
              <span className={styles.userName}>
                {user.name?.split(" ")[0] || "User"}
              </span>
              <span className={styles.arrow}>▾</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
}

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import api from "../services/api.js";

const CourseContext = createContext(null);

function CourseProvider({ children }) {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    console.log("CONTEXT: Bắt đầu fetch dữ liệu...");

    try {
      const allCoursesRes = await api.get("/courses");
      console.log("CONTEXT: Response từ /api/courses:", allCoursesRes);
      setAllCourses(allCoursesRes.data || []);

      // Nếu người dùng đã đăng nhập → xác định role cụ thể
      if (user && user.role) {
        if (user.role === "student") {
          console.log("CONTEXT: User là student, fetching my-courses...");
          const myCoursesRes = await api.get("/courses/my-courses");
          setMyCourses(myCoursesRes.data || []);
        } else if (user.role === "teacher") {
          console.log("CONTEXT: User là teacher, fetching my-teaching-courses...");
          const myCoursesRes = await api.get("/courses/my-teaching-courses");
          setMyCourses(myCoursesRes.data || []);
        } else {
          console.log("CONTEXT: User là admin, bỏ qua fetch");
          setMyCourses([]);
        }
      } else {
        // Nếu chưa đăng nhập
        console.log("CONTEXT: User chưa đăng nhập, set myCourses = []");
        setMyCourses([]);
      }
    } catch (error) {
      console.error("CONTEXT: Lỗi khi fetch:", error);
      setAllCourses([]);
      setMyCourses([]);
    } finally {
      setLoading(false);
      console.log("CONTEXT: Fetch dữ liệu hoàn tất.");
    }
  };

  fetchData();
}, [user]);
const refreshMyCourses = async () => {
  if (!user || !user.role) return;

  try {
    if (user.role === "student") {
      const res = await api.get("/courses/my-courses");
      setMyCourses(res.data || []);
    } else if (user.role === "teacher") {
      const res = await api.get("/courses/my-teaching-courses");
      setMyCourses(res.data || []);
    }
  } catch (err) {
    console.error("Failed to refresh my courses:", err);
  }
};
  const visibleMyCourses = useMemo(() => {
    return myCourses.filter(course => course.status !== "rejected");
  }, [myCourses]);
  const addCourse = async (courseData) => {};
  const enrollCourse = async (courseId) => {
    if (!user || user.role !== 'student') {
        alert("Please log in as a student to enroll.");
        return;
    }
    try {
        await api.post(`/courses/${courseId}/enroll`);
                const updatedMyCourses = await api.get('/courses/my-courses');
        setMyCourses(updatedMyCourses.data);

        alert("Enrollment successful! You can now access the course content.");

    } catch (error) {
        console.error("Failed to enroll in course:", error);
        alert(error.response?.data?.message || "An error occurred during enrollment.");
    }
  };
const value = useMemo(
  () => ({
    allCourses,
    myCourses,
    visibleMyCourses,
    loading,
    addCourse,
    enrollCourse,
    setMyCourses,
    refreshMyCourses,
  }),
  [allCourses, myCourses, visibleMyCourses, loading]
);

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

function useCourses() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses() must be used within a CourseProvider");
  }
  return context;
}

CourseProvider.displayName = "CourseProvider";
useCourses.displayName = "useCourses";

export { CourseProvider, useCourses };

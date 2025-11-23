import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPassword.jsx";
import ResetPasswordPage from "../pages/auth/ResetPassword.jsx";

import Courses from "../pages/courses/CourseList.jsx";
import Discussion from "../pages/discussion/Discussion.jsx";
import NotFound from "../pages/notFound/NotFound.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Profile from "../pages/profile/Profile.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";
import CourseDetailPage from "../pages/courses/CourseDetailPage.jsx";
import CreateCoursePage from "../pages/teacher/createCourse.jsx";
import AdminReviewPage from '../pages/admin/adminReviewPage.jsx';
import EditCoursePage from "../pages/teacher/editCoursePage.jsx";
import LessonView from '../pages/lessons/LessonView.jsx';
import QuizBuilder from "../pages/teacher/quizBuilder.jsx";
import SpeakingBuilder from "../pages/teacher/speakingBuilder.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,

    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },
      { path: "courses", element: <Courses /> },
      { path: "discussion", element: <Discussion /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "lessons/:lessonId", element: <LessonView /> },


      {
        element: <ProtectedRoute />,
        children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "teacher", element: <Dashboard /> },
      { path: "admin", element: <Dashboard /> },
      { path: "profile", element: <Profile /> },
      { path: "teacher/create-course", element: <CreateCoursePage /> },
      { path: "admin/review/:courseId", element: <AdminReviewPage /> },
      { path: "teacher/edit-course/:courseId", element: <EditCoursePage /> },
      { path: "teacher/quiz-builder/:lessonId", element: <QuizBuilder /> },
      { path: "teacher/lesson/:lessonId/speaking", element: <SpeakingBuilder /> },

        ],   
      },   
    ],
  },
]);

export default router;

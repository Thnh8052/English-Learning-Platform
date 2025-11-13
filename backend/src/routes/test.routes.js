import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

//Chỉ ADMIN
router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: `Xin chào Admin ${req.user.name}` });
});

//Chỉ TEACHER
router.get("/teacher", protect, authorizeRoles("teacher"), (req, res) => {
  res.json({ message: `Xin chào Giáo viên ${req.user.name}` });
});

//Chỉ STUDENT
router.get("/student", protect, authorizeRoles("student"), (req, res) => {
  res.json({ message: `Xin chào Học viên ${req.user.name}` });
});



export default router;

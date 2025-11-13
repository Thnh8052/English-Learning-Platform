import express from "express";
import { createModule,deleteModule,updateModule  } from "../controllers/lessonModules.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";


const router = express.Router();

// POST /api/modules -> Tạo module mới
router.post('/', protect, authorizeRoles('teacher'), createModule);

// DELETE /api/modules/:id -> Xóa module
router.delete('/:id', protect, authorizeRoles('teacher'), deleteModule);

// PUT /api/modules/:id -> Cập nhật module
router.put('/:id', protect, authorizeRoles('teacher'), updateModule);

export default router;
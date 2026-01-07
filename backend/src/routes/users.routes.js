import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  updateProfile,
  changePassword,
  uploadAvatarController,
} from "../controllers/users.controller.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post(
  "/upload/avatar",
  protect,
  uploadAvatar.single("avatar"),
  uploadAvatarController
);

export default router;

import multer from "multer";
import { avatarStorage } from "../config/cloudinary.js";

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho các loại file khác nhau
export const lessonStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lessons', // Lưu file vào thư mục 'lessons' trên Cloudinary
        resource_type: 'auto', // Tự động nhận diện loại file (video, image, raw)
        type: 'upload'
    }
});
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',          // Cloudinary folder
    resource_type: 'image',     // Avatar = image only
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill' }
    ],
  },
});

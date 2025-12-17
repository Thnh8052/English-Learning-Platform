import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import connectDB from "./src/config/database.js";
import authRoutes from "./src/routes/auth.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import courseRoutes from "./src/routes/courses.routes.js";
import lessonRoutes from "./src/routes/lesson.routes.js";
import submissionRoutes from './src/routes/submissions.routes.js';
import moduleRoutes from './src/routes/modules.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

dotenv.config();
connectDB();

const app = express();

// 2. Cấu hình Helmet: Cho phép load tài nguyên (Audio/Image) cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 3. Cấu hình đường dẫn tuyệt đối cho thư mục Uploads
// Giúp tránh lỗi không tìm thấy file trên Windows hoặc khi deploy
const __dirname = path.resolve(); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limit cho Auth
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many requests from this IP, try again later",
});

// --- ROUTES ---
app.use("/api/auth", authLimiter, authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/ai', aiRoutes);

app.get("/", (req, res) => res.send("Backend API is running..."));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Xử lý lỗi Unhandled Rejection
process.on('unhandledRejection', (err, promise) => {
    console.error(`--- LỖI UNHANDLED REJECTION ---`);
    console.error(`Lỗi tại Promise:`, promise);
    console.log("Tên lỗi:", err.name);
    console.log("Thông báo lỗi:", err.message);
    
});

export default app;
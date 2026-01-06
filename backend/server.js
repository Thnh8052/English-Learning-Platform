import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { fileURLToPath } from 'url';

import connectDB from "./src/config/database.js";
import authRoutes from "./src/routes/auth.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import courseRoutes from "./src/routes/courses.routes.js";
import lessonRoutes from "./src/routes/lesson.routes.js";
import submissionRoutes from './src/routes/submissions.routes.js';
import moduleRoutes from './src/routes/modules.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import usersRoutes from "./src/routes/users.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARES ---
// 1. Helmet: Cho phép load tài nguyên cross-origin (Audio/Video)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS & Parser
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 3. Static Files
// Đường dẫn tuyệt đối chuẩn xác
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Rate Limiter
const authLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  message: { message: "Too many requests from this IP, please try again later" }, // Trả về JSON thay vì text
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
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => res.send("Backend API is running..."));

// Middleware này sẽ bắt tất cả lỗi từ các controller gọi next(err) hoặc throw error
app.use((err, req, res, next) => {
    console.error("❌ Error:", err);

    // Xử lý lỗi Mongoose Validation (ví dụ lỗi thiếu field content)
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            message: "Dữ liệu đầu vào không hợp lệ",
            errors: messages
        });
    }

    // Xử lý lỗi CastError (ID không đúng định dạng MongoDB)
    if (err.name === 'CastError') {
        return res.status(404).json({ message: "Không tìm thấy dữ liệu (Invalid ID)" });
    }

    // Lỗi mặc định
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message || "Lỗi Server nội bộ",
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Xử lý lỗi Unhandled Rejection (Lỗi Promise ko được catch)
process.on('unhandledRejection', (err) => {
    console.error(`--- LỖI UNHANDLED REJECTION ---`);
    console.log("Error:", err.message);
});

export default app;
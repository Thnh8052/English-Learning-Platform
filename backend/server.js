import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/database.js";
import authRoutes from "./src/routes/auth.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import courseRoutes from "./src/routes/courses.routes.js";
import lessonRoutes from "./src/routes/lesson.routes.js";
import moduleRoutes from './src/routes/modules.routes.js';

import submissionRoutes from './src/routes/submissions.routes.js';


import adminRoutes from './src/routes/admin.routes.js';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

dotenv.config();
connectDB();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use('/uploads', express.static('uploads'));




app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/test', testRoutes); // Thêm route để test phân quyền
app.use('/api/lessons', lessonRoutes);

app.use('/api/submissions', submissionRoutes);
// Thêm admin routes
app.use('/api/admin', adminRoutes);

// Thêm module routes
app.use('/api/modules', moduleRoutes);


// rate limit (ví dụ cho auth)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many requests from this IP, try again later",
});

app.use("/api/auth", authLimiter, authRoutes);

app.get("/", (req, res) => res.send("Backend API is running..."));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Xử lý các lỗi không được bắt
process.on('unhandledRejection', (err, promise) => {
    console.error(`--- LỖI UNHANDLED REJECTION ---`);
    console.error(`Lỗi tại Promise:`, promise);
    
    // In ra toàn bộ thông tin lỗi một cách chi tiết
    console.log("Tên lỗi:", err.name);
    console.log("Thông báo lỗi:", err.message);
    console.log("Stack trace:", err.stack);
    console.dir(err, { depth: null });

    console.error(`Đang đóng server...`);
    server.close(() => {
        process.exit(1);
    });
});
export default app;

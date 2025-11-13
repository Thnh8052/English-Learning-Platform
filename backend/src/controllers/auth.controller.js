import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

//Tạo JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

//Đăng ký
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

    if (password.length < 6)
      return res.status(400).json({ message: "Mật khẩu phải ít nhất 6 ký tự" });

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ message: "Email đã tồn tại" });

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Lấy thông tin người dùng
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

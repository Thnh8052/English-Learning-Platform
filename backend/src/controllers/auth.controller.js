import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sgMail from '@sendgrid/mail';

import dotenv from 'dotenv';
dotenv.config();

// Cấu hình SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('[DEBUG] SendGrid API Key being used:', process.env.SENDGRID_API_KEY ? 'Key exists' : 'Key is MISSING or undefined!');

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

/**
 * @desc    Xử lý yêu cầu quên mật khẩu
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log(`[AUTH] Yêu cầu reset cho email không tồn tại: ${req.body.email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const msg = {
      to: user.email,
      from: {
        name: 'IELTS Hub Support',
        email: process.env.FROM_EMAIL
      },
      subject: 'Password Reset Request',
      text: `Please use the following link to reset your password: ${resetUrl}`,
    };

    await sgMail.send(msg);

    console.log(`[AUTH] Đã gửi email reset đến: ${user.email}`);
    res.status(200).json({ message: 'Email sent' });

  } catch (err) {
    console.error('[AUTH] Lỗi trong forgotPassword:', err);
    if (req.body.email) {
        const userToClean = await User.findOne({ email: req.body.email });
        if (userToClean) {
            userToClean.resetPasswordToken = undefined;
            userToClean.resetPasswordExpire = undefined;
            await userToClean.save({ validateBeforeSave: false });
        }
    }
    res.status(500).json({ message: 'Error sending email.' });
  }
};
/**
 * @desc    Đặt lại mật khẩu người dùng
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Tự động đăng nhập: Trả về token và user mới
    const loginToken = generateToken(user);
    res.json({
        token: loginToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
  } catch (err) {
    console.error('[AUTH] Lỗi trong resetPassword:', err);
    res.status(500).json({ message: 'Server error.' });
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
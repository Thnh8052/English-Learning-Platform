import User from "../models/user.model.js";

/* ======================================================
   UPDATE PROFILE (name, bio, avatar)
   PUT /api/users/profile
====================================================== */
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    // Remove sensitive data
    updatedUser.password = undefined;

    res.json(updatedUser);
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* ======================================================
   CHANGE PASSWORD (logged-in user)
   PUT /api/users/change-password
====================================================== */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save(); // bcrypt hash via pre-save hook

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};

/* ======================================================
   UPLOAD AVATAR (Cloudinary)
   POST /api/users/upload/avatar
====================================================== */
export const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Cloudinary returns the URL in req.file.path
    const avatarUrl = req.file.path;

    res.json({ url: avatarUrl });
  } catch (err) {
    console.error("❌ Avatar upload error:", err);
    res.status(500).json({ message: "Avatar upload failed" });
  }
};

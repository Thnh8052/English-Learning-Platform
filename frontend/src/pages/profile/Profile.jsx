import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import styles from "./profile.module.css";
import { DEFAULT_AVATAR } from "../../constants/media";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ---------------- PROFILE INFO ---------------- */
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });

  /* ---------------- PASSWORD ---------------- */
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* ---------------- AVATAR ---------------- */
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  /* ---------------- HANDLERS ---------------- */
  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  /* ---------------- AVATAR UPLOAD (CLOUDINARY) ---------------- */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    try {
      const form = new FormData();
      form.append("avatar", file);

      const res = await api.post("/users/upload/avatar", form);
      updateUser({ ...user, avatar: res.data.url });
      setMessage("Avatar updated");
    } catch (err) {
      console.error(err);
      setAvatarPreview(user.avatar);
      setMessage("Avatar upload failed");
    }
  };

  /* ---------------- UPDATE PROFILE ---------------- */
const handleProfileSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const res = await api.put("/users/profile", formData);

    updateUser({
      ...user,
      ...res.data,
      avatar: user.avatar, // preserve avatar from upload endpoint
    });

    setMessage("Profile updated successfully");
  } catch (err) {
    console.error(err);
    setMessage("Profile update failed");
  } finally {
    setLoading(false);
  }
};

  /* ---------------- CHANGE PASSWORD ---------------- */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage("Passwords do not match");
    }

    try {
      await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      setMessage("Password update failed");
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <label className={styles.avatarWrapper}>
          <img src={avatarPreview || user.avatar || DEFAULT_AVATAR} alt="avatar"
            onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR;
          }}/>
          <input type="file" hidden onChange={handleAvatarChange} />
        </label>

        <h3 className={styles.userName}>{user.name}</h3>
        <span className={styles.userRole}>{user.role}</span>

        <nav className={styles.navMenu}>
          <button
            className={`${styles.navItem} ${activeTab === "profile" ? styles.active : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "password" ? styles.active : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Password
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "security" ? styles.active : ""}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
        </nav>
      </aside>

      <section className={styles.contentPanel}>
        {message && <p className={styles.message}>{message}</p>}

        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full name</label>
              <input
                className={styles.input}
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Bio</label>
              <textarea
                className={styles.input}
                name="bio"
                value={formData.bio}
                onChange={handleProfileChange}
              />
            </div>

            <button className={styles.saveBtn} disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Current password</label>
              <input
                className={styles.input}
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>New password</label>
              <input
                className={styles.input}
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Confirm password</label>
              <input
                className={styles.input}
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <button className={styles.saveBtn}>Update password</button>
          </form>
        )}

        {activeTab === "security" && (
          <div className={styles.dangerZone}>
            <button className={styles.logoutBtn} onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;

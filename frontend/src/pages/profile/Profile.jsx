import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const fileInputRef = useRef(null);

  // State giả lập dữ liệu form (lấy user làm default)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý click chọn ảnh
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Xử lý xem trước ảnh khi chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Giả lập lưu thông tin
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Đã lưu thông tin thành công (UI Only)!");
    // Sau này sẽ gọi API updateProfile tại đây
  };

  return (
    <div className={styles.container}>
      
      {/* --- SIDEBAR TRÁI --- */}
      <aside className={styles.sidebar}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
            <div className={styles.avatar}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className={styles.editOverlay}>📷</div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              onChange={handleFileChange} 
              accept="image/*"
            />
          </div>
          <h3 className={styles.userName}>{user?.name}</h3>
          <span className={styles.userRole}>{user?.role}</span>
        </div>

        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span>👤</span> Thông tin chung
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'password' ? styles.active : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <span>🔒</span> Đổi mật khẩu
          </button>
          
          <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={logout}>
            <span>🚪</span> Đăng xuất
          </button>
        </nav>
      </aside>

      {/* --- NỘI DUNG PHẢI --- */}
      <main className={styles.contentPanel}>
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit}>
            <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
            <p className={styles.panelDesc}>Quản lý thông tin hiển thị của bạn</p>

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Họ và tên</label>
                <input 
                  type="text" 
                  name="name" 
                  className={styles.input}
                  value={formData.name} 
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  className={styles.input}
                  value={formData.email} 
                  disabled // Thường email không cho sửa trực tiếp
                  title="Không thể thay đổi email"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Số điện thoại</label>
                <input 
                  type="text" 
                  name="phone"
                  className={styles.input}
                  value={formData.phone} 
                  onChange={handleChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Giới thiệu bản thân (Bio)</label>
                <textarea 
                  name="bio"
                  rows="4"
                  className={styles.input}
                  value={formData.bio} 
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <button type="submit" className={styles.saveBtn}>Lưu thay đổi</button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleSubmit}>
            <h2 className={styles.panelTitle}>Đổi mật khẩu</h2>
            <p className={styles.panelDesc}>Vui lòng đặt mật khẩu mạnh để bảo mật tài khoản</p>

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  className={styles.input}
                  value={formData.currentPassword} 
                  onChange={handleChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Mật khẩu mới</label>
                <input 
                  type="password" 
                  name="newPassword"
                  className={styles.input}
                  value={formData.newPassword} 
                  onChange={handleChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  className={styles.input}
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className={styles.saveBtn}>Cập nhật mật khẩu</button>
          </form>
        )}
      </main>
    </div>
  );
}
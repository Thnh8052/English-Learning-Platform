import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import styles from "./Auth.module.css";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    day: "",
    month: "",
    year: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    const res = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    setLoading(false);

    if (res.success) {
      navigate("/");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join us and start learning today</p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nguyen Van A"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Date of Birth Group */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Date of Birth</label>
            <div className={styles.dobGroup}>
                <input
                  type="number"
                  name="day"
                  placeholder="Day"
                  value={formData.day}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.dobInput}`}
                  min="1" max="31"
                />
                <input
                  type="number"
                  name="month"
                  placeholder="Month"
                  value={formData.month}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.dobInput}`}
                  min="1" max="12"
                />
                <input
                  type="number"
                  name="year"
                  placeholder="Year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.dobInput}`}
                  min="1900" max="2025"
                />
            </div>
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                required
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                required
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?
          <Link to="/login" className={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
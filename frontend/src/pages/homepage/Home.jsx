import { useEffect, useState,useRef  } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../services/api';
import styles from "./home.module.css";

const scrollImages = [
  "/assets/home1.png",
  "/assets/home2.png"
];

function ScrollingImageList() {
  const marqueeImages = [...scrollImages, ...scrollImages];

  return (
    <div className={styles.imageMarqueeContainer}>
      <div className={styles.marqueeTrack}>
        {marqueeImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Gallery image ${index + 1}`}
            className={styles.marqueeImage}
          />
        ))}
      </div>
    </div>
  );
}
export function Home() {
  const navigate = useNavigate();
  const [homeCourses, setHomeCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchHomeCourses = async () => {
      try {
        const res = await api.get("/courses/home");
        setHomeCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch home courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchHomeCourses();
  }, []);
  const scrollRef = useRef(null);

  const smoothScroll = (direction) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const distance = 280;
    const duration = 400;
    const start = container.scrollLeft;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollLeft =
        start + (direction === "left" ? -1 : 1) * distance * ease;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className={styles.homeContainer}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Master IELTS with <span>AI Feedback</span>
          </h1>
          <p className={styles.subtitle}>
            Enhance your Speaking and Writing scores with real-time AI grading, 
            interactive quizzes, and expert-led video lessons.
          </p>
          <button 
            className={styles.ctaButton} 
            onClick={() => navigate("/courses")}
            aria-label="Start Learning Now"
          >
            Start Learning Now
          </button>
        </div>
          <ScrollingImageList />
      </section>

      {/* FEATURES SECTION */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose IELTS Hub?</h2>
          <p className={styles.sectionSubtitle}>Everything you need to achieve Band 7.0+</p>
        </div>
        
        <div className={styles.featureGrid}>
          <FeatureCard 
            icon="🤖" 
            title="AI-Powered Grading" 
            desc="Get instant, detailed feedback on your Speaking and Writing tasks powered by GPT-4."
          />
          <FeatureCard 
            icon="📚" 
            title="Structured Lessons" 
            desc="Step-by-step video courses covering all 4 skills: Listening, Reading, Writing, Speaking."
          />
          <FeatureCard 
            icon="📈" 
            title="Smart Tracking" 
            desc="Visualize your progress with detailed analytics and band score predictions."
          />
          <FeatureCard 
            icon="👥" 
            title="Active Community" 
            desc="Join study groups, practice with peers, and share tips in our dedicated forums."
          />
        </div>
      </section>

      {/* COURSES PREVIEW */}
      <section className={styles.courses}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Newest Courses</h2>
          <p className={styles.sectionSubtitle}>Start with our most latest modules</p>
        </div>

    <div className={styles.carouselWrapper}>
      <button
        className={styles.navButton}
        onClick={() => smoothScroll("left")}
        aria-label="Scroll left"
      >
        ‹
      </button>
      <div className={styles.carousel} ref={scrollRef}>
        {homeCourses.map(course => (
          <CourseCard
            key={course._id}
            id={course._id}
            title={course.name}
            desc={course.summary}
            color={course.color}
            teacher={course.teacher?.name}
            navigate={navigate}
          />
        ))}
      </div>

      <button
        className={styles.navButton}
        onClick={() => smoothScroll("right")}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function CourseCard({ id, title, desc, color, teacher, navigate }) {
  return (
    <div className={styles.courseCard}>
      <div
        className={styles.courseImageWrapper}
        style={{
          backgroundColor: color || "var(--color-student-primary-light)"
        }}
      />
      <div className={styles.courseContent}>
        <h3>{title}</h3>
        {teacher && (
          <p className={styles.teacherName}>
            By {teacher}
          </p>
        )}
        <p className={styles.courseDescription}>{desc}</p>
        <button
          className={styles.learnMore}
          onClick={() => navigate(`/courses/${id}`)}
        >
          View Course
        </button>
      </div>
    </div>
  );
}

export default Home;
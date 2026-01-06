import React from "react";
import { useNavigate } from "react-router-dom";
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
          <h2 className={styles.sectionTitle}>Popular Courses</h2>
          <p className={styles.sectionSubtitle}>Start with our most rated modules</p>
        </div>

        <div className={styles.courseGrid}>
          <CourseCard 
            id="1"
            title="Speaking Mastery" 
            desc="Conquer Part 1, 2, and 3 with confidence and fluency strategies."
            imgIndex={1}
            navigate={navigate}
          />
          <CourseCard 
            id="2"
            title="Writing Task 2 Pro" 
            desc="Learn essay structures, vocabulary, and grammar for high band scores."
            imgIndex={2}
            navigate={navigate}
          />
          <CourseCard 
            id="3"
            title="Listening Boost" 
            desc="Train your ear with accents from UK, US, and Australia."
            imgIndex={3}
            navigate={navigate}
          />
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

function CourseCard({ id, title, desc, imgIndex, navigate }) {
  return (
    <div className={styles.courseCard}>
      <div className={styles.courseImageWrapper}>
        <img
          src={`/assets/course-${imgIndex}.jpg`}
          alt={title}
          className={styles.courseImage}
          onError={(e) => {
             e.target.style.display = 'none';
             e.target.parentNode.style.backgroundColor = 'var(--color-student-primary-light)'; 
          }}
        />
      </div>
      <div className={styles.courseContent}>
        <h3>{title}</h3>
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
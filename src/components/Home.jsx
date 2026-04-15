import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, ClipboardList, ScanFace } from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className={styles.homeContainer}>

      {/* Decorative ambient orbs */}
      <div className={styles.orbBlue}></div>
      <div className={styles.orbPurple}></div>

      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.brandMark}>
          <ScanFace size={20} strokeWidth={1.5} />
          <span>SmartAttend</span>
        </div>
        <Link to="/admin-login" className={styles.adminBtn}>
          <Shield size={15} />
          Admin Portal
        </Link>
      </header>

      {/* Hero Section */}
      <main className={styles.contentWrapper}>

        <div className={styles.tagline}>
          <span className={styles.taglineDot}></span>
          Face Recognition System
        </div>

        <h1 className={styles.mainTitle}>
          Smart<span className={styles.titleAccent}> Attendance</span>
        </h1>
        <p className={styles.mainSubtitle}>
          AI-powered face recognition for instant, accurate attendance tracking.
        </p>

        {/* Action Cards */}
        <div className={styles.heroCards}>

          <Link to="/kiosk" className={styles.heroCard}>
            <div className={styles.cardIconWrapper}>
              <Camera size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Mark Attendance</h2>
              <p className={styles.cardDesc}>Look into the camera to log your attendance instantly</p>
            </div>
            <div className={styles.cardArrow}>→</div>
          </Link>

          <Link to="/student-login" className={styles.heroCard}>
            <div className={`${styles.cardIconWrapper} ${styles.iconGreen}`}>
              <ClipboardList size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Check Attendance</h2>
              <p className={styles.cardDesc}>Login to view your personal attendance history and records</p>
            </div>
            <div className={styles.cardArrow}>→</div>
          </Link>

        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>
          Face Recognition Attendance System · Built for SRMU
        </p>
        <p className={styles.madeBy}>
          Made by{' '}
          <a
            href="https://github.com/Adbhut1234"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.madeByAccent}
          >
            Adbhut Pandey & Rishab Kumar
          </a>
        </p>

      </main>
    </div>
  );
};

export default Home;

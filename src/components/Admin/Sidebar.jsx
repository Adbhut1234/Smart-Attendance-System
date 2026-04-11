import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, LogOut, ShieldCheck, Activity, Settings2 } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>

      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIconWrapper}>
          <ShieldCheck size={20} />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>SmartAttend</span>
          <span className={styles.brandSub}>Command Center</span>
        </div>
      </div>

      {/* Navigation */}
      <span className={styles.sectionLabel}>Navigation</span>
      <nav className={styles.navLinks}>
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
          <Activity className={styles.navIcon} />
          Live Dashboard
        </NavLink>

        <NavLink
          to="/admin/students"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
          <Users className={styles.navIcon} />
          Student Register
        </NavLink>

        <NavLink
          to="/admin/register"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
          <UserPlus className={styles.navIcon} />
          Enroll Student
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
          <Settings2 className={styles.navIcon} />
          Attendance Settings
        </NavLink>
      </nav>

      <div className={styles.divider} />

      {/* Logout */}
      <div className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut className={styles.navIcon} />
        Exit Portal
      </div>

      {/* Admin Identity Badge */}
      <div className={styles.adminBadge}>
        <div className={styles.avatarDot}>A</div>
        <div className={styles.adminInfo}>
          <span className={styles.adminName}>Administrator</span>
          <span className={styles.adminRole}>Full Access</span>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu, X, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import StudentList from './StudentList';
import Register from './Register';
import Settings from './Settings';
import SystemCheck from './SystemCheck';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.adminLayout}>
      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileBrand}>
          <div className={styles.mobileBrandIcon}>
            <ShieldCheck size={18} />
          </div>
          <span>SmartAttend</span>
        </div>
        <button className={styles.menuToggle} onClick={toggleSidebar}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={closeSidebar} />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Placeholders for future pages */}
            <Route path="students" element={<StudentList />} />
            <Route path="register" element={<Register />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system-check" element={<SystemCheck />} />
            
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

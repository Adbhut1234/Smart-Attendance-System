import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import StudentList from './StudentList';
import Register from './Register';
import Settings from './Settings';
import SystemCheck from './SystemCheck';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <Sidebar />
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

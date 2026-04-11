import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Scanner from './components/Scanner';

import AdminLayout from './components/Admin/AdminLayout';

import Home from './components/Home';
import Login from './components/Login';
import ViewLogs from './components/Student/ViewLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Kiosk Route */}
        <Route path="/kiosk" element={<Scanner />} />

        {/* Authentication Routes */}
        <Route path="/student-login" element={<Login role="student" />} />
        <Route path="/admin-login" element={<Login role="admin" />} />

        {/* Student Private View Logs Gateway */}
        <Route path="/view-logs" element={<ViewLogs />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { LogOut, CheckCircle2, Clock, Calendar, ScanFace, ClipboardList } from 'lucide-react';
import { getStudentLogs } from '../../services/appwrite';
import styles from './ViewLogs.module.css';

const CUTOFF_KEY = 'smartattend_cutoff_time';
const getAttendanceStatus = (timestamp) => {
  const cutoff = localStorage.getItem(CUTOFF_KEY) || '09:00';
  const [cutHour, cutMin] = cutoff.split(':').map(Number);
  const d = new Date(timestamp);
  const logMins = d.getHours() * 60 + d.getMinutes();
  return logMins < cutHour * 60 + cutMin ? 'Present' : 'Late Entry';
};

const ViewLogs = () => {
  const location = useLocation();
  const studentData = location.state?.student;

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!studentData) return;
      try {
        const studentLogs = await getStudentLogs(studentData.studentId);
        setLogs(studentLogs);
      } catch (error) {
        console.error('Failed to load personal logs', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [studentData]);

  if (!studentData) {
    return <Navigate to="/student-login" replace />;
  }

  const isRecent = (timestamp) => {
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    return diff < 12 * 60 * 60 * 1000;
  };

  const todayCount = logs.filter(
    (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
  ).length;

  // Avatar initials
  const initials = studentData.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.pageContainer}>

      {/* Ambient orb */}
      <div className={styles.orb}></div>

      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.brandMark}>
          <ScanFace size={18} strokeWidth={1.5} className={styles.brandIcon} />
          <span>SmartAttend</span>
        </div>
        <Link to="/" className={styles.logoutBtn}>
          <LogOut size={14} />
          Sign Out
        </Link>
      </header>

      <main className={styles.main}>

        {/* Profile hero */}
        <div className={styles.profileHero}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.profileInfo}>
            <h1 className={styles.studentName}>{studentData.name}</h1>
            <p className={styles.studentMeta}>
              <span className={styles.metaChip}>ID: {studentData.studentId}</span>
              <span className={styles.metaChip}>
                <ClipboardList size={12} /> {logs.length} total records
              </span>
              {todayCount > 0 && (
                <span className={`${styles.metaChip} ${styles.presentChip}`}>
                  <CheckCircle2 size={12} /> Present Today
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Attendance table card */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2 className={styles.tableTitle}>Attendance History</h2>
              <p className={styles.tableSubtitle}>Your personal face recognition records</p>
            </div>
            {!isLoading && (
              <span className={styles.countBadge}>{logs.length} entries</span>
            )}
          </div>

          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading your records...</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Date</th>
                    <th><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />Time</th>
                    <th>Match Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <div className={styles.emptyState}>
                          <ClipboardList size={36} strokeWidth={1} />
                          <p>No attendance records found for your account.</p>
                          <span>Visit the Kiosk to mark your first attendance.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const d = new Date(log.timestamp);
                      const dateStr = d.toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      });
                      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const recent = isRecent(log.timestamp);
                      const status = getAttendanceStatus(log.timestamp);

                      return (
                        <tr key={log.$id} className={`${styles.row} ${recent ? styles.recentRow : ''}`}>
                          <td><span className={styles.dateCell}>{dateStr}</span></td>
                          <td><span className={styles.timeCell}>{timeStr}</span></td>
                          <td>
                            <span className={styles.matchBadge}>
                              {Math.round(log.confidence * 100)}%
                            </span>
                          </td>
                          <td>
                            <span className={status === 'Late Entry' ? styles.lateChip : styles.statusChip}>
                              <CheckCircle2 size={13} />
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default ViewLogs;

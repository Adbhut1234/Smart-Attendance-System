import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Activity, Clock, TrendingUp } from 'lucide-react';
import { fetchLiveLogs, subscribeToAttendance, getRegisteredStudents } from '../../services/appwrite';
import styles from './Dashboard.module.css';

const CUTOFF_KEY = 'smartattend_cutoff_time';

// Derive status purely from the log's own timestamp vs current admin cutoff setting
const getAttendanceStatus = (timestamp) => {
  const cutoff = localStorage.getItem(CUTOFF_KEY) || '09:00';
  const [cutHour, cutMin] = cutoff.split(':').map(Number);
  const d = new Date(timestamp);
  const logMinutes = d.getHours() * 60 + d.getMinutes();
  const cutoffMinutes = cutHour * 60 + cutMin;
  return logMinutes < cutoffMinutes ? 'Present' : 'Late Entry';
};

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [newLogIds, setNewLogIds] = useState(new Set());
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    totalLogs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [initialLogs, students] = await Promise.all([
          fetchLiveLogs(),
          getRegisteredStudents(),
        ]);

        setLogs(initialLogs);

        const today = new Date().toDateString();
        const todayCount = initialLogs.filter(
          (log) => new Date(log.timestamp).toDateString() === today
        ).length;

        setStats({
          totalStudents: students.length,
          presentToday: todayCount,
          totalLogs: initialLogs.length,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Real-time subscription — handles both new scans and cascade deletions
    const unsubscribe = subscribeToAttendance(({ type, payload }) => {
      if (type === 'create') {
        setLogs((prev) => [payload, ...prev]);
        setStats((prev) => ({ ...prev, presentToday: prev.presentToday + 1, totalLogs: prev.totalLogs + 1 }));

        setNewLogIds((prev) => {
          const next = new Set(prev);
          next.add(payload.$id);
          return next;
        });

        setTimeout(() => {
          setNewLogIds((prev) => {
            const next = new Set(prev);
            next.delete(payload.$id);
            return next;
          });
        }, 3000);
      } else if (type === 'delete') {
        // Remove the deleted log from the live feed immediately
        setLogs((prev) => prev.filter((l) => l.$id !== payload.$id));
        setStats((prev) => ({
          ...prev,
          presentToday: Math.max(0, prev.presentToday - 1),
          totalLogs: Math.max(0, prev.totalLogs - 1),
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    {
      icon: <Users size={22} />,
      label: 'Enrolled Students',
      value: isLoading ? '—' : stats.totalStudents,
      color: 'blue',
    },
    {
      icon: <UserCheck size={22} />,
      label: 'Present Today',
      value: isLoading ? '—' : stats.presentToday,
      color: 'green',
    },
    {
      icon: <TrendingUp size={22} />,
      label: 'Total Scans Logged',
      value: isLoading ? '—' : stats.totalLogs,
      color: 'purple',
    },
    {
      icon: <Activity size={22} />,
      label: 'System Status',
      value: 'Online',
      color: 'green',
      pulse: true,
    },
  ];

  return (
    <div className={styles.dashboardContainer}>

      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Dashboard</h1>
          <p className={styles.subtitle}>Real-time biometric attendance monitoring</p>
        </div>
        <div className={styles.liveChip}>
          <span className={styles.liveDot}></span>
          Live Feed Active
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((card, i) => (
          <div key={i} className={`${styles.statCard} ${styles[`color_${card.color}`]}`}>
            <div className={styles.statIconWrapper}>
              {card.icon}
              {card.pulse && <span className={styles.pulseRing}></span>}
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Attendance Feed</h2>
            <p className={styles.tableSubtitle}>Showing latest {logs.length} records</p>
          </div>
          <div className={styles.pulseIndicator}>
            <div className={styles.pulseDot}></div>
            Synced
          </div>
        </div>

        {isLoading ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Match Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className={styles.emptyState}>
                      <Clock size={32} strokeWidth={1} />
                      <p>No scans recorded yet. The feed will update in real-time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const isNew = newLogIds.has(log.$id);
                  const d = new Date(log.timestamp);
                  const status = getAttendanceStatus(log.timestamp);
                  return (
                    <tr
                      key={log.$id || index}
                      className={`${styles.row} ${isNew ? styles.rowNew : ''}`}
                    >
                      <td>
                        <span className={styles.studentIdBadge}>{log.studentId}</span>
                      </td>
                      <td>
                        <span className={styles.nameCell}>{log.name}</span>
                      </td>
                      <td className={styles.mutedCell}>
                        {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={styles.timeCell}>
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={styles.confidenceBadge}>
                          {Math.round(log.confidence * 100)}% Match
                        </span>
                      </td>
                      <td>
                        <span className={status === 'Late Entry' ? styles.lateBadge : styles.presentBadge}>
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
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Database } from 'lucide-react';
import { checkAppwriteHealth } from '../../services/appwrite';
import styles from './SystemCheck.module.css';

const SystemCheck = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    const data = await checkAppwriteHealth();
    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Activity className={styles.icon} size={32} />
        <div>
          <h1 className={styles.title}>System Connection Diagnostic</h1>
          <p className={styles.subtitle}>Verifying Appwrite Project & Database integrity</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database size={20} />
            <h2>Appwrite Health Report</h2>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Pinging Appwrite API...</span>
            </div>
          ) : results ? (
            <div className={styles.resultsGrid}>
              
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Students Collection</div>
                <div className={`${styles.statusBadge} ${results.students.status === 'connected' ? styles.success : styles.error}`}>
                  {results.students.status === 'connected' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                  {results.students.status.toUpperCase()}
                </div>
                {results.students.error && (
                   <div className={styles.errorMessage}>{results.students.error}</div>
                )}
              </div>

              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Attendance Logs Collection</div>
                <div className={`${styles.statusBadge} ${results.logs.status === 'connected' ? styles.success : styles.error}`}>
                  {results.logs.status === 'connected' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                  {results.logs.status.toUpperCase()}
                </div>
                {results.logs.error && (
                   <div className={styles.errorMessage}>{results.logs.error}</div>
                )}
              </div>

              <div className={styles.divider}></div>

              <div className={styles.configHeader}>Environment Configuration Check</div>
              <div className={styles.configPreview}>
                <div className={styles.configRow}>
                  <span className={styles.configKey}>Endpoint:</span>
                  <span className={styles.configVal}>{results.config.endpoint}</span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configKey}>Project ID:</span>
                  <span className={styles.configVal}>{results.config.projectId}</span>
                </div>
                <div className={styles.configRow}>
                   <span className={styles.configKey}>Database ID:</span>
                   <span className={styles.configVal}>{results.config.databaseId}</span>
                </div>
              </div>

              <button className={styles.retryBtn} onClick={runCheck}>
                Re-Run Diagnostic
              </button>

            </div>
          ) : null}
        </div>

        <div className={styles.instructions}>
          <h3>💡 Troubleshooting Guide</h3>
          <ul>
            {(results?.students.error?.includes('fetch') || results?.logs.error?.includes('fetch')) && (
              <li className={styles.corsAlert}>
                <strong>🔴 CORS ISSUE DETECTED</strong>: "Failed to fetch" means your browser is blocking the request. Have you added <code>Adbhut1234.github.io</code> as a <strong>Web Platform</strong> in your Appwrite Project settings?
              </li>
            )}
            <li><strong>401 Unauthorized</strong>: Check if Collection Permissions allow "Any" role to "Create/Read".</li>
            <li><strong>404 Not Found</strong>: Verify the Database or Collection IDs in your .env match exactly.</li>
            <li><strong>Attribute Error</strong>: Ensure your Appwrite attributes are spelled exactly like the code.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemCheck;

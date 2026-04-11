import React, { useState } from 'react';
import { Clock, Save, CheckCircle2, Info } from 'lucide-react';
import styles from './Settings.module.css';

const STORAGE_KEY = 'smartattend_cutoff_time';

const Settings = () => {
  const [cutoffTime, setCutoffTime] = useState(
    () => localStorage.getItem(STORAGE_KEY) || '09:00'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, cutoffTime);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Preview logic
  const [hour, minute] = cutoffTime.split(':').map(Number);
  const displayCutoff = new Date();
  displayCutoff.setHours(hour, minute, 0, 0);
  const cutoffLabel = displayCutoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Attendance Settings</h1>
        <p className={styles.subtitle}>Configure daily attendance rules and cutoff windows</p>
      </div>

      {/* Cutoff Time Card */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrapper}>
            <Clock size={20} />
          </div>
          <div>
            <h2 className={styles.cardTitle}>Attendance Cutoff Time</h2>
            <p className={styles.cardDesc}>
              Students who scan <strong>before</strong> this time are marked{' '}
              <span className={styles.presentTag}>Present</span>. Scans{' '}
              <strong>after</strong> are marked{' '}
              <span className={styles.lateTag}>Late Entry</span>.
            </p>
          </div>
        </div>

        <div className={styles.timePickerRow}>
          <label className={styles.timeLabel}>Cutoff Time</label>
          <input
            type="time"
            className={styles.timeInput}
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
          />
        </div>

        {/* Preview */}
        <div className={styles.previewBox}>
          <Info size={14} className={styles.infoIcon} />
          <p>
            Scans before <strong>{cutoffLabel}</strong> → <span className={styles.presentTag}>Present</span>
            &nbsp;·&nbsp; Scans at or after <strong>{cutoffLabel}</strong> → <span className={styles.lateTag}>Late Entry</span>
          </p>
        </div>

        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
          onClick={handleSave}
        >
          {saved ? (
            <><CheckCircle2 size={17} /> Saved Successfully</>
          ) : (
            <><Save size={17} /> Save Settings</>
          )}
        </button>
      </div>

      {/* Info card */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>How it works</h3>
        <ul className={styles.infoList}>
          <li>The cutoff time is applied every day automatically.</li>
          <li>The 12-hour cooldown still applies — one log per student per 12 hrs.</li>
          <li>Status is stored with each attendance record and visible in the Dashboard and Student Portal.</li>
          <li>Changing the cutoff only affects future scans, not past records.</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;

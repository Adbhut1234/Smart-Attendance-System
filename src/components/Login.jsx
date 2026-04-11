import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, ArrowLeft, Eye, EyeOff, ScanFace } from 'lucide-react';
import { authenticateStudent } from '../services/appwrite';
import styles from './Login.module.css';

const Login = ({ role }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isStudent = role === 'student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setError('');
    setIsProcessing(true);

    try {
      if (isStudent) {
        const studentObj = await authenticateStudent(identifier, password);
        if (studentObj) {
          navigate('/view-logs', { state: { student: studentObj } });
        } else {
          setError('Username or password is incorrect.');
        }
      } else {
        if (identifier === 'admin' && password === 'admin@123') {
          navigate('/admin/dashboard');
        } else {
          setError('Invalid admin credentials.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`${styles.loginContainer} ${isStudent ? styles.modeStudent : styles.modeAdmin}`}>

      {/* Ambient orb */}
      <div className={styles.orb}></div>

      {/* Back link */}
      <Link to="/" className={styles.backBtn}>
        <ArrowLeft size={15} />
        Home
      </Link>

      <div className={styles.loginCard}>

        {/* Top brand chip */}
        <div className={styles.chipRow}>
          <ScanFace size={14} className={styles.chipIcon} strokeWidth={1.5} />
          <span>SmartAttend</span>
        </div>

        {/* Icon badge */}
        <div className={`${styles.iconBadge} ${isStudent ? styles.badgeBlue : styles.badgeRed}`}>
          {isStudent
            ? <User size={26} strokeWidth={1.5} />
            : <Shield size={26} strokeWidth={1.5} />}
        </div>

        <h1 className={styles.title}>
          {isStudent ? 'Student Portal' : 'Admin Portal'}
        </h1>
        <p className={styles.subtitle}>
          {isStudent
            ? 'Sign in to view your attendance records'
            : 'Restricted access — authorized personnel only'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Identifier field */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              {isStudent ? 'Username' : 'Admin ID'}
            </label>
            <input
              type="text"
              className={`${styles.input} ${isStudent ? styles.inputBlue : styles.inputRed}`}
              placeholder={isStudent ? 'Enter your username' : 'Enter admin ID'}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
              required
              disabled={isProcessing}
              autoComplete="username"
            />
          </div>

          {/* Password field with show/hide */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.passwordInput} ${isStudent ? styles.inputBlue : styles.inputRed}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                disabled={isProcessing}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div className={styles.errorBanner}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`${styles.submitBtn} ${isStudent ? styles.btnBlue : styles.btnRed}`}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><span className={styles.btnSpinner}></span> Authenticating...</>
            ) : (
              isStudent ? 'Sign In' : 'Access Portal'
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;

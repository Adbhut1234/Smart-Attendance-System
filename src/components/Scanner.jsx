import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ScanFace, Clock } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import styles from './Scanner.module.css';
import { verifyFace, logAttendance } from '../services/appwrite';

const Scanner = () => {
  const webcamRef = useRef(null);
  const unknownCounterRef = useRef(0);
  const isDetectingRef = useRef(false); // lock to prevent concurrent detection calls

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');

  // Status: 'idle', 'scanning', 'granted', 'cooldown', 'rejected'
  const [scanStatus, setScanStatus] = useState('idle');
  const [matchedName, setMatchedName] = useState(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = import.meta.env.BASE_URL + 'models';

        setLoadingStage('Loading face detector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setLoadingProgress(25);

        setLoadingStage('Loading landmark model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setLoadingProgress(50);

        setLoadingStage('Loading recognition model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setLoadingProgress(100);
        setLoadingStage('Ready');

        setIsModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face-api models:', error);
      }
    };
    loadModels();
  }, []);

  const triggerAccessGranted = useCallback(async (student) => {
    setScanStatus('granted');
    setMatchedName(student.name);

    try {
      await logAttendance(student.name, student.studentId);
    } catch (err) {
      if (err.code === 'COOLDOWN') {
        setScanStatus('cooldown');
        setMatchedName(student.name);
      } else {
        console.error('Failed to log attendance entry:', err);
        setScanStatus('idle');
        return;
      }
    }

    setTimeout(() => {
      setScanStatus('idle');
      setMatchedName(null);
    }, 4500);
  }, []);

  const triggerAccessRejected = useCallback(() => {
    setScanStatus('rejected');
    setTimeout(() => {
      setScanStatus('idle');
    }, 3500);
  }, []);

  const handleScan = useCallback(async () => {
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      isDetectingRef.current ||
      scanStatus === 'granted' ||
      scanStatus === 'cooldown' ||
      scanStatus === 'rejected'
    ) return;

    const video = webcamRef.current.video;

    if (video.readyState === 4 && isModelsLoaded) {
      isDetectingRef.current = true;
      try {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,      // was 512 — 5x fewer pixels to process
          scoreThreshold: 0.4, // pick up faces faster
        });

        // detectSingleFace is faster — we only ever need one person
        const detection = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setScanStatus((prev) => (prev === 'idle' ? 'scanning' : prev));

          const liveDescriptor = detection.descriptor;
          const studentObj = await verifyFace(liveDescriptor);

          if (studentObj) {
            unknownCounterRef.current = 0;
            triggerAccessGranted(studentObj);
          } else {
            unknownCounterRef.current += 1;
            if (unknownCounterRef.current >= 4) {
              unknownCounterRef.current = 0;
              triggerAccessRejected();
            }
          }
        } else {
          unknownCounterRef.current = 0;
          setScanStatus('idle');
        }
      } catch (error) {
        console.error('Detection error loop: ', error);
      } finally {
        isDetectingRef.current = false;
      }
    }
  }, [isModelsLoaded, scanStatus, triggerAccessGranted, triggerAccessRejected]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        isModelsLoaded &&
        scanStatus !== 'granted' &&
        scanStatus !== 'cooldown' &&
        scanStatus !== 'rejected'
      ) {
        handleScan();
      }
    }, 150); // 150ms — safe now that each call is much cheaper
    return () => clearInterval(interval);
  }, [isModelsLoaded, scanStatus, handleScan]);

  // -- Helpers --
  const isTerminal = ['granted', 'cooldown', 'rejected'].includes(scanStatus);

  const statusMeta = {
    idle: { label: 'Position your face in the frame', dot: 'idle' },
    scanning: { label: 'Recognising...', dot: 'scanning' },
    granted: { label: 'Attendance Marked', dot: 'granted' },
    cooldown: { label: 'Already Marked Today', dot: 'granted' },
    rejected: { label: 'User Not Enrolled', dot: 'rejected' },
  };

  const current = statusMeta[scanStatus] || statusMeta.idle;

  return (
    <div className={styles.scannerContainer}>

      {/* Ambient orb */}
      <div className={styles.ambientOrb}></div>

      {/* Back button */}
      <Link to="/" className={styles.backBtn}>
        <ArrowLeft size={16} />
        Home
      </Link>

      {/* Loading overlay */}
      {!isModelsLoaded && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <ScanFace size={40} className={styles.loadingIcon} strokeWidth={1.5} />
            <p className={styles.loadingStage}>{loadingStage}</p>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${loadingProgress}%` }}></div>
            </div>
            <span className={styles.progressPct}>{loadingProgress}%</span>
          </div>
        </div>
      )}

      {/* Main Kiosk Card */}
      <div className={styles.kioskCard}>

        {/* Card top label */}
        <div className={styles.kioskHeader}>
          <ScanFace size={18} strokeWidth={1.5} className={styles.headerIcon} />
          <span>Face Recognition Attendance</span>
        </div>

        {/* Camera / Result viewport */}
        <div className={`${styles.videoWrapper} ${styles[`border_${current.dot}`]}`}>

          {isTerminal ? (
            <div className={scanStatus === 'rejected' ? styles.rejectedScreen : styles.successScreen}>
              {scanStatus === 'rejected' ? (
                <XCircle size={72} className={styles.rejectedIcon} strokeWidth={1.5} />
              ) : (
                <CheckCircle2 size={72} className={styles.successIcon} strokeWidth={1.5} />
              )}

              <h3 className={scanStatus === 'rejected' ? styles.rejectedTitle : styles.successTitle}>
                {scanStatus === 'rejected' ? 'User Not Enrolled' : 'Attendance Marked'}
              </h3>

              <p className={styles.resultSubtext}>
                {scanStatus === 'rejected'
                  ? 'Please contact the admin to enroll your face.'
                  : scanStatus === 'cooldown'
                    ? `12-hour cooldown active for ${matchedName}.`
                    : `Logged for ${matchedName}.`}
              </p>
            </div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                className={styles.webcam}
                videoConstraints={{ aspectRatio: 1, facingMode: 'user' }}
              />
              {/* Corner scan brackets */}
              <div className={`${styles.cornerBracket} ${styles.tl}`}></div>
              <div className={`${styles.cornerBracket} ${styles.tr}`}></div>
              <div className={`${styles.cornerBracket} ${styles.bl}`}></div>
              <div className={`${styles.cornerBracket} ${styles.br}`}></div>
              {/* Scanning sweep line */}
              {scanStatus === 'scanning' && <div className={styles.scanLine}></div>}
            </>
          )}
        </div>

        {/* Status row */}
        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${styles[`dot_${current.dot}`]}`}></span>
          <span className={`${styles.statusText} ${styles[`text_${current.dot}`]}`}>
            {current.label}
          </span>
        </div>

        {/* Time display */}
        <div className={styles.clockRow}>
          <Clock size={13} strokeWidth={1.5} />
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

      </div>
    </div>
  );
};

export default Scanner;

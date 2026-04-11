import React, { useRef, useState, useEffect } from 'react';
// import Webcam from 'react-webcam'; // Removed as per request
import * as faceapi from 'face-api.js';
import { CheckCircle2, UploadCloud } from 'lucide-react';
import { registerStudent } from '../../services/appwrite';
import styles from './Register.module.css';

const Register = () => {
  // const webcamRef = useRef(null); // Removed
  const hiddenImageRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [uploadMode, setUploadMode] = useState(true); // Defaulted to true
  const [selectedImage, setSelectedImage] = useState(null);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsError(null);
        // Robust directory resolution for different environments
        const baseUrl = import.meta.env.BASE_URL || '/';
        const MODEL_URL = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;
        
        console.log("Loading models from:", MODEL_URL);
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setIsModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load models for Register:", error);
        setModelsError("Failed to fetch AI models. Check your internet or base path.");
      }
    };
    loadModels();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    if (uploadMode && !selectedImage) {
      alert("Please upload a facial image first!");
      return;
    }

    if (!uploadMode && (!webcamRef.current || !webcamRef.current.video)) return;

    setIsProcessing(true);
    setIsSuccess(false);

    try {
      const sourceElement = hiddenImageRef.current;
      
      const detections = await faceapi.detectSingleFace(sourceElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        alert("No face detected! Please ensure the facial features are clear.");
        setIsProcessing(false);
        return;
      }

      // Convert Float32Array to native JS Array to stringify securely 
      const descriptorArray = Array.from(detections.descriptor);
      const embeddingStr = JSON.stringify(descriptorArray);

      await registerStudent({
        name,
        studentId,
        username,
        password,
        faceEmbedding: embeddingStr
      });

      // Clear the Form mapping to success UI standard
      setIsProcessing(false);
      setIsSuccess(true);
      setName('');
      setStudentId('');
      setUsername('');
      setPassword('');
      setSelectedImage(null);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Appwrite Registration Error:", error);
      // Reveal the specific Appwrite error message for easier debugging
      alert(`Enrollment Failed: ${error.message}\n\nPlease check your Appwrite collection permissions and ensure 'faceEmbedding' size is at least 4096.`);
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <h2 className={styles.cardHeader}>Register Master Identity</h2>

        {/* Mode Toggle Removed */}

        <div className={styles.cameraWrapper}>
          {modelsError ? (
            <div className={styles.modelsError}>
              <p>{modelsError}</p>
              <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                Retry Loading
              </button>
            </div>
          ) : !isModelsLoaded && (
             <div className={styles.modelsLoading}>
               <div className={styles.pulseDot}></div>
               Loading AI Models...
             </div>
          )}
          
          {uploadMode ? (
            <div 
              className={styles.uploadZone} 
              onClick={() => fileInputRef.current.click()}
            >
              {selectedImage ? (
                <img 
                  ref={hiddenImageRef} 
                  src={selectedImage} 
                  alt="Preview" 
                  className={styles.previewImage} 
                />
              ) : (
                <>
                  <UploadCloud size={48} strokeWidth={1.5} />
                  <span>Click to select an image (.jpg, .png)</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className={styles.hiddenInput} 
              />
            </div>
          ) : (
            <div className={styles.webcamDisabled}>
              Camera registration disabled. Use Image Upload.
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          
          <div className={styles.authGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Roll / Student ID</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="e.g. STU-1029"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className={styles.authGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Gateway Username</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Student login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Gateway Password</label>
              <input 
                type="password" 
                className={styles.input} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`${styles.submitBtn} ${isSuccess ? styles.success : ''}`}
            disabled={!isModelsLoaded || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className={styles.spinner}></div>
                Processing Enrolment...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={20} />
                Successfully Enrolled
              </>
            ) : (
              uploadMode ? 'Scan Image & Register' : 'Capture & Register'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;

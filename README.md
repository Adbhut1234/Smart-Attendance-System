# 🛡️ Smart Attendance System

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Appwrite](https://img.shields.io/badge/Appwrite-FD366E?style=for-the-badge&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)

A premium, biometric attendance solution leveraging AI-driven facial recognition and a secure cloud backend. Designed for modern institutions, this system provides a seamless, "look-and-log" experience with an elegant glassmorphic interface.

## 🚀 Tech Stack

- **Frontend**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend-as-a-Service**: [Appwrite](https://appwrite.io/) (Database, Storage, Real-time)
- **AI/ML Engine**: [Face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) (TensorFlow.js based)
- **Styling**: Vanilla CSS with Glassmorphic Principles
- **Icons**: [Lucide React](https://lucide.dev/)

## ✨ Key Features

- **🎭 Dual-Portal System**: 
  - **Kiosk Mode**: Ultra-fast facial scanning interface for students.
  - **Admin Dashboard**: Comprehensive management of student records, logs, and system settings.
- **🕒 Real-time Logs**: Live attendance updates powered by Appwrite Realtime.
- **💎 Glassmorphic UI**: A state-of-the-art, semi-transparent aesthetic with vibrant gradients and smooth animations.
- **🧊 12-Hour Cooldown**: Intelligent logic to prevent duplicate attendance within the same day.
- **📱 Responsive Design**: Fully optimized for both desktop monitors and tablet kiosks.

## 🧠 How It Works

The system utilizes advanced computer vision to ensure high accuracy and security:

1.  **Face Detection**: The `tinyFaceDetector` model locates faces in the live camera stream with high performance.
2.  **Landmark Extraction**: `faceLandmark68Net` identifies key facial features to align the face, ensuring consistency regardless of head tilt.
3.  **Face Embedding**: The `faceRecognitionNet` (ResNet-34) transforms facial features into a **128-dimensional floating-point vector** (the "Face Signature").
4.  **Secure Matching**: 
    - At runtime, the live embedding is compared against the database of registered signatures.
    - We use a **Euclidean Distance** threshold (default: 0.45) to determine identity.
    - Comparisons are performed locally using a cached `FaceMatcher` to ensure sub-second verification.
5.  **Blockchain-like Integrity**: Attendance logs are immutable once verified, stored securely in Appwrite.

## 🛠️ Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Step-by-Step Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Adbhut1234/Smart-Attendance-System.git
   cd Smart-Attendance-System
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   VITE_APPWRITE_STUDENTS_COLLECTION_ID=students
   VITE_APPWRITE_ATTENDANCE_LOGS_COLLECTION_ID=attendance_logs
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 📜 License
This project is for educational purposes at SRMU.

---
*Developed with ❤️ by Adi Pandey*

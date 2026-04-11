import React, { useEffect, useState } from 'react';
import { Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getRegisteredStudents, deleteStudent } from '../../services/appwrite';
import styles from './StudentList.module.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    docId: null,
    logicalId: null,
    name: null,
    status: 'confirm' // 'confirm', 'processing', 'success'
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getRegisteredStudents();
        setStudents(data || []);
      } catch (error) {
        console.error("Failed to fetch students roster.", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const initiateDelete = (documentId, stringId, name) => {
    setDeletePopup({
      isOpen: true,
      docId: documentId,
      logicalId: stringId,
      name: name,
      status: 'confirm'
    });
  };

  const handleConfirmDelete = async () => {
    setDeletePopup(prev => ({ ...prev, status: 'processing' }));

    try {
      await deleteStudent(deletePopup.docId, deletePopup.logicalId);

      setDeletePopup(prev => ({ ...prev, status: 'success' }));

      setTimeout(() => {
        setStudents(prev => prev.filter(student => student.$id !== deletePopup.docId));
        setDeletePopup({ isOpen: false, docId: null, logicalId: null, name: null, status: 'confirm' });
      }, 2500);

    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Failed to delete the user. Please check your Appwrite permissions.");
      setDeletePopup({ isOpen: false, docId: null, logicalId: null, name: null, status: 'confirm' });
    }
  };

  return (
    <div className={styles.container}>

      {/* Custom Delete Modal Overlay */}
      {deletePopup.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>

            {deletePopup.status === 'success' ? (
              <div className={styles.successScreen}>
                <CheckCircle2 size={64} className={styles.successIcon} strokeWidth={1.5} />
                <h3 className={styles.modalTitle}>Successfully Erased</h3>
                <p className={styles.modalText}>
                  {deletePopup.name} has been completely removed from the database.
                </p>
              </div>
            ) : (
              <div className={styles.confirmScreen}>
                <div className={styles.warningIconWrapper}>
                  <AlertTriangle size={48} className={styles.warningIcon} strokeWidth={1.5} />
                </div>
                <h3 className={styles.modalTitle}>Confirm Deletion</h3>
                <p className={styles.modalText}>
                  Are you sure you want to permanently delete <strong>{deletePopup.name}</strong>? This will erase their facial biometric descriptor and database slot. This cannot be undone.
                </p>

                <div className={styles.modalActions}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => setDeletePopup({ isOpen: false, docId: null, logicalId: null, name: null, status: 'confirm' })}
                    disabled={deletePopup.status === 'processing'}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmDeleteBtn}
                    onClick={handleConfirmDelete}
                    disabled={deletePopup.status === 'processing'}
                  >
                    {deletePopup.status === 'processing' ? 'Processing...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Student Register</h1>
        <p className={styles.subtitle}>Enrolled Master Identities mapped in the Database</p>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Biometric Status</th>
                  <th>Internal DB Slot</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className={styles.emptyState}>No students enrolled in the database yet.</div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.$id} className={styles.row}>
                      <td data-label="Student ID">
                        <strong>{student.studentId}</strong>
                      </td>
                      <td data-label="Full Name">{student.name}</td>
                      <td data-label="Biometric Status">
                        <span className={styles.enrollmentBadge}>
                          Descriptor Bound
                        </span>
                      </td>
                      <td data-label="Internal DB Slot" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {student.$id}
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => initiateDelete(student.$id, student.studentId, student.name)}
                          title="Remove Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;

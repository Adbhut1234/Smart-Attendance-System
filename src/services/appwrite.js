import { Client, Databases, Storage, ID, Query } from 'appwrite';
import * as faceapi from 'face-api.js';

const appwriteConfig = {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID',
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID',
    studentsCollectionId: import.meta.env.VITE_APPWRITE_STUDENTS_COLLECTION_ID || 'YOUR_STUDENTS_COLLECTION_ID',
    attendanceLogsCollectionId: import.meta.env.VITE_APPWRITE_ATTENDANCE_LOGS_COLLECTION_ID || 'YOUR_ATTENDANCE_LOGS_COLLECTION_ID',
};

const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const databases = new Databases(client);
export const storage = new Storage(client);

let cachedFaceMatcher = null;
let cachedStudentsList = [];

/**
 * Compare live face embedding against the Appwrite students document DB securely.
 * Caches the FaceMatcher object upon first call to prevent severe DB rate-limiting.
 * @param {Float32Array} liveEmbedding 
 */
export async function verifyFace(liveEmbedding) {
    if (!cachedFaceMatcher) {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.studentsCollectionId,
                [Query.limit(500)]
            );

            if (response.documents.length === 0) return null;
            
            cachedStudentsList = response.documents;

            const labeledDescriptors = response.documents.map(doc => {
                // Ensure array parsing resolves properly from Appwrite constraints
                const arr = typeof doc.faceEmbedding === 'string' 
                    ? JSON.parse(doc.faceEmbedding) 
                    : doc.faceEmbedding;
                
                const floatDescriptor = new Float32Array(Object.values(arr));
                // Tagging identity securely via document ID reference
                return new faceapi.LabeledFaceDescriptors(doc.$id, [floatDescriptor]);
            });

            cachedFaceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
        } catch (error) {
            console.error("Failed to build verification cache:", error);
            return null;
        }
    }

    if (!cachedFaceMatcher) return null;

    const match = cachedFaceMatcher.findBestMatch(liveEmbedding);
    if (match.label !== 'unknown') {
        const studentObj = cachedStudentsList.find(s => s.$id === match.label);
        return studentObj || null;
    }
    
    return null;
}

/**
 * Register a new student
 * @param {Object} studentInfo { name, studentId, faceEmbedding, username, password }
 */
export async function registerStudent(studentInfo) {
    try {
        const response = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.studentsCollectionId,
            ID.unique(),
            {
                name: studentInfo.name,
                studentId: studentInfo.studentId,
                faceEmbedding: studentInfo.faceEmbedding,
                username: studentInfo.username,
                password: studentInfo.password,
            }
        );
        // Invalidate facial schema cache so next scan is forced to rebuild from updated DB
        cachedFaceMatcher = null;
        cachedStudentsList = [];
        return response;
    } catch (error) {
        console.error("Error registering student:", error);
        throw error;
    }
}

/**
 * Create a new document in the attendance_logs table
 * Strict 12-hour cooldown check validation included.
 * @param {String} studentName
 * @param {String} studentId
 */
export async function logAttendance(studentName, studentId) {
    try {
        // Enforce 12-hour Cooldown
        const latestLogResponse = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.attendanceLogsCollectionId,
            [
                Query.equal('studentId', studentId),
                Query.orderDesc('timestamp'),
                Query.limit(1)
            ]
        );

        if (latestLogResponse.documents.length > 0) {
            const lastLogTime = new Date(latestLogResponse.documents[0].timestamp).getTime();
            const now = new Date().getTime();
            const hoursPassed = (now - lastLogTime) / (1000 * 60 * 60);

            if (hoursPassed < 12) {
                const error = new Error("Cooldown active");
                error.code = "COOLDOWN";
                throw error;
            }
        }

        // Determine Present / Late Entry based on admin-configured cutoff
        const cutoff = localStorage.getItem('smartattend_cutoff_time') || '09:00';
        const [cutHour, cutMin] = cutoff.split(':').map(Number);
        const now2 = new Date();
        const cutoffMs = cutHour * 60 + cutMin;
        const nowMs = now2.getHours() * 60 + now2.getMinutes();
        const attendanceStatus = nowMs < cutoffMs ? 'Present' : 'Late Entry';

        // Build payload — try with status first, fall back without if attribute missing
        const docPayload = {
            name: studentName,
            studentId: studentId,
            timestamp: new Date().toISOString(),
            confidence: 1.0,
        };

        try {
            docPayload.status = attendanceStatus;
            const response = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.attendanceLogsCollectionId,
                ID.unique(),
                docPayload
            );
            return response;
        } catch (statusErr) {
            // If it failed due to unknown attribute, retry without status field
            if (statusErr?.message?.includes('Unknown attribute')) {
                delete docPayload.status;
                const response = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.attendanceLogsCollectionId,
                    ID.unique(),
                    docPayload
                );
                return response;
            }
            throw statusErr;
        }
    } catch (error) {
        console.error("Error logging attendance:", error);
        throw error;
    }
}

/**
 * Fetch logs filtered by a specific ID (for Student Portal)
 * @param {String} studentId 
 */
export async function getStudentLogs(studentId) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.attendanceLogsCollectionId,
            [
                Query.equal('studentId', studentId),
                Query.orderDesc('timestamp'),
                Query.limit(100)
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Error fetching specific student logs:", error);
        throw error;
    }
}

/**
 * Fetch initial live logs for the dashboard
 */
export async function fetchLiveLogs() {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.attendanceLogsCollectionId,
            [
                Query.orderDesc('timestamp'),
                Query.limit(50)
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Error fetching live logs:", error);
        throw error;
    }
}

/**
 * Real-time listener for attendance logs
 * Fires callback with { type: 'create'|'delete', payload }
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAttendance(callback) {
    const unsubscribe = client.subscribe(
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.attendanceLogsCollectionId}.documents`,
        response => {
            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                callback({ type: 'create', payload: response.payload });
            } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                callback({ type: 'delete', payload: response.payload });
            }
        }
    );
    return unsubscribe;
}

/**
 * Fetch all registered master identities for the Admin Students roster
 */
export async function getRegisteredStudents() {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.studentsCollectionId,
            [
                Query.limit(500)
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Error fetching registered students:", error);
        throw error;
    }
}

/**
 * Remove a master identity from the database completely and all associated attendance logs.
 * @param {String} documentId
 * @param {String} logicalStudentId
 */
export async function deleteStudent(documentId, logicalStudentId) {
    try {
        // 1. Fetch and erase all associated Attendance Logs matching studentId
        if (logicalStudentId) {
            const logsResponse = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.attendanceLogsCollectionId,
                [
                    Query.equal('studentId', logicalStudentId),
                    Query.limit(500)
                ]
            );

            if (logsResponse.documents.length > 0) {
                // Execute parallel deletions for performance
                await Promise.all(
                    logsResponse.documents.map(log => 
                        databases.deleteDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.attendanceLogsCollectionId,
                            log.$id
                        )
                    )
                );
            }
        }

        // 2. Erase the core master identity from the Students collection
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.studentsCollectionId,
            documentId
        );
        
        // Invalidate facial schema cache so next scan avoids 'ghost' recognitions
        cachedFaceMatcher = null;
        cachedStudentsList = [];
    } catch (error) {
        console.error("Error removing student and associated logs:", error);
        throw error;
    }
}

/**
 * Authenticate student via their mapped Database Schema
 * @param {String} username 
 * @param {String} password 
 */
export async function authenticateStudent(username, password) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.studentsCollectionId,
            [
                Query.equal('username', username),
                Query.equal('password', password),
                Query.limit(1)
            ]
        );
        
        if (response.documents.length === 1) {
            return response.documents[0]; // Returns mapped student document
        }
        return null; // Auth Failed
    } catch (error) {
        console.error("Authentication Error:", error);
        throw error;
    }
}

export default client;

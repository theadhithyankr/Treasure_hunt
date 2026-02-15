import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCREt1hA4eZA02H87kKWO3tdMHxf46sQ50",
    authDomain: "one-piece-b5d33.firebaseapp.com",
    projectId: "one-piece-b5d33",
    storageBucket: "one-piece-b5d33.firebasestorage.app",
    messagingSenderId: "483888352023",
    appId: "1:483888352023:web:efdb4f08244fa65d354552",
    measurementId: "G-EB0T6687H2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;

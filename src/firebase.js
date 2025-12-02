// src/firebase.js - STANDARD (Online Only) + MESSAGING

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging"; // 👈 NEW IMPORT

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC52DWCtaBNL35wR8JUClNAi6aOayC9jAc",
  authDomain: "sharecare-app.firebaseapp.com",
  projectId: "sharecare-app",
  storageBucket: "sharecare-app.firebasestorage.app",
  messagingSenderId: "477163564260",
  appId: "1:477163564260:web:03686df8b876aaad4ed0f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app); // 👈 NEW EXPORT
// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize and export services for use throughout the app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Note: We don't need to export 'app' itself, just the services.
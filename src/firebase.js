import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions"; // 👈 New Import

const firebaseConfig = {
  apiKey: "AIzaSyC52DWCtaBNL35wR8JUClNAi6aOayC9jAc",
  authDomain: "sharecare-app.firebaseapp.com",
  projectId: "sharecare-app",
  storageBucket: "sharecare-app.firebasestorage.app",
  messagingSenderId: "477163564260",
  appId: "1:477163564260:web:03686df8b876aaad4ed0f1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app); // 👈 New Export
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC52DWCtaBNL35wR8JUClNAi6aOayC9jAc",
  authDomain: "sharecare-app.firebaseapp.com",
  projectId: "sharecare-app",
  storageBucket: "sharecare-app.firebasestorage.app",
  messagingSenderId: "477163564260",
  appId: "1:477163564260:web:03686df8b876aaad4ed0f1"
});

const messaging = firebase.messaging();

// REMOVED: messaging.onBackgroundMessage(...) 
// Reason: The SDK handles "notification" payloads automatically. 
// Adding a listener here caused the double notification.
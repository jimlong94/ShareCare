// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 1. Initialize Firebase in the Service Worker
// (Yes, you need to paste the config here again because SW runs in a separate thread)
firebase.initializeApp({
  apiKey: "AIzaSyC52DWCtaBNL35wR8JUClNAi6aOayC9jAc",
  authDomain: "sharecare-app.firebaseapp.com",
  projectId: "sharecare-app",
  storageBucket: "sharecare-app.firebasestorage.app",
  messagingSenderId: "477163564260",
  appId: "1:477163564260:web:03686df8b876aaad4ed0f1"
});

// 2. Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// 3. Background Handler (Optional debugging)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here if needed
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png' // Ensure this path matches your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
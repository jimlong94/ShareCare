// src/hooks/useFcmToken.js - FIXED
import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '../firebase';
import { useAuth } from '../AuthContext';

// ⚠️ REPLACE THIS WITH YOUR GENERATED KEY PAIR FROM FIREBASE CONSOLE
const VAPID_KEY = "BErIFYhGyXjRX2YBCjRXF2xV84c9x0x2djrYTQh5yDgBMad7KPYsxLtcLvEElo2NBGH4WT2DWBfQQxWHpNkik7g"; 

const useFcmToken = () => {
  const { currentUser } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          
          // 1. Request Permission
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);

          if (permission === 'granted' && currentUser) {
            
            // ----------------------------------------------------
            // FIX: Explicitly register the Service Worker first
            // ----------------------------------------------------
            const registration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js'
            );
            
            // Wait for the service worker to be active
            // This prevents the "no active Service Worker" error
            await navigator.serviceWorker.ready;

            // 2. Get the Token (passing the registration explicitly)
            const currentToken = await getToken(messaging, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration
            });

            if (currentToken) {
              // 3. Save Token to Firestore (Check if exists first to save writes)
              const userRef = doc(db, 'users', currentUser.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const existingTokens = userSnap.data().fcmTokens || [];
                if (!existingTokens.includes(currentToken)) {
                   await updateDoc(userRef, {
                      fcmTokens: arrayUnion(currentToken)
                   });
                   console.log('FCM Token synced to Firestore.');
                } else {
                   console.log('FCM Token already exists in Firestore.');
                }
              }
            } else {
              console.log('No registration token available.');
            }
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    retrieveToken();
  }, [currentUser]);

  // Foreground Message Listener
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground Message received: ', payload);
      // Optional: Add a UI toast here later
    });
    return () => unsubscribe();
  }, []);

  return { notificationPermission };
};

export default useFcmToken;
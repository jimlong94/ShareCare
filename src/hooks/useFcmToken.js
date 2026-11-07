import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions'; // 👈 New Import
import { messaging, db, functions } from '../firebase'; // 👈 Import functions
import { useAuth } from '../AuthContext';
import { LOCAL_DEMO } from '../localDemo';

const VAPID_KEY = "BErIFYhGyXjRX2YBCjRXF2xV84c9x0x2djrYTQh5yDgBMad7KPYsxLtcLvEElo2NBGH4WT2DWBfQQxWHpNkik7g"; 

const useFcmToken = () => {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (LOCAL_DEMO) return;
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted' && currentUser) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
          });

          if (currentToken) {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
               fcmTokens: arrayUnion(currentToken)
            });
            console.log('Token registered.');
          }
        }
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  // 👇 NEW: Test Function
  const sendTest = async () => {
    if (LOCAL_DEMO) {
      alert('Notifications are off in local demo mode.');
      return;
    }
    const sendTestNotification = httpsCallable(functions, 'sendTestNotification');
    try {
        const result = await sendTestNotification();
        if (result.data.success) {
            alert(`Signal Sent! (Success: ${result.data.sentCount}, Failed: ${result.data.failureCount})`);
        } else {
            alert("Signal failed. No tokens found on server.");
        }
    } catch (e) {
        alert("Error calling test function: " + e.message);
    }
  };

  return { permission, requestPermission, sendTest };
};

export default useFcmToken;
// src/AuthContext.jsx - REAL-TIME SYNC EDITION

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // These now update instantly when Firestore changes
  const [hasAcceptedHipaa, setHasAcceptedHipaa] = useState(null); 
  const [userProfile, setUserProfile] = useState({ groupId: null, role: null });

  // --- Auth Actions ---

  const signup = async (email, password) => { 
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create the initial shell document immediately
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        isProfileComplete: false // Mark as incomplete initially
    }, { merge: true }); 

    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const completeOnboarding = async () => {
    if (currentUser && currentUser.uid) {
      const userRef = doc(db, "users", currentUser.uid);
      const timestamp = new Date();
      
      // We set specific flags that the UI listens for
      await setDoc(userRef, { 
        hipaaAccepted: true, 
        onboardingCompletedAt: timestamp,
        isProfileComplete: true, // This flag helps verify readiness
        consents: {
            termsAcceptedAt: timestamp,
            dataCollectionConsentAt: timestamp,
            groupSharingConsentAt: timestamp
        }
      }, { merge: true }); 
      // No need to manually set state here; the listener below will do it automatically
    }
  };

  // --- Real-Time Listener Logic ---
  
  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // 1. User is logged in. START LISTENING to their Firestore Profile.
        const userRef = doc(db, "users", user.uid);
        
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Real-time updates to global state
                setHasAcceptedHipaa(data.hipaaAccepted === true);
                setUserProfile({ 
                    groupId: data.groupId || null, 
                    role: data.role || null,
                    name: data.displayName || null
                });
            } else {
                // Self-Healing: If doc is missing (rare), create a hollow one
                setDoc(userRef, { email: user.email, createdAt: new Date() }, { merge: true });
            }
            setLoading(false); // We have data, app can load
        }, (error) => {
            console.error("Profile Sync Error:", error);
            setLoading(false); // Prevent infinite loading screen on error
        });

      } else {
        // 2. User logged out. STOP LISTENING and reset state.
        if (unsubscribeProfile) unsubscribeProfile();
        setHasAcceptedHipaa(null);
        setUserProfile({ groupId: null, role: null });
        setLoading(false);
      }
    });

    // Cleanup on unmount
    return () => {
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    signup, 
    login,  
    logout, 
    hasAcceptedHipaa, 
    completeOnboarding, 
    userProfile, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="p-10 text-center text-slate-500">Loading ShareCare...</div>} 
    </AuthContext.Provider>
  );
};
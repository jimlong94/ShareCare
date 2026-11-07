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
import { LOCAL_DEMO, demoUser, demoProfile } from './localDemo';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(LOCAL_DEMO ? demoUser : null);
  const [loading, setLoading] = useState(!LOCAL_DEMO);
  
  // These now update instantly when Firestore changes
  const [hasAcceptedHipaa, setHasAcceptedHipaa] = useState(LOCAL_DEMO ? true : null); 
  const [userProfile, setUserProfile] = useState(
    LOCAL_DEMO ? demoProfile : { groupId: null, role: null }
  );

  // --- Auth Actions ---

  const signup = async (email, password) => { 
    if (LOCAL_DEMO) return { user: demoUser };
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
    if (LOCAL_DEMO) return Promise.resolve({ user: demoUser });
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (LOCAL_DEMO) return Promise.resolve();
    return signOut(auth);
  };

  const completeOnboarding = async () => {
    if (LOCAL_DEMO) {
      setHasAcceptedHipaa(true);
      return;
    }
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
    if (LOCAL_DEMO) return;
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
      {/* UPDATED LOADING TEXT */}
      {!loading ? children : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
           <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
           <div className="text-slate-400 font-medium text-sm animate-pulse">Loading Zen Planner...</div>
        </div>
      )} 
    </AuthContext.Provider>
  );
};
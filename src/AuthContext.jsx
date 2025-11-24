// src/AuthContext.jsx - FIXED & CONSOLIDATED

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'; 
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; 
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Helper function to wait for the completion flag
const waitForProfileCompletion = async (userRef) => {
    return new Promise(resolve => {
        const check = async () => {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists() && docSnap.data().isProfileComplete) {
                // Profile is complete! Resolve with the final data.
                resolve(docSnap.data());
            } else {
                // Not complete yet, check again in 500ms
                setTimeout(check, 500);
            }
        };
        check();
    });
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAcceptedHipaa, setHasAcceptedHipaa] = useState(null); 
  const [userProfile, setUserProfile] = useState({ groupId: null, role: null });

  // --- Auth Actions ---

  const signup = async (email, password) => { 
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // CRITICAL: Initialize the user's Firestore document immediately.
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
    }, { merge: true }); 

    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    setHasAcceptedHipaa(null);
    setUserProfile({ groupId: null, role: null }); 
    return signOut(auth);
  };

  const completeOnboarding = async () => {
    if (currentUser && currentUser.uid) {
      const userRef = doc(db, "users", currentUser.uid);
      const timestamp = new Date();
      
      // Write specific timestamps for audit trails as per PRD
      await updateDoc(userRef, { 
        hipaaAccepted: true, 
        onboardingCompletedAt: timestamp,
        consents: {
            termsAcceptedAt: timestamp,
            dataCollectionConsentAt: timestamp,
            groupSharingConsentAt: timestamp
        }
      }); 
      
      setHasAcceptedHipaa(true); 
    }
  };

  // --- Profile Loading Logic ---

  const loadProfileAndSetupGroup = async (user) => {
    const userRef = doc(db, "users", user.uid);
    let docSnap = await getDoc(userRef);

    // If the document does not exist, return (should only happen during mid-signup)
    if (!docSnap.exists()) {
        setHasAcceptedHipaa(false);
        setUserProfile({ groupId: null, role: null });
        return; 
    }
    
    let finalData;

    // CRITICAL FIX: If profile is not complete, wait for it using polling
    if (!docSnap.data()?.isProfileComplete) {
        finalData = await waitForProfileCompletion(userRef);
    } else {
        finalData = docSnap.data();
    }
    
    // Safely read the finalized data
    let currentGroupId = finalData.groupId || null;
    let userRole = finalData.role || null;
    let hipaaAccepted = finalData.hipaaAccepted === true;
    
    // Set final states for rendering
    setHasAcceptedHipaa(hipaaAccepted);
    setUserProfile({ groupId: currentGroupId, role: userRole });
  };

  // --- Auth State Listener ---
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Must wait for profile loading before rendering App.jsx
        await loadProfileAndSetupGroup(user); 
      } else {
        setHasAcceptedHipaa(null);
        setUserProfile({ groupId: null, role: null });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- Export Value ---

  const value = {
    currentUser,
    signup, 
    login,  
    logout, 
    hasAcceptedHipaa, 
    completeOnboarding, // Exporting the new correct function
    userProfile, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>} 
    </AuthContext.Provider>
  );
};
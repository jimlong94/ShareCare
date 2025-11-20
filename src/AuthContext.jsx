// src/AuthContext.jsx - FINAL ARCHITECTURAL FIX (ELIMINATING ADMIN FALLBACK RACE CONDITION)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'; 
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAcceptedHipaa, setHasAcceptedHipaa] = useState(null); 
  const [userProfile, setUserProfile] = useState({ groupId: null, role: null });

  const signup = async (email, password) => { 
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // CRITICAL FIX: Initialize the user's Firestore document immediately.
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

  const saveHipaaAcceptance = async () => {
    if (currentUser && currentUser.uid) {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { 
        hipaaAccepted: true,
        hipaaAcceptedAt: new Date(),
      }, { merge: true }); 
      setHasAcceptedHipaa(true); 
    }
  };

  // --- FINAL CORRECTED LOGIC: Loads profile and only runs Admin fallback if necessary ---
  const loadProfileAndSetupGroup = async (user) => {
    const userRef = doc(db, "users", user.uid);
    let docSnap = await getDoc(userRef);

    let currentGroupId = docSnap.data()?.groupId;
    let userRole = docSnap.data()?.role;
    let hipaaAccepted = docSnap.data()?.hipaaAccepted === true;
    
    // 🚨 FIX: Only run setup logic if GroupId and Role are BOTH missing.
    // This allows Auth.jsx (invite) to write data without interference.
    if (!currentGroupId || !userRole) {
      
      // 1. Check if the user is the Admin (created their own group)
      const q = query(collection(db, "groups"), where("adminId", "==", user.uid));
      const groupSnapshot = await getDocs(q);
      
      let newGroupId = currentGroupId;
      let newRole = userRole;
      
      // If no group exists AND we are missing data, it MUST be a new Admin.
      if (groupSnapshot.empty && !currentGroupId) {
        // SCENARIO A: Brand new Admin user -> Create new group
        const newGroupRef = await addDoc(collection(db, "groups"), {
          name: `${user.email}'s Care Hub`,
          adminId: user.uid,
          createdAt: new Date(),
        });
        newGroupId = newGroupRef.id;
        newRole = "Admin";
        
      } else if (!currentGroupId && groupSnapshot.docs.length > 0) {
        // SCENARIO B: User logged in, has no groupId, but a group for them exists 
        // (i.e., failed previous setup)
        newGroupId = groupSnapshot.docs[0].id;
        newRole = "Admin"; // Re-assert Admin role for cleanup/old users
      }
      
      // 2. If new data was derived, update the user's profile
      if (newGroupId && newRole) {
          await setDoc(userRef, {
              groupId: newGroupId,
              role: newRole,
          }, { merge: true });
          currentGroupId = newGroupId;
          userRole = newRole;
      }
    }

    // Set all derived states for rendering
    setHasAcceptedHipaa(hipaaAccepted);
    setUserProfile({ groupId: currentGroupId, role: userRole });
  };
  // -------------------------------------------------------------------


  // Set up Firebase Auth State Listener
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

  const value = {
    currentUser,
    signup, 
    login,  
    logout, 
    hasAcceptedHipaa, 
    saveHipaaAcceptance, 
    userProfile, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>} 
    </AuthContext.Provider>
  );
};
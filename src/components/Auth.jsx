// src/components/Auth.jsx - FINAL FIX (Resolves AdminId Undefined Error)

import { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'; 

function Auth() {
  const [isLoginView, setIsLoginView] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, login } = useAuth(); 

  const primaryButtonText = isLoginView ? 'Login' : 'Sign Up';
  const toggleLinkText = isLoginView ? 'Need an account? Sign Up' : 'Have an account? Log In';

  const validateInviteCode = async (code) => {
    if (!code) return null;

    try {
      const inviteRef = doc(db, "invites", code);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setError('Invalid invite code.');
        return null;
      }
      
      const data = inviteSnap.data();
      
      if (data.status !== 'pending') {
        setError('Invite code has already been used.');
        return null;
      }
      if (data.expiresAt.toDate() < new Date()) {
        setError('Invite code has expired.');
        return null;
      }

      return { groupId: data.groupId, role: data.invitedRole };

    } catch (e) {
      console.error("Invite validation error:", e);
      setError('An error occurred during validation.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    
    setLoading(true);

    try {
      if (isLoginView) {
        await login(email, password); 
      } else {
        // --- SIGNUP FLOW ---
        
        let validInvite = null;
        let targetGroupId, targetRole;
        
        // 1. Validate Invite Code (If provided)
        if (inviteCode) {
            validInvite = await validateInviteCode(inviteCode);
            if (!validInvite) {
                setLoading(false);
                return;
            }
            targetGroupId = validInvite.groupId;
            targetRole = validInvite.role;

        } else {
            // SCENARIO 2 Setup: User is New Admin.
            targetGroupId = null; // Will be created after signup
            targetRole = "Admin";
        }
        
        // 2. Execute Signup (AuthContext creates the base user doc)
        const userCredential = await signup(email, password);
        const userId = userCredential.user.uid;
        const userEmail = userCredential.user.email;

        // 3. CRITICAL: Group creation MUST happen AFTER signup/auth.
        if (!validInvite) {
            // Only run if it's the NEW ADMIN case (not an invited user)
            const newGroupRef = await addDoc(collection(db, "groups"), {
                name: `${userEmail}'s Care Hub`,
                adminId: userId, 
                createdAt: new Date(),
            });
            targetGroupId = newGroupRef.id;
        }
        
        // 4. Build Final Profile Data
        const profileData = {
            groupId: targetGroupId,
            role: targetRole,
            isProfileComplete: true, // Set this LAST
        };
        
        // 🚨 FIX: Only include the adminId field if the role is Admin.
        if (targetRole === "Admin") {
            profileData.adminId = userId;
        }

        // 5. Update User Profile (Single, decisive write)
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, profileData);
        
        // 6. Mark Invite as Used (if applicable)
        if (validInvite) {
            const inviteRef = doc(db, "invites", inviteCode);
            await updateDoc(inviteRef, {
                status: 'used',
                usedBy: userEmail,
                usedAt: new Date(),
            });
        }
      }
    } catch (firebaseError) {
      console.error(firebaseError);
      alert("Signup or Group Creation Failed. See console for details.");
      setError('Authentication Failed. Please check your credentials or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container app-container">
      <h1>{isLoginView ? 'Welcome Back!' : 'Join ShareCare'}</h1>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="error-message" style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '10px', borderRadius: '4px' }}>{error}</p>}

        <div className="form-group">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {!isLoginView && (
            <div className="form-group">
                <label htmlFor="invite-code">
                    If you were invited with a code, please insert it here (Optional)
                </label>
                <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Invitation Code (e.g., aDDt56vJ7ZMIxDAaVyoU)"
                />
            </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Loading...' : primaryButtonText}
        </button>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setIsLoginView(!isLoginView);
              setError('');
              setInviteCode(''); 
              setEmail('');
              setPassword('');
            }}
            style={{ color: 'var(--color-primary)' }}
          >
            {toggleLinkText}
          </a>
        </p>
      </form>
    </div>
  );
}

export default Auth;
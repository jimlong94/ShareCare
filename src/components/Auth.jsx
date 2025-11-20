// src/components/Auth.jsx - UPDATED to make Invite Code OPTIONAL

import { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 

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
        // Standard Login
        await login(email, password); 
      } else {
        // --- SIGNUP FLOW ---
        
        let validInvite = null;
        let isInvitedUser = false;

        // 1. If an invite code is provided, validate it.
        if (inviteCode) {
            validInvite = await validateInviteCode(inviteCode);
            if (!validInvite) {
                setLoading(false);
                return; // Stop signup if code is invalid
            }
            isInvitedUser = true;
        }
        
        // 2. Execute Signup (AuthContext will create the base user doc)
        const userCredential = await signup(email, password);
        const userId = userCredential.user.uid;
        
        // 3. Conditional User Profile Update
        if (isInvitedUser) {
            // User signed up with a valid invite, link them to the group/role
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                groupId: validInvite.groupId,
                role: validInvite.role,
            });

            // Mark Invite as Used
            const inviteRef = doc(db, "invites", inviteCode);
            await updateDoc(inviteRef, {
                status: 'used',
                usedBy: email,
                usedAt: new Date(),
            });
        }
        
        // Note: If !isInvitedUser, AuthContext will run loadProfileAndSetupGroup 
        // after signup, which correctly assumes they are a new Admin and creates the group.

      }
    } catch (firebaseError) {
      console.error(firebaseError);
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

        {/* Email and Password fields remain the same */}
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
        
        {/* Invite Code Field (Optional, softer phrasing) */}
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
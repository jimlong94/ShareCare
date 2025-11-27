// src/components/Auth.jsx - TAILWIND EDITION

import { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'; 
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react'; // Icons for trust

function Auth() {
  const [isLoginView, setIsLoginView] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, login } = useAuth(); 

  const validateInviteCode = async (code) => {
    if (!code) return null;
    try {
      const inviteRef = doc(db, "invites", code);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) { setError('Invalid invite code.'); return null; }
      const data = inviteSnap.data();
      if (data.status !== 'pending') { setError('Invite code has already been used.'); return null; }
      if (data.expiresAt.toDate() < new Date()) { setError('Invite code has expired.'); return null; }

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
    if (!email || !password) { setError('Email and password are required.'); return; }
    
    setLoading(true);

    try {
      if (isLoginView) {
        await login(email, password); 
      } else {
        // --- SIGNUP FLOW ---
        let validInvite = null;
        let targetGroupId, targetRole;
        
        if (inviteCode) {
            validInvite = await validateInviteCode(inviteCode);
            if (!validInvite) { setLoading(false); return; }
            targetGroupId = validInvite.groupId;
            targetRole = validInvite.role;
        } else {
            targetGroupId = null; 
            targetRole = "Admin";
        }
        
        const userCredential = await signup(email, password);
        const userId = userCredential.user.uid;
        const userEmail = userCredential.user.email;

        if (!validInvite) {
            const newGroupRef = await addDoc(collection(db, "groups"), {
                name: `${userEmail}'s Care Hub`,
                adminId: userId, 
                createdAt: new Date(),
            });
            targetGroupId = newGroupRef.id;
        }
        
        const profileData = {
            groupId: targetGroupId,
            role: targetRole,
            isProfileComplete: true, 
        };
        
        if (targetRole === "Admin") profileData.adminId = userId;

        await updateDoc(doc(db, "users", userId), profileData);
        
        if (validInvite) {
            await updateDoc(doc(db, "invites", inviteCode), {
                status: 'used',
                usedBy: userEmail,
                usedAt: new Date(),
            });
        }
      }
    } catch (firebaseError) {
      console.error(firebaseError);
      setError('Authentication Failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-md p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-full mb-3">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isLoginView ? 'Welcome Back' : 'Join ShareCare'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
                {isLoginView ? 'Sign in to coordinate care.' : 'Create your secure family hub.'}
            </p>
        </div>
      
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-btn text-sm font-medium border border-rose-100 text-center">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="auth-email" className={labelClass}>Email Address</label>
                <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="name@example.com"
                    autoFocus
                />
            </div>

            <div>
                <label htmlFor="auth-password" className={labelClass}>Password</label>
                <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                />
            </div>
            
            {!isLoginView && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                    <label htmlFor="invite-code" className={labelClass}>
                        Invitation Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                        id="invite-code"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className={`${inputClass} font-mono text-sm`}
                        placeholder="Paste code here..."
                    />
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-btn shadow-soft transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
                {loading ? 'Processing...' : (isLoginView ? <><LogIn size={18}/> Log In</> : <><UserPlus size={18}/> Create Account</>)}
            </button>

            <div className="text-center mt-6">
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsLoginView(!isLoginView);
                        setError('');
                        setInviteCode(''); 
                    }}
                    className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors"
                >
                    {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default Auth;
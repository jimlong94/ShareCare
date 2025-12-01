// src/components/Auth.jsx
import { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'; 
import { LogIn, UserPlus, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

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

  const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[600px] border border-slate-100">
        
        {/* LEFT: Branding Area (Hidden on mobile) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 p-12 flex-col justify-between relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-teal-400 opacity-20"></div>
            
            <div className="relative z-10">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
                    <ShieldCheck size={32} className="text-teal-50" />
                </div>
                <h1 className="text-4xl font-bold mb-4 tracking-tight">ShareCare</h1>
                <p className="text-teal-100 text-lg leading-relaxed opacity-90">
                    Secure logistics for family caregivers. Coordinate tasks, share documents, and keep everyone on the same page.
                </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-teal-200/80">
                <HeartHandshake size={16} />
                <span>Simple. Secure. Private.</span>
            </div>
        </div>

        {/* RIGHT: Form Area */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-8">
                <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-xl mb-3">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">ShareCare</h1>
            </div>

            {/* Pill Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
                <button 
                    onClick={() => { setIsLoginView(true); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${isLoginView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => { setIsLoginView(false); setError(''); setInviteCode(''); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${!isLoginView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sign Up
                </button>
            </div>
        
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold border border-rose-100 flex items-center justify-center text-center animate-in fade-in slide-in-from-top-1">
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
                        required
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
                        required
                    />
                </div>
                
                {!isLoginView && (
                    <div className="pt-4 border-t border-slate-100 animate-in fade-in">
                        <label htmlFor="invite-code" className={labelClass}>
                            Invitation Code <span className="text-slate-400 font-normal normal-case tracking-normal">(Optional)</span>
                        </label>
                        <input
                            id="invite-code"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className={`${inputClass} font-mono tracking-wider`}
                            placeholder="Paste code here..."
                        />
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
                >
                    {loading ? 'Processing...' : (isLoginView ? <><LogIn size={20}/> Log In</> : <><UserPlus size={20}/> Create Account</>)}
                    {!loading && <ArrowRight size={18} className="opacity-50" />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
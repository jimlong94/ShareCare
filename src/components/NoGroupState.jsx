// src/components/NoGroupState.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { Leaf, Users, Plus, ArrowRight, LogOut, Trash2 } from 'lucide-react';

function NoGroupState() {
  const { currentUser, logout } = useAuth();
  const [mode, setMode] = useState('menu'); // 'menu', 'join', 'create'
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateHub = async () => {
    setLoading(true);
    try {
      const newGroupRef = await addDoc(collection(db, "groups"), {
        name: `${currentUser.email}'s Zen Hub`,
        adminId: currentUser.uid,
        createdAt: new Date(),
      });

      await updateDoc(doc(db, "users", currentUser.uid), {
        groupId: newGroupRef.id,
        role: 'Admin',
        adminId: currentUser.uid,
      });
      
    } catch (e) {
      console.error(e);
      setError("Failed to create hub.");
      setLoading(false);
    }
  };

  const handleJoinHub = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const inviteRef = doc(db, "invites", inviteCode);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) throw new Error("Invalid code.");
      const data = inviteSnap.data();
      if (data.status !== 'pending') throw new Error("Code already used.");
      
      await updateDoc(doc(db, "users", currentUser.uid), {
        groupId: data.groupId,
        role: data.invitedRole,
      });

      await updateDoc(inviteRef, {
        status: 'used',
        usedBy: currentUser.email,
        usedAt: new Date()
      });

    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to join.");
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid));
      await deleteUser(currentUser);
    } catch (e) {
      console.error(e);
      alert("Please log out and log back in to verify identity before deleting.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-500">
        
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-full mb-6 ring-4 ring-teal-50/50">
          <Leaf size={40} fill="currentColor" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">The Zen Family Planner</h1>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed">
          You are logged in, but not connected to a Family Hub yet. Let's get you settled.
        </p>

        {mode === 'menu' && (
          <div className="space-y-4">
            <button 
              onClick={handleCreateHub} 
              disabled={loading}
              className="w-full group bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-3"><Plus size={20} className="text-teal-400"/> Create New Hub</span>
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"/>
            </button>
            
            <button 
              onClick={() => setMode('join')}
              className="w-full group bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-700 hover:text-teal-700 p-4 rounded-2xl font-bold transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-3"><Users size={20} className="text-slate-400 group-hover:text-teal-500"/> Join with Code</span>
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"/>
            </button>

            <div className="pt-8 flex flex-col gap-3">
                <button onClick={logout} className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <LogOut size={14} /> Log Out
                </button>
                <button onClick={handleDeleteAccount} className="text-rose-300 hover:text-rose-500 text-xs font-medium flex items-center justify-center gap-1 transition-colors">
                    <Trash2 size={12} /> Delete Account
                </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinHub} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="text-left">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Enter Invite Code</label>
                <input 
                    autoFocus
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-center tracking-widest text-lg focus:outline-none focus:border-teal-500 transition-all uppercase"
                    placeholder="XYZ-123"
                />
            </div>
            
            {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}

            <div className="flex gap-3">
                <button type="button" onClick={() => setMode('menu')} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition-all">
                    {loading ? 'Joining...' : 'Join Hub'}
                </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default NoGroupState;
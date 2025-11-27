// src/components/NoGroupState.jsx

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { Shield, Users, LogOut, Plus, Trash2, ArrowRight } from 'lucide-react';

function NoGroupState() {
  const { currentUser, logout, userProfile } = useAuth();
  const [mode, setMode] = useState('menu'); // 'menu', 'join', 'create'
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Option 1: Create New Hub ---
  const handleCreateHub = async () => {
    setLoading(true);
    try {
      // 1. Create the Group
      const newGroupRef = await addDoc(collection(db, "groups"), {
        name: `${currentUser.email}'s Care Hub`,
        adminId: currentUser.uid,
        createdAt: new Date(),
      });

      // 2. Update the User
      // Because AuthContext is now listening, this specific updateDoc 
      // will trigger the App to re-render and show the Dashboard instantly.
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

  // --- Option 2: Join Existing ---
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
      
      // Update User
      await updateDoc(doc(db, "users", currentUser.uid), {
        groupId: data.groupId,
        role: data.invitedRole,
      });

      // Close Invite
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

  // --- Option 3: Delete Account ---
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    
    try {
      // 1. Delete Firestore Profile
      await deleteDoc(doc(db, "users", currentUser.uid));
      
      // 2. Delete Auth Account
      await deleteUser(currentUser);
    } catch (e) {
      console.error(e);
      alert("Please log out and log back in to verify identity before deleting.");
    }
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-card shadow-xl border border-slate-100 text-center">
        
        <div className="inline-flex p-4 bg-slate-100 text-slate-500 rounded-full mb-6">
          <Shield size={40} />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">No Active Hub</h1>
        <p className="text-slate-500 mb-8 text-sm">
          It looks like you were removed from your previous group or haven't joined one yet.
        </p>

        {mode === 'menu' && (
          <div className="space-y-3">
            <button 
              onClick={handleCreateHub} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-btn font-bold transition-all shadow-soft"
            >
              <Plus size={18} /> Create New Hub
            </button>
            
            <button 
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-btn font-bold transition-colors"
            >
              <Users size={18} /> Join with Code
            </button>

            <div className="h-px bg-slate-100 my-4"></div>

            <button 
              onClick={logout}
              className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
            >
              Log Out
            </button>
            
            <button 
              onClick={handleDeleteAccount}
              className="w-full text-rose-300 hover:text-rose-500 text-xs font-medium py-2 flex items-center justify-center gap-1"
            >
              <Trash2 size={12} /> Delete My Account
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinHub} className="space-y-4 animate-in fade-in">
            <div className="text-left">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Invite Code</label>
                <input 
                    autoFocus
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn mt-1 font-mono text-center tracking-widest"
                    placeholder="Paste code..."
                />
            </div>
            
            {error && <p className="text-rose-500 text-sm bg-rose-50 p-2 rounded">{error}</p>}

            <div className="flex gap-2">
                <button type="button" onClick={() => setMode('menu')} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 rounded-btn">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-btn shadow-soft">
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
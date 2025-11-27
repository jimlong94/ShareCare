// src/components/GroupSettingsModal.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { X, Shield, User, UserMinus, Crown } from 'lucide-react';

function GroupSettingsModal({ onClose }) {
  const { userProfile, currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Real-time Member List ---
  useEffect(() => {
    if (userProfile?.groupId) {
      const q = query(collection(db, "users"), where('groupId', '==', userProfile.groupId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(list);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userProfile]);

  // --- Handlers ---
  const handleRemoveMember = async (memberId, memberName) => {
    if (memberId === currentUser.uid) {
      alert("You cannot remove yourself. You must transfer ownership first.");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${memberName}? They will lose access to this Hub immediately.`)) {
      return;
    }

    try {
      // We don't delete the user, we just strip their access rights
      await updateDoc(doc(db, "users", memberId), {
        groupId: null,
        role: null,
        removedAt: new Date()
      });
    } catch (e) {
      console.error("Error removing member:", e);
      alert("Failed to remove member.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-card shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-teal-100 text-teal-700 rounded-lg"><Shield size={20} /></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Manage Team</h2>
                <p className="text-xs text-slate-500">Hub ID: {userProfile?.groupId}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        {/* List */}
        <div className="p-0 overflow-y-auto max-h-[60vh]">
            {loading ? (
                <div className="p-8 text-center text-slate-400">Loading members...</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {members.map((member) => {
                        const isMe = member.id === currentUser.uid;
                        return (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm 
                                        ${isMe ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {isMe ? <Crown size={18} /> : <User size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">
                                            {member.displayName || member.email.split('@')[0]} 
                                            {isMe && <span className="ml-2 text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">YOU</span>}
                                        </p>
                                        <p className="text-xs text-slate-400">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                                        {member.role}
                                    </span>
                                    
                                    {!isMe && userProfile.role === 'Admin' && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id, member.email)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Remove User"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
                Removing a user revokes their access immediately. <br/>
                They must be re-invited to join again.
            </p>
        </div>

      </div>
    </div>
  );
}

export default GroupSettingsModal;
// src/components/GroupSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { X, Shield, User, UserMinus, Crown, Copy, Check } from 'lucide-react';
import { LOCAL_DEMO, demoMembers } from '../localDemo';

function GroupSettingsModal({ onClose }) {
  const { userProfile, currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (LOCAL_DEMO) {
      setMembers(demoMembers);
      setLoading(false);
      return;
    }
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

  const handleRemoveMember = async (memberId, memberName) => {
    if (memberId === currentUser.uid) return;
    if (!window.confirm(`Remove ${memberName} from the Family Group?`)) return;
    if (LOCAL_DEMO) {
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      return;
    }

    try {
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

  const copyGroupId = () => {
    navigator.clipboard.writeText(userProfile?.groupId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl"><Shield size={24} /></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Family Team</h2>
                <button 
                    onClick={copyGroupId} 
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors mt-0.5 group"
                >
                    ID: <span className="font-mono">{userProfile?.groupId?.slice(0,8)}...</span>
                    {copied ? <Check size={12} className="text-teal-500"/> : <Copy size={12} className="group-hover:scale-110"/>}
                </button>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto custom-scrollbar bg-slate-50/30 flex-1">
            {loading ? (
                <div className="p-8 text-center text-slate-400 italic">Loading team...</div>
            ) : (
                <div className="space-y-3">
                    {members.map((member) => {
                        const isMe = member.id === currentUser.uid;
                        const isAdmin = member.role === 'Admin';
                        
                        return (
                            <div key={member.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-100 transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                        ${isMe ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {isAdmin ? <Crown size={18} /> : <User size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                            {member.displayName || member.email.split('@')[0]} 
                                            {isMe && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100 uppercase tracking-wide">You</span>}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pl-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider
                                        ${isAdmin ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        {member.role}
                                    </span>
                                    
                                    {!isMe && userProfile.role === 'Admin' && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id, member.email)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Remove User"
                                        >
                                            <UserMinus size={16} />
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
        <div className="p-5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
                Admins can remove members instantly. <br/>
                Removed members must be re-invited to rejoin.
            </p>
        </div>

      </div>
    </div>
  );
}

export default GroupSettingsModal;
// src/components/InviteModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Copy, Users, Check, Ticket, ArrowRight } from 'lucide-react';

function InviteModal({ onClose, currentGroupId }) {
  const { currentUser } = useAuth();
  const [invitedRole, setInvitedRole] = useState('Editor');
  const [inviteToken, setInviteToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    setError(null);
    setLoading(true);
    if (!currentGroupId) { setError("Group ID missing."); setLoading(false); return; }

    try {
      const docRef = await addDoc(collection(db, "invites"), {
        groupId: currentGroupId,
        invitedRole: invitedRole,
        createdBy: currentUser.email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        status: 'pending',
      });
      setInviteToken(docRef.id);
    } catch (e) {
      console.error(e);
      setError("Failed to generate invite.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const message = `You've been invited to The Zen Family Planner!\n\n1. Go to: https://zenfamilyplanner.com\n2. Click 'Sign Up' then 'Join with Code'\n3. Enter this code: ${inviteToken}\n\nThis code expires in 7 days.`;
    
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl"><Users size={24} /></div>
              <h2 className="text-xl font-bold text-slate-800">Invite Family</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6">
          {!inviteToken ? (
            <>
                <p className="text-slate-600 text-sm leading-relaxed">
                    Create a secure link to let a family member join your Zen Planner hub.
                </p>
                
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Access Level</label>
                    <div className="relative">
                        <select
                            value={invitedRole}
                            onChange={(e) => setInvitedRole(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
                        >
                            <option value="Editor">Editor (Can edit tasks & notes)</option>
                            <option value="User">Helper (View & Check-off only)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                </div>

                {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">{error}</p>}
                
                <button
                    onClick={generateInvite}
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? 'Generating...' : <>Generate Code <ArrowRight size={18} opacity={0.6}/></>}
                </button>
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-full mb-1 shadow-sm ring-4 ring-amber-50">
                        <Ticket size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Golden Ticket Ready</h3>
                    <p className="text-xs text-slate-500">Share this code with your family member.</p>
                </div>
                
                {/* The Ticket UI */}
                <div className="relative group cursor-pointer" onClick={copyToClipboard}>
                    <div className="absolute inset-0 bg-teal-600 rounded-xl transform translate-y-1 translate-x-1 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5 opacity-20"></div>
                    <div className="relative bg-white border-2 border-teal-100 rounded-xl p-1 flex items-center justify-between hover:border-teal-300 transition-colors">
                        <div className="bg-slate-50 flex-1 p-3 rounded-lg border border-slate-100 text-center overflow-hidden">
                            {/* UPDATED: Responsive font size and break-all to prevent overflow */}
                            <code className="font-mono text-lg sm:text-2xl font-bold text-slate-800 tracking-widest break-all">
                                {inviteToken}
                            </code>
                        </div>
                        <div className={`mx-3 p-2 rounded-lg transition-colors ${copied ? 'bg-teal-50 text-teal-600' : 'bg-white text-slate-400 group-hover:text-teal-500'}`}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </div>
                    </div>
                    <div className="text-center mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${copied ? 'text-teal-600' : 'text-slate-400'}`}>
                            {copied ? 'Copied to Clipboard!' : 'Tap to Copy Code & Instructions'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                    Done
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
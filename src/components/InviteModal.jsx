// src/components/InviteModal.jsx - TAILWIND EDITION

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Copy, Users, Check } from 'lucide-react';

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
    navigator.clipboard.writeText(inviteToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Users size={20} /></div>
              <h2 className="text-xl font-bold text-slate-800">Invite Member</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          {!inviteToken ? (
            <>
                <p className="text-slate-600 text-sm">
                    Generate a one-time code to let a family member join <strong>Hub ID: {currentGroupId}</strong>.
                </p>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Assign Role</label>
                    <select
                        value={invitedRole}
                        onChange={(e) => setInvitedRole(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="Editor">Editor (Full Access)</option>
                        <option value="User">User (View & Complete Tasks)</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-2">
                        {invitedRole === 'Editor' ? 'Can create, edit, and delete tasks.' : 'Can only check off tasks assigned to them.'}
                    </p>
                </div>

                {error && <p className="text-rose-500 text-sm bg-rose-50 p-2 rounded">{error}</p>}
                
                <button
                    onClick={generateInvite}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-btn shadow-soft transition-transform active:scale-95"
                >
                    {loading ? 'Generating Code...' : 'Generate Invite Code'}
                </button>
            </>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-center">
                    <p className="text-teal-800 font-medium mb-1">Invitation Ready!</p>
                    <p className="text-xs text-teal-600">Share this code with your family member.</p>
                </div>
                
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Invite Code</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-slate-100 border border-slate-200 p-3 rounded-lg font-mono text-lg text-slate-800 tracking-wider text-center select-all">
                            {inviteToken}
                        </code>
                        <button 
                            onClick={copyToClipboard}
                            className="bg-slate-800 text-white p-3 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Copy to Clipboard"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-500">
                    <p>• Code expires in 7 days.</p>
                    <p>• Valid for one use only.</p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-btn hover:bg-slate-200 transition-colors"
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
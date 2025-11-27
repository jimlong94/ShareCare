// src/components/TaskHistoryModal.jsx - TAILWIND EDITION

import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { X, Send, Clock, User } from 'lucide-react';

function TaskHistoryModal({ onClose, task, currentUserRole }) {
  const { currentUser } = useAuth(); 
  const [notesHistory, setNotesHistory] = useState(task.updates || []);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const canAddNote = currentUserRole === 'Admin' || currentUserRole === 'Editor';

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const newUpdateEntry = {
        type: 'note',
        text: newNote.trim(),
        timestamp: new Date(),
        user: currentUser.email,
      };
      await updateDoc(doc(db, "tasks", task.id), {
        updates: arrayUnion(newUpdateEntry)
      });
      setNotesHistory(prev => [...prev, newUpdateEntry]); 
      setNewNote('');
    } catch (e) {
      console.error(e);
      alert("Failed to add note.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-card shadow-2xl w-full max-w-lg flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-card">
          <div>
              <h2 className="text-lg font-bold text-slate-800">Activity Log</h2>
              <p className="text-xs text-slate-500 truncate max-w-[250px]">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 custom-scrollbar">
            {notesHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm italic">No updates recorded yet.</div>
            ) : (
                notesHistory.map((update, index) => (
                    <div key={index} className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 border border-teal-200">
                                <User size={14} />
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-slate-200 flex-1">
                            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{update.text}</p>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                <span className="truncate max-w-[120px]">{update.user || 'Unknown'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={10} /> {formatTimestamp(update.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer / Input */}
        {canAddNote ? (
          <form onSubmit={handleAddNote} className="p-4 border-t border-slate-200 bg-white rounded-b-card">
            <div className="relative">
                <textarea
                    rows="2"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note or update..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white resize-none"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNote(e);
                        }
                    }}
                ></textarea>
                <button 
                    type="submit" 
                    disabled={loading || !newNote.trim()}
                    className="absolute right-2 bottom-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Press Enter to send</p>
          </form>
        ) : (
             <div className="p-4 bg-slate-50 text-center border-t border-slate-200">
                 <p className="text-xs text-slate-400">View-only mode.</p>
             </div>
        )}
      </div>
    </div>
  );
}

export default TaskHistoryModal;
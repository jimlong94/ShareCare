// src/components/TaskHistoryModal.jsx - FINAL EXPANDED

import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { X, Send, Clock, User, AtSign, CheckCircle2, Share } from 'lucide-react';

function TaskHistoryModal({ onClose, task, currentUserRole, members = [] }) {
  const { currentUser } = useAuth(); 
  const [notesHistory, setNotesHistory] = useState(task.updates || []);
  const [newNote, setNewNote] = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]); 
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const canAddNote = currentUserRole === 'Admin' || currentUserRole === 'Editor';

  const toggleTag = (member) => {
    if (taggedUsers.includes(member.id)) {
        setTaggedUsers(prev => prev.filter(id => id !== member.id));
    } else {
        setTaggedUsers(prev => [...prev, member.id]);
        setNewNote(prev => prev + `@${member.name} `); 
    }
  };

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
        mentions: taggedUsers, 
        acknowledgedBy: [] 
      };

      await updateDoc(doc(db, "tasks", task.id), {
        updates: arrayUnion(newUpdateEntry)
      });
      
      setNotesHistory(prev => [...prev, newUpdateEntry]); 
      setNewNote('');
      setTaggedUsers([]);
      setShowTagMenu(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add note.");
    } finally {
      setLoading(false);
    }
  };

  // --- Acknowledgment Logic ---
  const handleAcknowledge = async (noteIndex) => {
    try {
        const updatedHistory = [...notesHistory];
        const noteToUpdate = { ...updatedHistory[noteIndex] };

        if (!noteToUpdate.acknowledgedBy) noteToUpdate.acknowledgedBy = [];

        if (!noteToUpdate.acknowledgedBy.includes(currentUser.uid)) {
            noteToUpdate.acknowledgedBy.push(currentUser.uid);
            updatedHistory[noteIndex] = noteToUpdate;

            await updateDoc(doc(db, "tasks", task.id), {
                updates: updatedHistory
            });
            setNotesHistory(updatedHistory);
        }
    } catch (e) {
        console.error("Acknowledgment failed:", e);
        alert("Failed to save acknowledgment.");
    }
  };

  // --- Share Single Note Logic ---
  const handleShareNote = async (text) => {
    const shareText = `📝 Update on "${task.title}":\n\n${text}`;
    if (navigator.share) {
        try { await navigator.share({ text: shareText }); } catch (err) {}
    } else {
        navigator.clipboard.writeText(shareText);
        alert("Note copied to clipboard!");
    }
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-card shadow-2xl w-full max-w-lg flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-card">
          <div>
              <h2 className="text-lg font-bold text-slate-800">Activity Log</h2>
              <p className="text-xs text-slate-500 truncate max-w-[250px]">{task.title}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 custom-scrollbar">
            {notesHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm italic">No updates recorded yet.</div>
            ) : (
                notesHistory.map((update, index) => {
                    const isMentioned = update.mentions?.includes(currentUser.uid);
                    return (
                        <div key={index} className={`flex gap-3 ${isMentioned ? 'animate-pulse-once' : ''}`}>
                            <div className="mt-1 flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border 
                                    ${isMentioned ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-teal-100 text-teal-600 border-teal-200'}`}>
                                    {isMentioned ? <AtSign size={14} /> : <User size={14} />}
                                </div>
                            </div>
                            <div className={`p-3 rounded-r-xl rounded-bl-xl shadow-sm border flex-1 relative group
                                ${isMentioned ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-200'}`}>
                                
                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{update.text}</p>
                                
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    <span className="truncate max-w-[120px]">{update.user || 'Unknown'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock size={10} /> {formatTimestamp(update.timestamp)}
                                    </span>
                                    
                                    {/* SHARE BUTTON */}
                                    <button 
                                        onClick={() => handleShareNote(update.text)}
                                        className="ml-auto text-slate-300 hover:text-teal-600 transition-colors"
                                        title="Share this note"
                                    >
                                        <Share size={12} />
                                    </button>
                                </div>

                                {isMentioned && (
                                    <button 
                                        onClick={() => handleAcknowledge(index)}
                                        className="absolute top-2 right-2 text-amber-400 hover:text-amber-600"
                                        title="Acknowledge"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {canAddNote ? (
          <form onSubmit={handleAddNote} className="p-4 border-t border-slate-200 bg-white rounded-b-card relative">
            {showTagMenu && (
                <div className="absolute bottom-full left-4 mb-2 bg-white rounded-lg shadow-xl border border-slate-100 p-2 w-48 animate-in slide-in-from-bottom-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Mention Member</p>
                    {members.map(m => (
                        <button 
                          key={m.id} 
                          type="button" 
                          onClick={() => toggleTag(m)} 
                          className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${taggedUsers.includes(m.id) ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                            <span>{m.name}</span>
                            {taggedUsers.includes(m.id) && <CheckCircle2 size={12}/>}
                        </button>
                    ))}
                </div>
            )}
            <div className="relative">
                <textarea 
                  rows="2" 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)} 
                  placeholder="Add a note... use @ to mention" 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white resize-none" 
                  onKeyDown={(e) => { 
                    if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(e); } 
                  }}
                ></textarea>
                <div className="absolute right-2 bottom-2 flex gap-1">
                    <button 
                      type="button" 
                      onClick={() => setShowTagMenu(!showTagMenu)} 
                      className={`p-2 rounded-lg transition-colors ${taggedUsers.length > 0 ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`} 
                      title="Tag someone"
                    >
                      <AtSign size={16} />
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !newNote.trim()} 
                      className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                </div>
            </div>
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
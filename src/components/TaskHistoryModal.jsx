// src/components/TaskHistoryModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { X, Send, Clock, User, AtSign, CheckCircle2, Share, MessageSquare } from 'lucide-react';

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

  const handleAcknowledge = async (noteIndex) => {
    try {
        const updatedHistory = [...notesHistory];
        const noteToUpdate = { ...updatedHistory[noteIndex] };
        if (!noteToUpdate.acknowledgedBy) noteToUpdate.acknowledgedBy = [];

        if (!noteToUpdate.acknowledgedBy.includes(currentUser.uid)) {
            noteToUpdate.acknowledgedBy.push(currentUser.uid);
            updatedHistory[noteIndex] = noteToUpdate;
            await updateDoc(doc(db, "tasks", task.id), { updates: updatedHistory });
            setNotesHistory(updatedHistory);
        }
    } catch (e) { console.error(e); }
  };

  // 👇 UPDATED SHARE FUNCTION
  const handleShareNote = async (text) => {
    const signature = "\n\n— via The Zen Family Planner\nzenfamilyplanner.com";
    const shareText = `📝 Update on "${task.title}":\n\n${text}${signature}`;
    
    if (navigator.share) { 
        try { await navigator.share({ text: shareText }); } catch (err) {} 
    } else { 
        navigator.clipboard.writeText(shareText); 
        alert("Note copied!"); 
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col h-[650px] max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={20} className="text-teal-600"/> Activity Log
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[250px] mt-0.5">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white custom-scrollbar">
            {notesHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                    <MessageSquare size={40} strokeWidth={1.5} />
                    <p className="text-sm italic">No updates yet. Start the conversation.</p>
                </div>
            ) : (
                notesHistory.map((update, index) => {
                    const isMentioned = update.mentions?.includes(currentUser.uid);
                    const isMe = update.user === currentUser.email;
                    
                    return (
                        <div key={index} className={`flex gap-3 ${isMentioned ? 'animate-pulse-once' : ''}`}>
                            <div className="mt-1 flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border 
                                    ${isMentioned ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {isMentioned ? <AtSign size={14} /> : <User size={14} />}
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className={`p-4 rounded-2xl shadow-sm border relative group
                                    ${isMentioned ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                    
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{update.text}</p>
                                    
                                    {/* Ack Button */}
                                    {isMentioned && (
                                        <button 
                                            onClick={() => handleAcknowledge(index)}
                                            className="absolute -top-2 -right-2 bg-white text-amber-500 hover:text-amber-600 p-1 rounded-full shadow-sm border border-amber-100"
                                            title="Acknowledge"
                                        >
                                            <CheckCircle2 size={18} fill="currentColor" className="text-white bg-amber-500 rounded-full"/>
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1.5 ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                    <span className="truncate max-w-[120px]">{isMe ? 'You' : update.user?.split('@')[0]}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 font-normal normal-case">
                                      <Clock size={10} /> {formatTimestamp(update.timestamp)}
                                    </span>
                                    <button onClick={() => handleShareNote(update.text)} className="ml-auto p-1 hover:text-teal-600 transition-colors"><Share size={10} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Input Area */}
        {canAddNote ? (
          <form onSubmit={handleAddNote} className="p-4 border-t border-slate-100 bg-slate-50/50">
            {showTagMenu && (
                <div className="absolute bottom-20 left-6 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 animate-in slide-in-from-bottom-2 z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Mention Member</p>
                    {members.map(m => (
                        <button 
                          key={m.id} 
                          type="button" 
                          onClick={() => toggleTag(m)} 
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${taggedUsers.includes(m.id) ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                            <span>{m.name}</span>
                            {taggedUsers.includes(m.id) && <CheckCircle2 size={12}/>}
                        </button>
                    ))}
                </div>
            )}
            <div className="relative flex items-end gap-2 bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all shadow-sm">
                <button 
                    type="button" 
                    onClick={() => setShowTagMenu(!showTagMenu)} 
                    className={`p-2.5 rounded-xl transition-colors shrink-0 ${taggedUsers.length > 0 ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`} 
                    title="Tag someone"
                >
                    <AtSign size={18} />
                </button>
                
                <textarea 
                  rows="1" 
                  value={newNote} 
                  onChange={(e) => { setNewNote(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                  placeholder="Add a note..." 
                  className="w-full py-3 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 text-slate-700 placeholder:text-slate-400" 
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(e); } }}
                ></textarea>
                
                <button 
                    type="submit" 
                    disabled={loading || !newNote.trim()} 
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                >
                    <Send size={16} />
                </button>
            </div>
          </form>
        ) : ( 
          <div className="p-4 bg-slate-50 text-center border-t border-slate-100 text-xs text-slate-400">Read-only view</div> 
        )}
      </div>
    </div>
  );
}

export default TaskHistoryModal;
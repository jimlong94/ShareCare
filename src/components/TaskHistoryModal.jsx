// src/components/TaskHistoryModal.jsx - FINAL FIX for Dynamic Update

import React, { useState } from 'react';
import './NewTaskModal.css';
import { useAuth } from '../AuthContext'; 
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

function TaskHistoryModal({ onClose, task, currentUserRole }) {
  const { currentUser } = useAuth(); 
  
  // --- NEW LOCAL STATE FOR HISTORY ---
  // Initialize with the prop data. This is what the component will render.
  const [notesHistory, setNotesHistory] = useState(task.updates || []);
  // ----------------------------------

  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  // Removed refreshKey, as we no longer need to force a prop update.

  const canAddNote = currentUserRole === 'Admin' || currentUserRole === 'Editor';

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);

    try {
      const taskRef = doc(db, "tasks", task.id);
      
      const newUpdateEntry = {
        type: 'note',
        text: newNote.trim(),
        timestamp: new Date(),
        user: currentUser.email,
      };

      // 1. Write the new note to the database (asynchronously)
      await updateDoc(taskRef, {
        updates: arrayUnion(newUpdateEntry)
      });

      // 2. CRITICAL FIX: Update the local state immediately after successful database write.
      // This forces the modal to render the new note without waiting for the slow prop update.
      setNotesHistory(prev => [...prev, newUpdateEntry]); 
      
      setNewNote('');
      
    } catch (e) {
      console.error("Error adding note:", e);
      alert("Failed to add note.");
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (timestamp?.toDate) {
        return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task History: {task.title}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingBottom: '1rem' }}>
          
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '1rem', marginTop: 0 }}>
              Updates
          </h3>
          
          <ul className="task-history-list" style={{ listStyle: 'none', padding: 0 }}>
            {/* 👈 RENDER FROM LOCAL STATE */}
            {notesHistory.map((update, index) => (
              <li 
                key={index} 
                style={{ marginBottom: '10px', borderLeft: '3px solid var(--color-accent)', paddingLeft: '10px', fontSize: '0.9rem' }}
              >
                <div style={{ fontWeight: 'bold' }}>
                    {update.text}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#777' }}>
                    By {update.user || task.createdBy} on {formatTimestamp(update.timestamp)}
                </div>
              </li>
            ))}
            {notesHistory.length === 0 && <p>No history yet.</p>}
          </ul>

        </div>

        {canAddNote ? (
          <form onSubmit={handleAddNote} className="modal-form" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <div className="form-group">
              <label htmlFor="new-note">Add New Note</label>
              <textarea
                id="new-note"
                rows="2"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your update here..."
              ></textarea>
            </div>

            <div className="modal-footer" style={{ marginTop: '0.5rem', padding: 0 }}>
              <button type="submit" className="btn btn-primary" disabled={loading || !newNote.trim()}>
                {loading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        ) : (
             <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                 <p style={{ margin: 0, color: '#777' }}>View-only mode: Only Admins or Editors can add new notes.</p>
             </div>
        )}
      </div>
    </div>
  );
}

export default TaskHistoryModal;
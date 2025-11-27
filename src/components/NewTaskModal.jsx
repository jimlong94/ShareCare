// src/components/NewTaskModal.jsx - UPDATED

import { useState, useEffect } from 'react'
import { X } from 'lucide-react' 

function NewTaskModal({ onClose, onSave, members, task }) {
  
  // --- Initialization ---
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setAssigneeId(task.assigneeId || '') // Default to ID if available
      setAssigneeName(task.assignee || '')
      setCategory(task.category || 'Appointment')
      setStatus(task.status || 'Delegated')
      setNotes(task.updates?.[0]?.text || '') 
      setDueDate(task.dueDate || '')
    }
  }, [task]);

  const [title, setTitle] = useState(task ? task.title : '')
  const [assigneeId, setAssigneeId] = useState('') 
  const [assigneeName, setAssigneeName] = useState('') 
  const [category, setCategory] = useState(task ? task.category : 'Appointment')
  const [status, setStatus] = useState(task ? task.status : 'Delegated')
  const [notes, setNotes] = useState(task ? (task.updates?.[0]?.text || '') : '') 
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '') 

  const handleAssigneeChange = (e) => {
    const selectedId = e.target.value;
    setAssigneeId(selectedId);
    
    // Find name based on ID
    const member = members.find(m => m.id === selectedId);
    setAssigneeName(member ? member.name : 'Unknown');
  };

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title || !assigneeId) {
      alert('Please fill in at least the Title and Assignee.')
      return
    }

    let finalUpdates = task ? [...task.updates] : [];
    if (task) {
        if (finalUpdates.length > 0 && finalUpdates[0].text !== notes) {
            finalUpdates[0].text = notes; 
        }
    } else {
        finalUpdates = notes ? [{ type: 'note', text: notes, timestamp: new Date() }] : [];
    }

    const submittedTask = {
      ...(task && { id: task.id }),
      title,
      assignee: assigneeName, // Save Name for display
      assigneeId: assigneeId, // Save ID for logic
      category,
      status,
      dueDate, 
      updates: finalUpdates,
    }

    onSave(submittedTask)
  }

  // Styles
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-teal-600 tracking-tight">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="task-form" className="flex flex-col gap-5" onSubmit={handleSubmit}>
            
            <div>
              <label className={labelClass}>Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Pick up prescription"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ASSIGNEE DROPDOWN */}
              <div>
                <label className={labelClass}>Assign To</label>
                <select
                  value={assigneeId}
                  onChange={handleAssigneeChange}
                  className={inputClass}
                >
                  <option value="">Select Member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  <option value="Appointment">Appointment</option>
                  <option value="Household">Household</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  <option value="Delegated">Delegated</option>
                  <option value="In progress">In progress</option>
                  <option value="Waiting">Waiting</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Initial Note</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder="Add details here..."
              ></textarea>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-card">
          <button type="button" className="px-5 py-2.5 rounded-btn font-semibold text-slate-500 hover:bg-slate-200 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="task-form" className="px-6 py-2.5 rounded-btn font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-soft transition-transform active:scale-95">
            {task ? 'Update Task' : 'Save Task'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewTaskModal
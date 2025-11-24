// src/components/NewTaskModal.jsx - TAILWIND EDITION

import { useState, useEffect } from 'react'
import { X } from 'lucide-react' // Using the icon for the close button

function NewTaskModal({ onClose, onSave, assignees, task }) {
  
  // --- Initialization Logic ---
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setAssignee(task.assignee || '')
      setCategory(task.category || 'Appointment')
      setStatus(task.status || 'Delegated')
      setNotes(task.updates?.[0]?.text || '') 
      setDueDate(task.dueDate || '')
    }
  }, [task]);

  // --- State ---
  const [title, setTitle] = useState(task ? task.title : '')
  const [assignee, setAssignee] = useState(task ? task.assignee : '')
  const [category, setCategory] = useState(task ? task.category : 'Appointment')
  const [status, setStatus] = useState(task ? task.status : 'Delegated')
  const [notes, setNotes] = useState(task ? (task.updates?.[0]?.text || '') : '') 
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '') 

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title || !assignee) {
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
      assignee,
      category,
      status,
      dueDate, 
      updates: finalUpdates,
    }

    onSave(submittedTask)
  }

  const modalTitle = task ? 'Edit Task' : 'New Task';
  const saveButtonText = task ? 'Update Task' : 'Save Task';

  // --- STYLES (Tailwind Utility Classes) ---
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-card shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-teal-600 tracking-tight">{modalTitle}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="task-form" className="flex flex-col gap-5" onSubmit={handleSubmit}>
            
            {/* Title */}
            <div>
              <label htmlFor="task-title" className={labelClass}>Task Title</label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Pick up prescription"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Assignee */}
              <div>
                <label htmlFor="task-assignee" className={labelClass}>Assign To</label>
                <input
                  id="task-assignee"
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  list="assignee-list"
                  className={inputClass}
                  placeholder="Select..."
                />
                <datalist id="assignee-list">
                  {assignees.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="task-category" className={labelClass}>Category</label>
                <select
                  id="task-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="Appointment">Appointment</option>
                  <option value="Household">Household</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Status */}
              <div>
                <label htmlFor="task-status" className={labelClass}>Status</label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="Delegated">Delegated</option>
                  <option value="In progress">In progress</option>
                  <option value="Waiting">Waiting</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="task-due-date" className={labelClass}>Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="task-notes" className={labelClass}>Initial Note / Details</label>
              <textarea
                id="task-notes"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder={task ? "Editing the initial detail note." : "Add details here..."}
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-card">
          <button
            type="button"
            className="px-5 py-2.5 rounded-btn font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="task-form"
            className="px-6 py-2.5 rounded-btn font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-soft transition-transform active:scale-95"
          >
            {saveButtonText}
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewTaskModal
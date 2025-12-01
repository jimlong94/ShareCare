// src/components/NewTaskModal.jsx
import { useState, useEffect } from 'react'
import { X, Calendar, User, Tag, Clock, AlignLeft } from 'lucide-react' 
import { useAuth } from '../AuthContext';

function NewTaskModal({ onClose, onSave, members, task }) {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setAssigneeId(task.assigneeId || '') 
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
      finalUpdates = notes ? [{ 
          type: 'note', 
          text: notes, 
          timestamp: new Date(),
          user: currentUser.email 
      }] : [];
    }
    const submittedTask = {
      ...(task && { id: task.id }),
      title,
      assignee: assigneeName, 
      assigneeId: assigneeId, 
      category,
      status,
      dueDate, 
      updates: finalUpdates,
    }
    onSave(submittedTask)
  }

  // Styles
  const inputBase = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400";
  const iconLabel = "flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{task ? 'Edit Task' : 'New Task'}</h2>
            <p className="text-xs text-slate-400 font-medium">Fill in the details below.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="task-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
            
            <div>
              <label className={iconLabel}>Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputBase} font-semibold text-lg`}
                placeholder="e.g. Mom's Cardiology Appt"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={iconLabel}><User size={14}/> Assign To</label>
                <div className="relative">
                    <select value={assigneeId} onChange={handleAssigneeChange} className={`${inputBase} appearance-none cursor-pointer`}>
                    <option value="">Select...</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div>
                <label className={iconLabel}><Tag size={14}/> Category</label>
                <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputBase} appearance-none cursor-pointer`}>
                    <option value="Appointment">Appointment</option>
                    <option value="Household">Household</option>
                    <option value="Misc">Misc</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={iconLabel}><Clock size={14}/> Status</label>
                <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputBase} appearance-none cursor-pointer`}>
                    <option value="Delegated">Delegated</option>
                    <option value="In progress">In progress</option>
                    <option value="Waiting">Waiting</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div>
                <label className={iconLabel}><Calendar size={14}/> Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputBase} />
              </div>
            </div>

            <div>
              <label className={iconLabel}><AlignLeft size={14}/> Initial Note</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputBase} resize-none`}
                placeholder="Add logistical details here (No medical data)..."
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-3xl">
          <button 
            type="button" 
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="task-form" 
            className="px-8 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200 transition-transform active:scale-95"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewTaskModal
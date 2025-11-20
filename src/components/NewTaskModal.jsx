// src/components/NewTaskModal.jsx - UPDATED for DueDate

import { useState } from 'react'
import './NewTaskModal.css'

// Get the new props (onSave, assignees)
function NewTaskModal({ onClose, onSave, assignees }) {
  // --- UPDATED STATE ---
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [category, setCategory] = useState('Appointment')
  const [status, setStatus] = useState('Delegated')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('') // 👈 NEW STATE
  // ---------------------

  const handleSubmit = (e) => {
    e.preventDefault()

    // Simple validation
    if (!title || !assignee) {
      alert('Please fill in at least the Title and Assignee.')
      return
    }

    // Create the new task object
    const newTask = {
      // We no longer need a client-side ID as Firestore provides it
      title,
      assignee,
      category,
      status,
      // 👈 NEW: dueDate is saved (can be an empty string if not set)
      dueDate: dueDate, 
      // 👈 UPDATED: notes is packaged as the first item in the 'updates' array
      updates: notes ? [{ type: 'note', text: notes, timestamp: new Date() }] : [],
    }

    // Pass the new task object up to App.jsx
    onSave(newTask)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Task Title */}
          <div className="form-group">
            <label htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row">
            {/* Assignee */}
            <div className="form-group">
              <label htmlFor="task-assignee">Assign To</label>
              <input
                id="task-assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                list="assignee-list"
                placeholder="Type or select a name"
              />
              <datalist id="assignee-list">
                {assignees.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="task-category">Category</label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Appointment">Appointment</option>
                <option value="Household">Household</option>
                <option value="Misc">Misc</option>
              </select>
            </div>
          </div>

          <div className="form-row"> {/* 👈 NEW ROW for Status and DueDate */}
            {/* Status */}
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Delegated">Delegated</option>
                <option value="In progress">In progress</option>
                <option value="Waiting">Waiting</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>


          {/* Notes (Updated to be Task History starting point) */}
          <div className="form-group">
            <label htmlFor="task-notes">Initial Note / Details</label>
            <textarea
              id="task-notes"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTaskModal
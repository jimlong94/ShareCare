// src/components/NewTaskModal.jsx - UPDATED for Edit Mode

import { useState, useEffect } from 'react' // 👈 NEW IMPORT: useEffect
import './NewTaskModal.css'

// task prop is now optional for editing
function NewTaskModal({ onClose, onSave, assignees, task }) { // 👈 NEW PROP
  
  // --- Initialization Logic ---
  // Use useEffect to initialize state from the 'task' prop when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setAssignee(task.assignee || '')
      setCategory(task.category || 'Appointment')
      setStatus(task.status || 'Delegated')
      // Notes are read from the first entry in the updates array (for display)
      setNotes(task.updates?.[0]?.text || '') 
      setDueDate(task.dueDate || '')
    }
  }, [task]);
  // --------------------------

  // --- State for Edit/Create ---
  const [title, setTitle] = useState(task ? task.title : '')
  const [assignee, setAssignee] = useState(task ? task.assignee : '')
  const [category, setCategory] = useState(task ? task.category : 'Appointment')
  const [status, setStatus] = useState(task ? task.status : 'Delegated')
  // For editing, populate notes from the first update entry, otherwise empty
  const [notes, setNotes] = useState(task ? (task.updates?.[0]?.text || '') : '') 
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '') 
  // -----------------------------


  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title || !assignee) {
      alert('Please fill in at least the Title and Assignee.')
      return
    }

    // Determine the updates array structure:
    let finalUpdates = task ? [...task.updates] : [];

    if (task) {
        // EDIT MODE: Update the first note entry if the notes text changed
        if (finalUpdates.length > 0 && finalUpdates[0].text !== notes) {
            finalUpdates[0].text = notes; // Overwrite the existing note text
            // NOTE: For true history, we would push a new note here, but for MVP edit simplicity, we overwrite the initial note.
        }
    } else {
        // CREATE MODE: Package notes as the first item in the 'updates' array
        finalUpdates = notes ? [{ type: 'note', text: notes, timestamp: new Date() }] : [];
    }

    // Create the task object (includes ID if editing)
    const submittedTask = {
      ...(task && { id: task.id }), // Include ID only if editing
      title,
      assignee,
      category,
      status,
      dueDate, 
      updates: finalUpdates,
    }

    // Pass the task object up to App.jsx for saving/updating
    onSave(submittedTask)
  }

  // Determine modal title
  const modalTitle = task ? 'Edit Task' : 'New Task';
  const saveButtonText = task ? 'Update Task' : 'Save Task';


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{modalTitle}</h2> {/* 👈 DYNAMIC TITLE */}
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Task Title, Assignee, Category, Status, Due Date inputs remain the same */}
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

          <div className="form-row">
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

          {/* Notes (Initial Note / Details) */}
          <div className="form-group">
            <label htmlFor="task-notes">Initial Note / Details</label>
            <textarea
              id="task-notes"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              // Display a warning if it's an existing note
              placeholder={task ? "Editing the initial detail note." : ""}
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
              {saveButtonText} {/* 👈 DYNAMIC BUTTON TEXT */}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTaskModal
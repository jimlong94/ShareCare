import { useState } from 'react' // Import useState
import './NewTaskModal.css'

// Get the new props (onSave, assignees)
function NewTaskModal({ onClose, onSave, assignees }) {
  // --- NEW ---
  // State for each form field
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [category, setCategory] = useState('Appointment') // Default
  const [status, setStatus] = useState('Delegated') // Default
  const [notes, setNotes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault() // Stop the page from reloading

    // Simple validation
    if (!title || !assignee) {
      alert('Please fill in at least the Title and Assignee.')
      return
    }

    // Create the new task object
    const newTask = {
      id: Date.now(), // Simple unique ID
      title,
      assignee,
      category,
      status,
      notes,
    }

    // Pass the new task object up to App.jsx
    onSave(newTask)
  }
  // --- END NEW ---

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* --- UPDATED --- */}
        {/* Add the onSubmit handler to the form */}
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
            {/* Assignee - Changed to input + datalist */}
            <div className="form-group">
              <label htmlFor="task-assignee">Assign To</label>
              <input
                id="task-assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                list="assignee-list" // Connects to datalist
                placeholder="Type or select a name"
              />
              <datalist id="assignee-list">
                {assignees.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            {/* Category - Updated options */}
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

          {/* Status - Updated options */}
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

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="task-notes">Notes</label>
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
        {/* --- END UPDATED --- */}
      </div>
    </div>
  )
}

export default NewTaskModal
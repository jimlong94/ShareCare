import { useState } from 'react'
import './App.css'
import NewTaskModal from './components/NewTaskModal'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // --- NEW ---
  // Master list of tasks
  const [tasks, setTasks] = useState([])
  // Master list of assignees (with defaults)
  const [assignees, setAssignees] = useState([
    'Shelley',
    'Sister 1',
    'Niece 1',
  ])

  // Function to save the new task
  const handleAddTask = (newTask) => {
    // Add the new task to the top of the list
    setTasks([newTask, ...tasks])

    // Check if the assignee is new and add them to the list
    if (!assignees.includes(newTask.assignee)) {
      setAssignees([...assignees, newTask.assignee])
    }
    
    // Close the modal
    setIsModalOpen(false)
  }
  // --- END NEW ---

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ShareCare</h1>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Task
        </button>
      </header>

      <main className="task-list-container">
        <h2>Tasks</h2>
        
        {/* --- UPDATED --- */}
        {/* Show task list or empty message */}
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <p>No tasks yet. Get started by adding one!</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <strong>{task.title}</strong> (Assigned to: {task.assignee})
              </li>
            ))}
          </ul>
        )}
        {/* --- END UPDATED --- */}
      </main>

      {/* --- UPDATED --- */}
      {/* Pass the new props to the modal */}
      {isModalOpen && (
        <NewTaskModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddTask}
          assignees={assignees} 
        />
      )}
    </div>
  )
}

export default App
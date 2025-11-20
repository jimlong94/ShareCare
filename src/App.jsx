// App.jsx - UPDATED with Invite Modal Integration

import { useState, useEffect } from 'react';
import './App.css';
import NewTaskModal from './components/NewTaskModal';
import Auth from './components/Auth';
import HipaaModal from './components/HipaaModal';
import InviteModal from './components/InviteModal'; // 👈 NEW IMPORT
import { useAuth } from './AuthContext';
import { db } from './firebase'; 
import { 
  collection, 
  addDoc, 
  query,          
  orderBy,        
  onSnapshot,
} from 'firebase/firestore'; 

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // 👈 NEW STATE
  const [tasks, setTasks] = useState([]); 
  const [assignees, setAssignees] = useState(['Shelley', 'Sister 1', 'Niece 1']);
  
  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // Firestore Real-time Listener (Existing)
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      // NOTE: We should eventually filter by groupId here: where("groupId", "==", currentGroupId)
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray = [];
        querySnapshot.forEach((doc) => {
          tasksArray.push({ id: doc.id, ...doc.data() });
        });
        setTasks(tasksArray);
      });
      return () => unsubscribe();
    }
  }, [currentUser, hasAcceptedHipaa, currentGroupId]); 

  // handleAddTask function (Existing)
  const handleAddTask = async (newTask) => {
    if (!hasAcceptedHipaa) {
        alert("You must agree to the HIPAA terms before adding tasks.");
        return;
    }
    
    if (!currentGroupId) {
        alert("System not initialized. Group ID is missing.");
        return;
    }

    try {
      const taskToSave = {
        title: newTask.title,
        assignee: newTask.assignee,
        category: newTask.category,
        status: newTask.status,
        dueDate: newTask.dueDate, 
        updates: newTask.updates, 
        createdBy: currentUser.email,
        createdAt: new Date(),
        groupId: currentGroupId,
      };
      
      await addDoc(collection(db, "tasks"), taskToSave);

      if (!assignees.includes(newTask.assignee)) {
        setAssignees([...assignees, newTask.assignee])
      }
      
      setIsTaskModalOpen(false)

    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save task. Check console for details.");
    }
  }
  
  // --- CONDITIONAL RENDERING ---
  
  if (currentUser && hasAcceptedHipaa === false) {
    return <HipaaModal />;
  }
  
  if (!currentUser) {
    return <Auth />;
  }
  
  // Show main app 
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ShareCare</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Role: {currentUserRole}</span>
          
          {/* Admin/Editor Feature: Invite Button */}
          {currentUserRole === 'Admin' && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsInviteModalOpen(true)} // 👈 OPEN MODAL
              title="Invite new users to your hub"
            >
              Invite
            </button>
          )}

          <button className="btn btn-secondary" onClick={logout}> 
            Log Out
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsTaskModalOpen(true)}
          >
            + Add Task
          </button>
        </div>
      </header>

      <main className="task-list-container">
        <h2>Tasks (Hub ID: {currentGroupId} | Role: {currentUserRole})</h2> 
        
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <p>No tasks yet. Get started by adding one!</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <div className="task-header">
                    <div className="task-title-group">
                        <strong className="task-title">{task.title}</strong>
                        {task.dueDate && (
                            <span className="task-due-date">Due: {task.dueDate}</span>
                        )}
                    </div>
                    <span 
                        className={`task-status status-${task.status.toLowerCase().replace(/\s/g, '-')}`}
                    >
                        {task.status}
                    </span>
                </div>
                
                <div className="task-details">
                    <p className="task-assignee">Assigned to: <strong>{task.assignee}</strong></p>
                    <p className="task-category">Category: {task.category}</p>
                </div>
                
                {task.updates && task.updates.length > 0 && task.updates[0]?.text && (
                    <div className="task-notes-preview">
                        <p>Latest Note: {task.updates[0].text}</p>
                    </div>
                )}
                
                {/* Task Actions (Placeholder for PRD requirement) */}
                <div className="task-actions-placeholder">
                    {/* The Edit button is now permission-aware! */}
                    {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                        <button className="btn btn-secondary btn-small">Edit</button>
                    )}
                </div>

              </li>
            ))}
          </ul>
        )}
      </main>

      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <span style={{ 
              fontWeight: 'bold', 
              color: 'var(--color-success)', 
              backgroundColor: '#e6ffe6', 
              padding: '4px 8px', 
              borderRadius: '4px' 
          }}>
              ✅ HIPAA Disclaimer Acknowledged 
          </span>
      </footer>

      {isTaskModalOpen && (
        <NewTaskModal
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleAddTask}
          assignees={assignees} 
        />
      )}

      {/* NEW: Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal
          onClose={() => setIsInviteModalOpen(false)}
          currentGroupId={currentGroupId}
        />
      )}
    </div>
  )
}

export default App
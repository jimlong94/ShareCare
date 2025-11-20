// App.jsx - UPDATED with Task History Modal Integration

import { useState, useEffect } from 'react';
import './App.css';
import NewTaskModal from './components/NewTaskModal';
import Auth from './components/Auth';
import HipaaModal from './components/HipaaModal';
import InviteModal from './components/InviteModal'; 
import TaskHistoryModal from './components/TaskHistoryModal'; // 👈 NEW IMPORT
import { useAuth } from './AuthContext';
import { db } from './firebase'; 
import { 
  collection, 
  addDoc, 
  query,          
  orderBy,        
  onSnapshot,
  doc,             
  updateDoc,       
} from 'firebase/firestore'; 

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [tasks, setTasks] = useState([]); 
  const [assignees, setAssignees] = useState(['Shelley', 'Sister 1', 'Niece 1']);
  
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null); // 👈 NEW STATE for history modal
  
  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // Firestore Real-time Listener (Existing)
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
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

  // Function to open Task History Modal on click
  const handleTaskClick = (task) => {
      setTaskToView(task);
  };
  
  const handleEditClick = (task) => {
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Editor') {
        alert("Permission Denied: Only Admins and Editors can edit tasks.");
        return;
    }
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null); // Reset edit state on close
  };

  // UPDATED: Handles both Add and Update 
  const handleSave = async (submittedTask) => {
    if (!hasAcceptedHipaa || !currentGroupId) return;

    try {
      const dataToSave = {
        title: submittedTask.title,
        assignee: submittedTask.assignee,
        category: submittedTask.category,
        status: submittedTask.status,
        dueDate: submittedTask.dueDate, 
        updates: submittedTask.updates, 
      };
      
      if (submittedTask.id) {
        // EDIT MODE
        const taskRef = doc(db, "tasks", submittedTask.id);
        await updateDoc(taskRef, dataToSave);
      } else {
        // CREATE MODE
        await addDoc(collection(db, "tasks"), {
          ...dataToSave,
          createdBy: currentUser.email,
          createdAt: new Date(),
          groupId: currentGroupId,
        });
      }

      if (!assignees.includes(submittedTask.assignee)) {
        setAssignees([...assignees, submittedTask.assignee]);
      }
      
      handleCloseTaskModal();

    } catch (e) {
      console.error(`Error ${submittedTask.id ? 'updating' : 'adding'} document: `, e);
      alert(`Failed to ${submittedTask.id ? 'update' : 'save'} task. Check console for details.`);
    }
  };
  
  // --- CONDITIONAL RENDERING (Remains the same) ---
  
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
              
              {currentUserRole === 'Admin' && currentGroupId && (
                  <button
                      className="btn btn-secondary"
                      onClick={() => setIsInviteModalOpen(true)}
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
                  onClick={() => {
                    setTaskToEdit(null); 
                    setIsTaskModalOpen(true);
                  }}
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
              // 👈 WIRE UP: Task item now responds to click to view history
              <li 
                key={task.id} 
                className="task-item"
                onClick={() => handleTaskClick(task)} // Opens history modal
                style={{ cursor: 'pointer' }} // Add visual cue
              >
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
                
                {/* Task Actions: Moved Edit button outside of main click target */}
                <div className="task-actions-placeholder" onClick={(e) => e.stopPropagation()}>
                    {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                        <button 
                            className="btn btn-secondary btn-small"
                            onClick={() => handleEditClick(task)} 
                        >
                            Edit
                        </button>
                    )}
                </div>

              </li>
            ))}
          </ul>
        )}
      </main>
      
      {/* Footer and Modals */}
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
          onClose={handleCloseTaskModal}
          onSave={handleSave} 
          assignees={assignees} 
          task={taskToEdit} 
        />
      )}

      {isInviteModalOpen && (
        <InviteModal
          onClose={() => setIsInviteModalOpen(false)}
          currentGroupId={currentGroupId}
        />
      )}
      
      {/* 👈 NEW HISTORY MODAL */}
      {taskToView && (
          <TaskHistoryModal
            onClose={() => setTaskToView(null)}
            task={taskToView}
            currentUserRole={currentUserRole}
          />
      )}
    </div>
  )
}

export default App
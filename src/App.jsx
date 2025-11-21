// src/App.jsx - FINAL COMPLETE VERSION (Includes Filter, Sort, Edit, and Delete)

import { useState, useEffect } from 'react';
import './App.css';
import NewTaskModal from './components/NewTaskModal';
import Auth from './components/Auth';
import HipaaModal from './components/HipaaModal';
import InviteModal from './components/InviteModal'; 
import TaskHistoryModal from './components/TaskHistoryModal';
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
  where,           
  deleteDoc,       // 👈 CRITICAL FOR DELETE
} from 'firebase/firestore'; 

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [tasks, setTasks] = useState([]); 
  
  // --- STATE FOR CONTROLS ---
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('createdAt'); 
  const [sortDirection, setSortDirection] = useState('desc'); 
  // --------------------------

  const [assignees, setAssignees] = useState([
    'Shelley', 
    'Sister 1', 
    'Niece 1',
  ]);
  
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null);
  
  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // --- Firestore Real-time Listener (Dynamic Query) ---
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      
      let tasksCollectionRef = collection(db, "tasks");
      let q = query(tasksCollectionRef);

      // 1. APPLY FILTERS (where clauses)
      if (filterAssignee !== 'All') {
          q = query(q, where('assignee', '==', filterAssignee));
      }
      if (filterCategory !== 'All') {
          q = query(q, where('category', '==', filterCategory));
      }
      if (filterStatus !== 'All') {
          q = query(q, where('status', '==', filterStatus));
      }
      
      // 2. APPLY SORTING (orderBy clause)
      q = query(q, orderBy(sortField, sortDirection));

      // 3. Run the listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray = [];
        const currentAssignees = new Set(assignees);

        querySnapshot.forEach((d) => {
          const taskData = d.data();
          tasksArray.push({ id: d.id, ...taskData });
          
          // Dynamically update assignee list
          if (taskData.assignee && !currentAssignees.has(taskData.assignee)) {
            currentAssignees.add(taskData.assignee);
          }
        });
        
        const newAssigneesArray = Array.from(currentAssignees);
        if (newAssigneesArray.length !== assignees.length) {
            setAssignees(newAssigneesArray);
        }
        
        setTasks(tasksArray);
      });
      return () => unsubscribe();
    }
    
  }, [currentUser, hasAcceptedHipaa, currentGroupId, filterAssignee, filterCategory, filterStatus, sortField, sortDirection, assignees.length]); // Added assignees.length to dependencies

  // --- Functionality Handlers ---
  
  const handleTaskClick = (task) => { setTaskToView(task); };
  
  const handleEditClick = (task) => {
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Editor') {
        alert("Permission Denied: Only Admins and Editors can edit tasks.");
        return;
    }
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  
  const handleDelete = async (taskId, taskTitle) => {
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Editor') {
        alert("Permission Denied: Only Admins and Editors can delete tasks.");
        return;
    }

    if (!window.confirm(`Are you sure you want to delete the task: "${taskTitle}"? This cannot be undone.`)) {
        return;
    }
    
    try {
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
        alert("Failed to delete task. Check console for details.");
    }
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
  };

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
        const taskRef = doc(db, "tasks", submittedTask.id);
        await updateDoc(taskRef, dataToSave);
      } else {
        await addDoc(collection(db, "tasks"), {
          ...dataToSave,
          createdBy: currentUser.email,
          createdAt: new Date(),
          groupId: currentGroupId,
        });
      }
      
      handleCloseTaskModal();

    } catch (e) {
      console.error(`Error ${submittedTask.id ? 'updating' : 'adding'} document: `, e);
      alert(`Failed to ${submittedTask.id ? 'update' : 'save'} task. Check console for details.`);
    }
  };
  
  // --- Dropdown/Rendering Data ---
  if (currentUser && hasAcceptedHipaa === false) {
    return <HipaaModal />;
  }
  
  if (!currentUser) {
    return <Auth />;
  }
  
  const uniqueAssignees = ['All', ...assignees.filter(a => a)]; 
  const categories = ['All', 'Appointment', 'Household', 'Misc'];
  const statuses = ['All', 'Delegated', 'In progress', 'Waiting'];
  
  // --- Render ---
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
        {/* --- Task Controls UI --- */}
        <div className="task-controls">
            {/* Filter Assignee */}
            <div className="control-group">
                <label htmlFor="filter-assignee">Filter By:</label>
                <select
                    id="filter-assignee"
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                >
                    {uniqueAssignees.map(a => (
                        <option key={a} value={a}>{a === 'All' ? 'Assignee (All)' : a}</option>
                    ))}
                </select>
            </div>
            
            {/* Filter Category */}
            <div className="control-group">
                <select
                    id="filter-category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    {categories.map(c => (
                         <option key={c} value={c}>{c === 'All' ? 'Category (All)' : c}</option>
                    ))}
                </select>
            </div>

            {/* Sort Controls */}
            <div className="control-group">
                <label htmlFor="sort-field">Sort By:</label>
                <select
                    id="sort-field"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                >
                    <option value="createdAt">Date Created</option>
                    <option value="dueDate">Due Date</option>
                    <option value="assignee">Assignee Name</option>
                </select>
            </div>
             <div className="control-group">
                <select
                    id="sort-direction"
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value)}
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
        {/* --- END: Task Controls UI --- */}


        <h2>Tasks (Hub ID: {currentGroupId} | Role: {currentUserRole})</h2> 
        
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <p>No tasks yet. Get started by adding one!</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="task-item"
                onClick={() => handleTaskClick(task)} 
                style={{ cursor: 'pointer' }} 
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
                
                {/* Task Actions (WIRED DELETE BUTTON) */}
                <div className="task-actions-placeholder" onClick={(e) => e.stopPropagation()}>
                    {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                        <>
                            <button 
                                className="btn btn-secondary btn-small"
                                onClick={() => handleEditClick(task)} 
                                style={{ marginRight: '8px' }}
                            >
                                Edit
                            </button>
                            <button 
                                className="btn btn-danger btn-small"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleDelete(task.id, task.title);
                                }}
                                style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-white)' }}
                            >
                                Delete
                            </button>
                        </>
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
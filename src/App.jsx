// src/App.jsx - TAILWIND EDITION

import { useState, useEffect } from 'react';
import NewTaskModal from './components/NewTaskModal';
import Auth from './components/Auth';
import OnboardingWizard from './components/OnboardingWizard';
import InviteModal from './components/InviteModal'; 
import TaskHistoryModal from './components/TaskHistoryModal';
import KeyInfo from './components/KeyInfo'; 
import WellnessCenter from './components/WellnessCenter';
import TaskCard from './components/TaskCard'; 

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
  deleteDoc,       
} from 'firebase/firestore'; 

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [tasks, setTasks] = useState([]); 
  
  // Navigation & View State
  const [currentView, setCurrentView] = useState('tasks'); 
  
  // Filter & Sort State
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('createdAt'); 
  const [sortDirection, setSortDirection] = useState('desc'); 

  const [assignees, setAssignees] = useState(['Shelley', 'Sister 1', 'Niece 1']);
  
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null);
  
  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // --- Real-time Listener ---
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      
      let tasksCollectionRef = collection(db, "tasks");
      let q = query(tasksCollectionRef, where('groupId', '==', currentGroupId)); 

      if (filterAssignee !== 'All') q = query(q, where('assignee', '==', filterAssignee));
      if (filterCategory !== 'All') q = query(q, where('category', '==', filterCategory));
      if (filterStatus !== 'All') q = query(q, where('status', '==', filterStatus));
      
      q = query(q, orderBy(sortField, sortDirection));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray = [];
        const assigneeSet = new Set(assignees);

        querySnapshot.forEach((d) => {
          const taskData = d.data();
          tasksArray.push({ id: d.id, ...taskData });
          if (taskData.assignee && !assigneeSet.has(taskData.assignee)) {
            assigneeSet.add(taskData.assignee);
          }
        });
        
        if (assigneeSet.size !== assignees.length) {
            setAssignees(Array.from(assigneeSet));
        }
        setTasks(tasksArray);
      });
      return () => unsubscribe();
    }
  }, [currentUser, hasAcceptedHipaa, currentGroupId, filterAssignee, filterCategory, filterStatus, sortField, sortDirection, assignees.length]); 

  // --- Handlers ---
  const handleTaskClick = (task) => { setTaskToView(task); };
  
  const handleEditClick = (task) => {
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Editor') {
        alert("Permission Denied"); return;
    }
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  
  const handleDelete = async (taskId, taskTitle) => {
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Editor') {
        alert("Permission Denied"); return;
    }
    if (!window.confirm(`Delete "${taskTitle}"?`)) return;
    try { await deleteDoc(doc(db, "tasks", taskId)); } 
    catch (e) { console.error(e); alert("Failed to delete task."); }
  };
  
  const handleCloseTaskModal = () => { setIsTaskModalOpen(false); setTaskToEdit(null); };

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
        await updateDoc(doc(db, "tasks", submittedTask.id), dataToSave);
      } else {
        await addDoc(collection(db, "tasks"), {
          ...dataToSave,
          createdBy: currentUser.email,
          createdAt: new Date(),
          groupId: currentGroupId,
        });
      }
      handleCloseTaskModal();
    } catch (e) { console.error(e); alert("Save failed."); }
  };
  
  // --- Render ---
  if (currentUser && hasAcceptedHipaa === false) return <OnboardingWizard />;
  if (!currentUser) return <Auth />;
  
  const uniqueAssignees = ['All', ...assignees.filter(a => a)]; 
  const categories = ['All', 'Appointment', 'Household', 'Misc'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Title & Nav */}
            <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
              <h1 className="text-2xl font-bold text-teal-600 tracking-tight">ShareCare</h1>
              
              {/* Navigation Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {['tasks', 'keyinfo', 'wellness'].map(view => (
                    <button 
                      key={view}
                      onClick={() => setCurrentView(view)}
                      className={`
                        px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all duration-200
                        ${currentView === view 
                          ? 'bg-white text-teal-700 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                      `}
                    >
                      {view === 'keyinfo' ? 'Key Info' : view}
                    </button>
                ))}
              </div>
            </div>

            {/* User Controls */}
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 font-medium">{currentUserRole}</span>
                    {currentUserRole === 'Admin' && currentGroupId && (
                        <button 
                          onClick={() => setIsInviteModalOpen(true)}
                          className="text-slate-600 hover:text-teal-600 font-medium underline decoration-slate-300 underline-offset-4"
                        >
                          Invite
                        </button>
                    )}
                    <button 
                      onClick={logout}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Log Out
                    </button>
                </div>
                
                {currentView === 'tasks' && (
                   <button 
                      onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                      className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-btn font-bold shadow-soft transition-transform active:scale-95 flex items-center justify-center gap-2"
                   >
                      <span>+</span> New Task
                  </button>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:px-6">
        
        {/* VIEW 1: TASK BOARD */}
        {currentView === 'tasks' && (
          <div className="space-y-6">
            
            {/* Controls Bar */}
            <div className="flex flex-wrap gap-3 bg-white p-4 rounded-card border border-slate-100 shadow-sm">
                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={filterAssignee} 
                  onChange={(e) => setFilterAssignee(e.target.value)}
                >
                    {uniqueAssignees.map(a => <option key={a} value={a}>{a === 'All' ? 'Assignee (All)' : a}</option>)}
                </select>

                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Category (All)' : c}</option>)}
                </select>

                <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>

                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={sortField} 
                  onChange={(e) => setSortField(e.target.value)}
                >
                    <option value="createdAt">Date Created</option>
                    <option value="dueDate">Due Date</option>
                    <option value="assignee">Assignee</option>
                </select>
                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={sortDirection} 
                  onChange={(e) => setSortDirection(e.target.value)}
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>

            {/* THE GRID */}
            {tasks.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-card">
                <p className="text-slate-400 font-medium">No tasks found. Time to relax? 🌴</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    role={currentUserRole}
                    onClick={handleTaskClick}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: KEY INFO */}
        {currentView === 'keyinfo' && <KeyInfo groupId={currentGroupId} userRole={currentUserRole} />}

        {/* VIEW 3: WELLNESS */}
        {currentView === 'wellness' && <WellnessCenter />}

      </main>
      
      {/* Modals */}
      {isTaskModalOpen && <NewTaskModal onClose={handleCloseTaskModal} onSave={handleSave} assignees={assignees} task={taskToEdit} />}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} currentGroupId={currentGroupId} />}
      {taskToView && <TaskHistoryModal onClose={() => setTaskToView(null)} task={taskToView} currentUserRole={currentUserRole} />}
    </div>
  )
}

export default App
// src/App.jsx - FINAL INTEGRATED VERSION

import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import NewTaskModal from './components/NewTaskModal';
import Auth from './components/Auth';
import OnboardingWizard from './components/OnboardingWizard';
import InviteModal from './components/InviteModal'; 
import TaskHistoryModal from './components/TaskHistoryModal';
import KeyInfo from './components/KeyInfo'; 
import WellnessCenter from './components/WellnessCenter';
import TaskCard from './components/TaskCard'; 
import GroupSettingsModal from './components/GroupSettingsModal'; 
import NoGroupState from './components/NoGroupState'; 

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
import { Users } from 'lucide-react'; 

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  // --- UI State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null);

  // --- Data State ---
  const [tasks, setTasks] = useState([]); 
  const [members, setMembers] = useState([]); 
  
  // --- Navigation & Filters ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('createdAt'); 
  const [sortDirection, setSortDirection] = useState('desc'); 

  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // --- 1. Fetch Real Group Members ---
  useEffect(() => {
    if (currentUser && currentGroupId) {
      const q = query(collection(db, "users"), where('groupId', '==', currentGroupId));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const memberList = snapshot.docs.map(doc => {
            const data = doc.data();
            const name = data.displayName || data.email.split('@')[0]; 
            return { id: doc.id, name, email: data.email, role: data.role };
          });
          setMembers(memberList);
        },
        (error) => { // 👈 ADD THIS ERROR BLOCK
           console.log("Member sync pending..."); 
        }
      );
      
      return () => unsubscribe();
    }
  }, [currentUser, currentGroupId]);

  // --- 2. Fetch Tasks ---
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      
      // 1. RESTORED: Define the query 'q'
      let tasksCollectionRef = collection(db, "tasks");
      let q = query(tasksCollectionRef, where('groupId', '==', currentGroupId)); 

      // Apply Filters
      if (filterCategory !== 'All') q = query(q, where('category', '==', filterCategory));
      if (filterStatus !== 'All') q = query(q, where('status', '==', filterStatus));
      
      // Apply Sort
      q = query(q, orderBy(sortField, sortDirection));

      // 2. NOW listen to 'q' (with the error handler)
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const tasksArray = [];
          querySnapshot.forEach((d) => {
            tasksArray.push({ id: d.id, ...d.data() });
          });
          
          // Handle Assignee Filter in memory
          if (filterAssignee !== 'All') {
              setTasks(tasksArray.filter(t => t.assignee === filterAssignee || t.assigneeId === filterAssignee));
          } else {
              setTasks(tasksArray);
          }
        },
        (error) => { // Error Handler
           console.log("Task sync pending...", error.message); 
        }
      );
      
      return () => unsubscribe();
    }
  }, [currentUser, hasAcceptedHipaa, currentGroupId, filterAssignee, filterCategory, filterStatus, sortField, sortDirection]);

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
        assigneeId: submittedTask.assigneeId, 
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
  
  // --- RENDER LOGIC ---
  
  // 1. Auth Check
  if (!currentUser) return <Auth />;

  // 2. Onboarding Check
  if (hasAcceptedHipaa === false) return <OnboardingWizard />;

  // 3. 🛑 Orphaned User Check (No Group) 🛑
  if (!currentGroupId) {
      return <NoGroupState />;
  }
  
  // 4. Normal App Render
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
              
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {['dashboard', 'tasks', 'keyinfo', 'wellness'].map(view => (
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
                    
                    {/* ADMIN CONTROLS */}
                    {currentUserRole === 'Admin' && currentGroupId && (
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setIsSettingsOpen(true)}
                              className="text-slate-500 hover:text-teal-600 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Manage Team"
                            >
                              <Users size={18} />
                            </button>
                            <span className="text-slate-300">|</span>
                            <button 
                              onClick={() => setIsInviteModalOpen(true)}
                              className="text-slate-600 hover:text-teal-600 font-medium underline decoration-slate-300 underline-offset-4"
                            >
                              Invite
                            </button>
                        </div>
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
        
        {/* VIEW 0: DASHBOARD */}
        {currentView === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            currentUser={currentUser} 
            members={members}
            onViewChange={setCurrentView} 
          />
        )}

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
                    <option value="All">All Assignees</option>
                    {members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
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
                <p className="text-slate-400 font-medium">No tasks found.</p>
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

        {/* VIEW 2: KEY INFO - 🛑 UPDATE THIS LINE 🛑 */}
        {currentView === 'keyinfo' && (
            <KeyInfo 
                groupId={currentGroupId} 
                userRole={currentUserRole} 
                members={members} // 👈 ADD THIS PROP
            />
        )}

        {/* VIEW 3: WELLNESS */}
        {currentView === 'wellness' && <WellnessCenter />}

      </main>
      
      {/* Modals */}
      {isTaskModalOpen && <NewTaskModal onClose={handleCloseTaskModal} onSave={handleSave} members={members} task={taskToEdit} />}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} currentGroupId={currentGroupId} />}
      {isSettingsOpen && <GroupSettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {taskToView && (
        <TaskHistoryModal 
          onClose={() => setTaskToView(null)} 
          task={taskToView} 
          currentUserRole={currentUserRole} 
          members={members} // 👈 ADD THIS PROP
        />
)}
    </div>
  )
}

export default App;
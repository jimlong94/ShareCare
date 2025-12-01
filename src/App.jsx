// src/App.jsx - FINAL (Help Modal Integrated)

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
import HelpModal from './components/HelpModal'; // 👈 NEW IMPORT

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
import { Users, Leaf, HelpCircle } from 'lucide-react'; // 👈 Added HelpCircle

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 

  // --- UI State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isHelpOpen, setIsHelpOpen] = useState(false); // 👈 NEW STATE
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null);

  // --- Data State ---
  const [tasks, setTasks] = useState([]); 
  const [members, setMembers] = useState([]); 
  const [secureMentions, setSecureMentions] = useState([]);
  
  // Retry Trigger for Race Conditions
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // --- Navigation & Filters ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('createdAt'); 
  const [sortDirection, setSortDirection] = useState('desc'); 

  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;

  // --- Helper: Auto-Retry on Permission Failures ---
  const handleSyncError = (err, source) => {
    console.log(`${source} sync error (likely race condition), retrying in 1s...`, err);
    setTimeout(() => setRetryTrigger(prev => prev + 1), 1000);
  };

  // 0. RESET VIEW ON LOGIN
  useEffect(() => {
    if (currentUser) {
      setCurrentView('dashboard');
    }
  }, [currentUser]);

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
        (error) => handleSyncError(error, "Members")
      );
      
      return () => unsubscribe();
    }
  }, [currentUser, currentGroupId, retryTrigger]);

  // --- 2. Fetch Tasks ---
  useEffect(() => {
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      
      let tasksCollectionRef = collection(db, "tasks");
      let q = query(tasksCollectionRef, where('groupId', '==', currentGroupId)); 

      if (filterCategory !== 'All') q = query(q, where('category', '==', filterCategory));
      if (filterStatus !== 'All') q = query(q, where('status', '==', filterStatus));
      
      q = query(q, orderBy(sortField, sortDirection));

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const tasksArray = [];
          querySnapshot.forEach((d) => {
            tasksArray.push({ id: d.id, ...d.data() });
          });
          
          if (filterAssignee !== 'All') {
              setTasks(tasksArray.filter(t => t.assignee === filterAssignee || t.assigneeId === filterAssignee));
          } else {
              setTasks(tasksArray);
          }
        },
        (error) => handleSyncError(error, "Tasks")
      );
      
      return () => unsubscribe();
    }
  }, [currentUser, hasAcceptedHipaa, currentGroupId, filterAssignee, filterCategory, filterStatus, sortField, sortDirection, retryTrigger]);

  // --- 3. Fetch Secure Note Mentions ---
  useEffect(() => {
    if (currentUser && currentGroupId) {
      const q = query(
        collection(db, "key_notes"), 
        where('groupId', '==', currentGroupId),
        where('mentions', 'array-contains', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mentions = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.acknowledgedBy || !data.acknowledgedBy.includes(currentUser.uid)) {
             mentions.push({ id: doc.id, ...data });
          }
        });
        setSecureMentions(mentions);
      },
      (error) => handleSyncError(error, "SecureNotes")
      );
      return () => unsubscribe();
    }
  }, [currentUser, currentGroupId, retryTrigger]);

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
  if (!currentUser) return <Auth />;
  if (hasAcceptedHipaa === false) return <OnboardingWizard />;
  if (!currentGroupId) return <NoGroupState />;
  
  const categories = ['All', 'Appointment', 'Household', 'Misc'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Branding & Nav */}
            <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
              
              <div className="flex items-center gap-2.5">
                  <div className="bg-teal-600 text-white p-2 rounded-xl shadow-sm">
                    <Leaf size={22} fill="currentColor" className="text-teal-100" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">The Zen Family Planner</h1>
              </div>

              <div className="flex p-1.5 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto">
                {['dashboard', 'tasks', 'keyinfo', 'wellness'].map(view => {
                    const isActive = currentView === view;
                    const label = view === 'keyinfo' ? 'Key Info' : view;
                    return (
                        <button 
                          key={view}
                          onClick={() => setCurrentView(view)}
                          className={`
                            px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap
                            ${isActive 
                              ? 'bg-white text-teal-700 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                          `}
                        >
                          {label}
                        </button>
                    )
                })}
              </div>
            </div>

            {/* Right Side: User Controls & Actions */}
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="flex items-center gap-3 text-sm">
                    
                    {/* HELP BUTTON */}
                    <button 
                        onClick={() => setIsHelpOpen(true)}
                        className="text-slate-400 hover:text-teal-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                        title="How to use"
                    >
                        <HelpCircle size={20} />
                    </button>

                    <span className="text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{currentUserRole}</span>
                    
                    {currentUserRole === 'Admin' && currentGroupId && (
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setIsSettingsOpen(true)}
                              className="text-slate-500 hover:text-teal-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Manage Team"
                            >
                              <Users size={20} />
                            </button>
                            <span className="text-slate-200 h-4 w-px bg-slate-300"></span>
                            <button 
                              onClick={() => setIsInviteModalOpen(true)}
                              className="text-slate-600 hover:text-teal-600 font-bold text-xs uppercase tracking-wide hover:underline decoration-teal-200 underline-offset-4"
                            >
                              Invite
                            </button>
                        </div>
                    )}
                    <button onClick={logout} className="text-slate-400 hover:text-rose-500 font-medium ml-2 transition-colors">Log Out</button>
                </div>
                
                {/* Primary Action Button */}
                {currentView === 'tasks' && (
                   <button 
                      onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                      className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
                   >
                      <span className="text-lg leading-none">+</span> New Task
                  </button>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        {currentView === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            currentUser={currentUser} 
            members={members}
            secureMentions={secureMentions}
            onViewChange={setCurrentView} 
          />
        )}

        {currentView === 'tasks' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm items-center">
                <div className="w-full md:w-auto flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                        <option value="All">All Assignees</option>
                        {members.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                    <select className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Category (All)' : c}</option>)}
                    </select>
                </div>
                
                <div className="hidden md:block h-8 w-px bg-slate-200 mx-2"></div>
                
                <div className="w-full md:w-auto flex gap-2">
                    <select className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                        <option value="createdAt">Date Created</option>
                        <option value="dueDate">Due Date</option>
                        <option value="assignee">Assignee</option>
                    </select>
                    <select className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20" value={sortDirection} onChange={(e) => setSortDirection(e.target.value)}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-400 font-medium">No tasks found. Enjoy the quiet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} role={currentUserRole} onClick={handleTaskClick} onEdit={handleEditClick} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'keyinfo' && <KeyInfo groupId={currentGroupId} userRole={currentUserRole} members={members} />}
        {currentView === 'wellness' && <WellnessCenter />}
      </main>
      
      {/* MODALS */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
      {isTaskModalOpen && <NewTaskModal onClose={handleCloseTaskModal} onSave={handleSave} members={members} task={taskToEdit} />}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} currentGroupId={currentGroupId} />}
      {isSettingsOpen && <GroupSettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {taskToView && <TaskHistoryModal onClose={() => setTaskToView(null)} task={taskToView} currentUserRole={currentUserRole} members={members} />}
    </div>
  )
}

export default App;
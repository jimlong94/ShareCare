// src/App.jsx
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
import HelpModal from './components/HelpModal'; 
import useFcmToken from './hooks/useFcmToken'; 
import { useAuth } from './AuthContext';
import { db } from './firebase'; 
import { 
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, where, deleteDoc, 
} from 'firebase/firestore'; 
import { Users, Leaf, HelpCircle, LogOut } from 'lucide-react';
import { LOCAL_DEMO, demoMembers, demoTasks } from './localDemo';

function App() {
  const { currentUser, logout, hasAcceptedHipaa, userProfile } = useAuth(); 
  useFcmToken(); 

  // --- UI State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isHelpOpen, setIsHelpOpen] = useState(false); 
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToView, setTaskToView] = useState(null);

  // --- Data State ---
  const [tasks, setTasks] = useState(LOCAL_DEMO ? demoTasks : []); 
  const [members, setMembers] = useState(LOCAL_DEMO ? demoMembers : []); 
  const [secureMentions, setSecureMentions] = useState([]);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // --- Navigation & Filters ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterAssignee, setFilterAssignee] = useState('All');
  
  const sortField = 'createdAt';
  const sortDirection = 'desc';

  const currentGroupId = userProfile.groupId;
  const currentUserRole = userProfile.role;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncError = (err, source) => {
    console.log(`${source} sync error, retrying...`, err);
    setTimeout(() => setRetryTrigger(prev => prev + 1), 1000);
  };

  useEffect(() => {
    if (currentUser) setCurrentView('dashboard');
  }, [currentUser]);

  // --- 1. Fetch Members ---
  useEffect(() => {
    if (LOCAL_DEMO) return;
    if (currentUser && currentGroupId) {
      const q = query(collection(db, "users"), where('groupId', '==', currentGroupId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const memberList = snapshot.docs.map(doc => {
            const data = doc.data();
            // 🛡️ CRASH FIX: Safe navigation here too
            const name = data?.displayName || data?.email?.split('@')[0] || 'Member'; 
            return { id: doc.id, name, email: data?.email, role: data?.role };
          });
          setMembers(memberList);
        }, (error) => handleSyncError(error, "Members"));
      return () => unsubscribe();
    }
  }, [currentUser, currentGroupId, retryTrigger]);

  // --- 2. Fetch Tasks ---
  useEffect(() => {
    if (LOCAL_DEMO) return;
    if (currentUser && hasAcceptedHipaa && currentGroupId) {
      let tasksCollectionRef = collection(db, "tasks");
      let q = query(tasksCollectionRef, where('groupId', '==', currentGroupId)); 
      q = query(q, orderBy(sortField, sortDirection));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const tasksArray = [];
          querySnapshot.forEach((d) => tasksArray.push({ id: d.id, ...d.data() }));
          
          if (filterAssignee !== 'All') {
              setTasks(tasksArray.filter(t => t.assignee === filterAssignee || t.assigneeId === filterAssignee));
          } else {
              setTasks(tasksArray);
          }
        }, (error) => handleSyncError(error, "Tasks"));
      return () => unsubscribe();
    }
  }, [currentUser, hasAcceptedHipaa, currentGroupId, filterAssignee, sortField, sortDirection, retryTrigger]);

  // --- 3. Fetch Secure Mentions ---
  useEffect(() => {
    if (LOCAL_DEMO) return;
    if (currentUser && currentGroupId) {
      const q = query(collection(db, "key_notes"), where('groupId', '==', currentGroupId), where('mentions', 'array-contains', currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mentions = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.acknowledgedBy || !data.acknowledgedBy.includes(currentUser.uid)) {
             mentions.push({ id: doc.id, ...data });
          }
        });
        setSecureMentions(mentions);
      }, (error) => handleSyncError(error, "SecureNotes"));
      return () => unsubscribe();
    }
  }, [currentUser, currentGroupId, retryTrigger]);

  const handleNavigation = (view, filterUid = null) => {
    setCurrentView(view);
    if (view === 'tasks' && filterUid) {
      setFilterAssignee(filterUid);
    }
  };

  const handleTaskClick = (task) => setTaskToView(task);
  const handleEditClick = (task) => { setTaskToEdit(task); setIsTaskModalOpen(true); };
  const handleDelete = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete "${taskTitle}"?`)) return;
    if (LOCAL_DEMO) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return;
    }
    try { await deleteDoc(doc(db, "tasks", taskId)); } catch (e) { console.error(e); }
  };
  const handleCloseTaskModal = () => { setIsTaskModalOpen(false); setTaskToEdit(null); };

  const handleTaskUpdates = (taskId, updates) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, updates } : task)));
    setTaskToView((prev) => (prev && prev.id === taskId ? { ...prev, updates } : prev));
  };

  const handleSave = async (submittedTask) => {
    if (!hasAcceptedHipaa || !currentGroupId) return;
    const dataToSave = {
      title: submittedTask.title, assignee: submittedTask.assignee, assigneeId: submittedTask.assigneeId, 
      category: submittedTask.category, status: submittedTask.status, dueDate: submittedTask.dueDate, updates: submittedTask.updates, 
    };
    if (LOCAL_DEMO) {
      if (submittedTask.id) {
        setTasks((prev) => prev.map((task) => (task.id === submittedTask.id ? { ...task, ...dataToSave } : task)));
      } else {
        setTasks((prev) => [{
          ...dataToSave,
          id: `local-task-${Date.now()}`,
          createdBy: currentUser.email,
          createdAt: new Date(),
          groupId: currentGroupId,
        }, ...prev]);
      }
      handleCloseTaskModal();
      return;
    }
    try {
      if (submittedTask.id) await updateDoc(doc(db, "tasks", submittedTask.id), dataToSave);
      else await addDoc(collection(db, "tasks"), { ...dataToSave, createdBy: currentUser.email, createdAt: new Date(), groupId: currentGroupId });
      handleCloseTaskModal();
    } catch (e) { console.error(e); alert("Save failed."); }
  };

  const visibleTasks = LOCAL_DEMO && filterAssignee !== 'All'
    ? tasks.filter((task) => task.assignee === filterAssignee || task.assigneeId === filterAssignee)
    : tasks;
  
  if (!currentUser) return <Auth />;
  if (hasAcceptedHipaa === false) return <OnboardingWizard />;
  if (!currentGroupId) return <NoGroupState />;
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {!isOnline && <div className="bg-slate-800 text-white text-xs font-bold text-center py-1">You are offline. Changes will sync when connection returns.</div>}
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2.5">
                  <div className="bg-teal-600 text-white p-2 rounded-xl shadow-sm"><Leaf size={22} fill="currentColor" className="text-teal-100" /></div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">The Zen Family Planner</h1>
              </div>
              
              {/* --- ENHANCED NAVIGATION BAR --- */}
              <div className="flex p-2 bg-teal-100/50 border border-teal-100 rounded-2xl overflow-x-auto w-full md:w-auto gap-2">
                {['dashboard', 'tasks', 'keyinfo', 'wellness'].map(view => (
                    <button 
                      key={view} 
                      onClick={() => handleNavigation(view, view === 'tasks' ? 'All' : null)}
                      className={`
                        px-6 py-2.5 rounded-xl text-sm font-extrabold capitalize transition-all duration-200 whitespace-nowrap shadow-sm
                        ${currentView === view 
                          ? 'bg-white text-teal-800 shadow-md transform scale-100 ring-2 ring-teal-500/10' 
                          : 'bg-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}
                      `}
                    >
                      {view === 'keyinfo' ? 'Key Info' : view}
                    </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="flex items-center gap-3 text-sm">
                    <button onClick={() => setIsHelpOpen(true)} className="text-slate-400 hover:text-teal-600 transition-colors p-2 rounded-full hover:bg-slate-100"><HelpCircle size={20} /></button>
                    <span className="text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{currentUserRole}</span>
                    {currentUserRole === 'Admin' && currentGroupId && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-teal-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"><Users size={20} /></button>
                            <span className="text-slate-200 h-4 w-px bg-slate-300"></span>
                            <button onClick={() => setIsInviteModalOpen(true)} className="text-slate-600 hover:text-teal-600 font-bold text-xs uppercase tracking-wide hover:underline decoration-teal-200 underline-offset-4">Invite</button>
                        </div>
                    )}
                    <button onClick={logout} className="text-slate-400 hover:text-rose-500 font-medium ml-2"><LogOut size={16}/></button>
                </div>
                {currentView === 'tasks' && (
                   <button onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-100 transition-transform active:scale-95 flex items-center justify-center gap-2">
                      <span className="text-lg leading-none">+</span> New Task
                  </button>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        {currentView === 'dashboard' && (
          <Dashboard tasks={tasks} currentUser={currentUser} members={members} secureMentions={secureMentions} onNavigate={handleNavigation} />
        )}

        {currentView === 'tasks' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Context Banner - Replaces Filters */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
               <h2 className="text-lg font-bold text-slate-700">
                 {filterAssignee === 'All' ? 'All Family Tasks' : 'My Assigned Tasks'}
               </h2>
               <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sorted by Date</div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-400 font-medium">No tasks found. Enjoy the quiet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleTasks.map((task) => (
                  <TaskCard key={task.id} task={task} role={currentUserRole} onClick={handleTaskClick} onEdit={handleEditClick} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'keyinfo' && <KeyInfo groupId={currentGroupId} userRole={currentUserRole} members={members} />}
        {currentView === 'wellness' && <WellnessCenter />}
      </main>
      
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
      {isTaskModalOpen && <NewTaskModal onClose={handleCloseTaskModal} onSave={handleSave} members={members} task={taskToEdit} />}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} currentGroupId={currentGroupId} />}
      {isSettingsOpen && <GroupSettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {taskToView && <TaskHistoryModal onClose={() => setTaskToView(null)} task={taskToView} currentUserRole={currentUserRole} members={members} onUpdatesChange={handleTaskUpdates} />}
    </div>
  )
}

export default App;
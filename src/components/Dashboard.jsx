// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { LOCAL_DEMO } from '../localDemo';
import { 
  Sun, Moon, Coffee, CheckCircle2, Calendar, ArrowRight, 
  Activity, Bell, ShieldAlert, ChevronDown, UserCheck, X // 👈 Added X here
} from 'lucide-react';
import useFcmToken from '../hooks/useFcmToken';

function Dashboard({ tasks, currentUser, members, secureMentions = [], onNavigate }) {
  
  const [isBeaconExpanded, setIsBeaconExpanded] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false); // 👈 New State
  
  // Get permission status and function
  const { permission, requestPermission, sendTest } = useFcmToken();

  // 1. Detect Mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 2. Detect "Standalone" (Is the app installed?)
  const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true
  );

  const myName = currentUser?.email?.split('@')[0] || 'Friend'; 
  const hour = new Date().getHours();
  
  // --- GREETING LOGIC ---
  let greeting = { text: 'Good Morning', icon: <Sun size={24} /> };
  if (hour >= 12 && hour < 17) greeting = { text: 'Good Afternoon', icon: <Sun size={24} /> };
  if (hour >= 17) greeting = { text: 'Good Evening', icon: <Moon size={24} /> };
  if (hour >= 22 || hour < 5) greeting = { text: 'Rest Easy', icon: <Coffee size={24} /> };

  // --- NOTIFICATIONS ---
  const myTaskMentions = [];
  tasks.forEach(task => {
      if (task.updates) {
          task.updates.forEach(update => {
              if (update.mentions?.includes(currentUser?.uid) && !update.acknowledgedBy?.includes(currentUser?.uid)) {
                  myTaskMentions.push({ taskId: task.id, taskTitle: task.title, note: update.text, user: update.user });
              }
          });
      }
  });

  const handleAcknowledgeSecure = async (noteId) => {
    if (LOCAL_DEMO) return;
    try {
        await updateDoc(doc(db, "key_notes", noteId), { acknowledgedBy: arrayUnion(currentUser.uid) });
    } catch (e) { console.error(e); }
  };

  const urgentTasks = tasks.filter(t => t.status === 'Waiting'); 
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUser?.uid && t.status !== 'Done');
  const upcomingTasks = [...tasks].filter(t => t.status !== 'Done').sort((a, b) => new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31')).slice(0, 3);
  const totalNotifications = myTaskMentions.length + secureMentions.length;

  const getHeroMessage = () => {
      if (totalNotifications > 0) return "Let's clear those updates first.";
      if (urgentTasks.length > 0) return "A few priority items need your attention.";
      return "Everything is on track. Take a deep breath.";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 🟢 SCENARIO A: ON MOBILE + IN BROWSER -> "INSTALL ME" */}
      {isMobile && !isStandalone && (
        <div className="bg-teal-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-xl"><span className="text-xl">📲</span></div>
             <div>
               <p className="font-bold text-sm">Install the App</p>
               <p className="text-xs text-teal-200">Add to Home Screen for the best experience.</p>
             </div>
          </div>
          <button 
             onClick={() => setShowInstallModal(true)}
             className="bg-white text-teal-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-50"
          >
             Install
          </button>
        </div>
      )}

      {/* 🔵 SCENARIO B: ON MOBILE + INSTALLED + NO PERMS -> "NOTIFY ME" */}
      {isMobile && isStandalone && permission === 'default' && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Bell size={20} /></div>
            <div>
              <p className="font-bold text-sm">Enable Notifications</p>
              <p className="text-xs text-slate-300">Tap to get buzzed for tasks.</p>
            </div>
          </div>
          <button 
            onClick={requestPermission} 
            className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100"
          >
            Enable
          </button>
        </div>
      )}

      {/* 🟣 SCENARIO C: TEST PING (If installed & allowed) */}
      {isMobile && isStandalone && permission === 'granted' && (
         <div className="flex justify-end -mb-4">
            <button onClick={sendTest} className="text-[10px] font-bold text-slate-400 hover:text-teal-600 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
               <Bell size={12} /> Test Signal
            </button>
         </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-5 md:p-8 text-white shadow-xl overflow-hidden transition-all">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-teal-400 opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-100 font-medium text-xs md:text-sm uppercase tracking-wider mb-1">
            {greeting.icon} {greeting.text}, {myName}.
          </div>
          
          <div className="mb-4 md:mb-6">
             <h1 className="text-2xl font-bold tracking-tight md:hidden">
                Hello, {myName}.
             </h1>
             <h1 className="hidden md:block text-3xl font-bold tracking-tight leading-tight max-w-xl">
                {getHeroMessage()}
             </h1>
          </div>
          
          <div className="flex gap-2 md:gap-4">
             <button onClick={() => onNavigate('tasks', currentUser?.uid)} className="flex-1 md:flex-none bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white px-4 py-3 md:px-6 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                <UserCheck size={18} /> <span className="hidden xs:inline">My Tasks</span><span className="xs:hidden">Mine</span>
             </button>
             <button onClick={() => onNavigate('tasks', 'All')} className="flex-1 md:flex-none bg-white text-teal-800 px-4 py-3 md:px-6 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-lg shadow-teal-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                Task Board <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* --- THE BEACON --- */}
      {totalNotifications > 0 && (
          <div className="bg-amber-50 rounded-3xl border border-amber-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2">
              <button onClick={() => setIsBeaconExpanded(!isBeaconExpanded)} className="w-full flex items-center justify-between p-5 text-left">
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <span className="absolute flex h-3 w-3 top-0 right-0 -mt-1 -mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                          <div className="bg-white text-amber-500 p-2.5 rounded-xl border border-amber-100 shadow-sm"><Bell size={20} /></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">New Updates</h3>
                        <p className="text-slate-500 text-xs font-medium">{totalNotifications} item{totalNotifications !== 1 && 's'} require attention</p>
                      </div>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isBeaconExpanded ? 'rotate-180' : ''}`}/>
              </button>
              {isBeaconExpanded && (
                  <div className="px-5 pb-5 space-y-3">
                      {myTaskMentions.map((m, i) => (
                          <div key={`task-${i}`} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Note</span><span className="text-sm font-bold text-slate-700">{m.taskTitle}</span></div><p className="text-xs text-slate-500 italic line-clamp-2">"{m.note}"</p></div>
                              <button onClick={() => onNavigate('tasks', 'All')} className="w-full md:w-auto text-xs bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg font-bold">Review</button>
                          </div>
                      ))}
                      {secureMentions.map((note) => (
                          <div key={note.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div className="flex items-start gap-3"><ShieldAlert size={18} className="text-amber-500 mt-0.5" /><div><p className="text-sm font-bold text-slate-700">Secure Note Mention</p><p className="text-xs text-slate-400">Encrypted in Vault</p></div></div>
                              <div className="flex gap-2 w-full md:w-auto"><button onClick={() => onNavigate('keyinfo')} className="flex-1 md:flex-none text-xs text-teal-600 font-bold bg-teal-50 px-3 py-2 rounded-lg">View Vault</button><button onClick={() => handleAcknowledgeSecure(note.id)} className="flex-1 md:flex-none text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">Dismiss</button></div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- STATS GRID --- */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3">
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
            <div className="p-2 bg-slate-50 w-fit rounded-xl text-slate-400"><CheckCircle2 size={20} /></div>
            <div><div className="text-2xl font-bold text-slate-800">{myActiveTasks.length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide">My Active Tasks</div></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            {urgentTasks.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500 rounded-full blur-2xl opacity-10"></div>}
            <div className={`p-2 w-fit rounded-xl ${urgentTasks.length > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}><Activity size={20} /></div>
            <div><div className={`text-2xl font-bold ${urgentTasks.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{urgentTasks.length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Needs Attention</div></div>
         </div>
         <div className="col-span-2 bg-teal-50 p-5 rounded-2xl border border-teal-100 shadow-inner flex items-center justify-between cursor-pointer hover:bg-teal-100 transition-colors group" onClick={() => onNavigate('wellness')}>
            <div className="space-y-1"><h3 className="font-bold text-teal-900">Wellness Check</h3><p className="text-xs text-teal-700/80 max-w-[150px] leading-tight">Take a moment to breathe.</p></div>
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 transition-transform"><Coffee size={24} /></div>
         </div>
      </div>
      
      {/* --- LOWER SECTION --- */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar size={20} className="text-slate-400" /> Up Next</h3>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
               <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400 text-sm">All clear! No upcoming tasks.</p></div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks', 'All')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-teal-200 cursor-pointer transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${task.status === 'Waiting' ? 'bg-rose-400' : 'bg-teal-400'}`}></div>
                    <div><p className="font-bold text-slate-700 text-sm group-hover:text-teal-700 transition-colors line-clamp-1">{task.title}</p><p className="text-xs text-slate-400 mt-0.5">{task.dueDate ? new Date(task.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'}) : 'No Date'} • {task.assignee}</p></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 size={20} className="text-slate-400" /> Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
             <button onClick={() => onNavigate('tasks', 'All')} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all text-left group"><span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">📝</span><span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Add Task</span></button>
             <button onClick={() => onNavigate('keyinfo')} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all text-left group"><span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">🔐</span><span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vault</span></button>
             <button onClick={() => onNavigate('wellness')} className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all text-left group"><span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">❤️</span><span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Emergency Info</span></button>
          </div>
        </div>
       </div>

      {/* 👇 THE INSTALL MODAL (Simple Instructions) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
                <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-2">
                        <span className="text-3xl">📲</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Install App</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        To get notifications and quick access, add this app to your home screen.
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl text-left space-y-3 text-sm border border-slate-100">
                        <div className="flex gap-3">
                            <span className="font-bold text-slate-400">1.</span>
                            <span className="text-slate-700">Tap the <span className="font-bold">Share</span> button <span className="inline-block px-1.5 py-0.5 bg-slate-200 rounded text-[10px]">⎋</span> in your browser bar.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-slate-400">2.</span>
                            <span className="text-slate-700">Scroll down and tap <span className="font-bold">Add to Home Screen</span>.</span>
                        </div>
                    </div>

                    <button onClick={() => setShowInstallModal(false)} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold">Got it</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
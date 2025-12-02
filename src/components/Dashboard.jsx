// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { 
  Sun, Moon, Coffee, CheckCircle2, Calendar, ArrowRight, 
  Activity, Bell, Lock, ChevronRight, ChevronDown, ShieldAlert
} from 'lucide-react';

function Dashboard({ tasks, currentUser, members, secureMentions = [], onViewChange }) {
  
  const [isBeaconExpanded, setIsBeaconExpanded] = useState(false);
  const myName = currentUser.email.split('@')[0]; 
  const hour = new Date().getHours();
  
  // --- 1. GREETING LOGIC ---
  let greeting = { text: 'Good Morning', icon: <Sun size={24} /> };
  if (hour >= 12 && hour < 17) greeting = { text: 'Good Afternoon', icon: <Sun size={24} /> };
  if (hour >= 17) greeting = { text: 'Good Evening', icon: <Moon size={24} /> };
  if (hour >= 22 || hour < 5) greeting = { text: 'Rest Easy', icon: <Coffee size={24} /> };

  // --- 2. DATA PREP (Preserved Logic) ---
  const myTaskMentions = [];
  tasks.forEach(task => {
      if (task.updates) {
          task.updates.forEach(update => {
              if (update.mentions?.includes(currentUser.uid) && !update.acknowledgedBy?.includes(currentUser.uid)) {
                  myTaskMentions.push({ taskId: task.id, taskTitle: task.title, note: update.text, user: update.user });
              }
          });
      }
  });

  const handleAcknowledgeSecure = async (noteId) => {
    try {
        await updateDoc(doc(db, "key_notes", noteId), {
            acknowledgedBy: arrayUnion(currentUser.uid)
        });
    } catch (e) {
        console.error("Error acknowledging note:", e);
        alert("Action failed.");
    }
  };

  const urgentTasks = tasks.filter(t => t.status === 'Waiting'); 
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUser.uid && t.status !== 'Done');
  
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31'))
    .slice(0, 3);

  const totalNotifications = myTaskMentions.length + secureMentions.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
        {/* Soft Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-teal-400 opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-100 font-medium text-sm uppercase tracking-wider mb-1">
            {greeting.icon} {greeting.text}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-6">
            Hello, {myName}.
          </h1>
          
          <div className="flex flex-wrap gap-4">
             <button 
                onClick={() => onViewChange('tasks')}
                className="bg-white text-teal-800 px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-900/20 active:scale-95 transition-transform flex items-center gap-2"
             >
                View Task Board <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* --- THE BEACON (Redesigned) --- */}
      {totalNotifications > 0 && (
          <div className="bg-amber-50 rounded-3xl border border-amber-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2">
              <button 
                onClick={() => setIsBeaconExpanded(!isBeaconExpanded)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <span className="absolute flex h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                          <div className="bg-white text-amber-500 p-2.5 rounded-xl border border-amber-100 shadow-sm">
                            <Bell size={20} />
                          </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">New Updates</h3>
                        <p className="text-slate-500 text-xs font-medium">
                            {totalNotifications} item{totalNotifications !== 1 && 's'} require attention
                        </p>
                      </div>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isBeaconExpanded ? 'rotate-180' : ''}`}/>
              </button>

              {/* Collapsible Content */}
              {isBeaconExpanded && (
                  <div className="px-5 pb-5 space-y-3">
                      {/* Task Mentions */}
                      {myTaskMentions.map((m, i) => (
                          <div key={`task-${i}`} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Note</span>
                                    <span className="text-sm font-bold text-slate-700">{m.taskTitle}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 italic line-clamp-2">"{m.note}"</p>
                              </div>
                              <button 
                                onClick={() => onViewChange('tasks')}
                                className="w-full md:w-auto text-xs bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg font-bold"
                              >
                                Review
                              </button>
                          </div>
                      ))}

                      {/* Secure Mentions */}
                      {secureMentions.map((note) => (
                          <div key={note.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div className="flex items-start gap-3">
                                  <ShieldAlert size={18} className="text-amber-500 mt-0.5" />
                                  <div>
                                      <p className="text-sm font-bold text-slate-700">Secure Note Mention</p>
                                      <p className="text-xs text-slate-400">Encrypted in Vault</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => onViewChange('keyinfo')}
                                    className="flex-1 md:flex-none text-xs text-teal-600 font-bold bg-teal-50 px-3 py-2 rounded-lg"
                                >
                                    View Vault
                                </button>
                                <button 
                                    onClick={() => handleAcknowledgeSecure(note.id)}
                                    className="flex-1 md:flex-none text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg"
                                >
                                    Dismiss
                                </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- STATS GRID (Simplified) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
            <div className="p-2 bg-slate-50 w-fit rounded-xl text-slate-400"><CheckCircle2 size={20} /></div>
            <div>
                <div className="text-2xl font-bold text-slate-800">{myActiveTasks.length}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">My Active Tasks</div>
            </div>
         </div>
         
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            {urgentTasks.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500 rounded-full blur-2xl opacity-10"></div>}
            <div className={`p-2 w-fit rounded-xl ${urgentTasks.length > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                <Activity size={20} />
            </div>
            <div>
                <div className={`text-2xl font-bold ${urgentTasks.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{urgentTasks.length}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Needs Attention</div>
            </div>
         </div>

         <div className="col-span-2 bg-teal-50 p-5 rounded-2xl border border-teal-100 shadow-inner flex items-center justify-between cursor-pointer hover:bg-teal-100 transition-colors group" onClick={() => onViewChange('wellness')}>
            <div className="space-y-1">
                <h3 className="font-bold text-teal-900">Wellness Check</h3>
                <p className="text-xs text-teal-700/80 max-w-[150px] leading-tight">Take a moment to breathe.</p>
            </div>
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 transition-transform">
                <Coffee size={24} />
            </div>
         </div>
      </div>
      
      {/* --- LOWER SECTION --- */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* UPCOMING LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" />
            Up Next
          </h3>
          
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
               <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                 <p className="text-slate-400 text-sm">All clear! No upcoming tasks.</p>
               </div>
            ) : (
              upcomingTasks.map(task => (
                <div 
                    key={task.id} 
                    onClick={() => onViewChange('tasks')}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-teal-200 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Dot */}
                    <div className={`w-3 h-3 rounded-full shadow-sm ${task.status === 'Waiting' ? 'bg-rose-400' : 'bg-teal-400'}`}></div>
                    
                    <div>
                      <p className="font-bold text-slate-700 text-sm group-hover:text-teal-700 transition-colors line-clamp-1">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'}) : 'No Date'} • {task.assignee}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500" />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* QUICK ACTIONS (Vertical Stack) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
             <button onClick={() => onViewChange('tasks')} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all text-left group">
                <span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">📝</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Add Task</span>
             </button>
             <button onClick={() => onViewChange('keyinfo')} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all text-left group">
                <span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">🔐</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vault</span>
             </button>
             <button onClick={() => onViewChange('wellness')} className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all text-left group">
                <span className="block text-2xl mb-1 group-hover:-translate-y-1 transition-transform">❤️</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Emergency Info</span>
             </button>
          </div>
        </div>
       </div>
    </div>
  );
}

export default Dashboard;
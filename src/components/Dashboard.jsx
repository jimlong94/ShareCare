// src/components/Dashboard.jsx
import React from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Sun, Moon, Coffee, CheckCircle2, Calendar, ArrowRight, Activity, Bell, Lock, ChevronRight } from 'lucide-react';

function Dashboard({ tasks, currentUser, members, secureMentions = [], onViewChange }) {
  
  const myName = currentUser.email.split('@')[0]; 
  const hour = new Date().getHours();
  
  let greeting = { text: 'Good Morning', icon: <Sun size={28} /> };
  if (hour >= 12 && hour < 17) greeting = { text: 'Good Afternoon', icon: <Sun size={28} /> };
  if (hour >= 17) greeting = { text: 'Good Evening', icon: <Moon size={28} /> };
  if (hour >= 22 || hour < 5) greeting = { text: 'Rest Easy', icon: <Coffee size={28} /> };

  // --- BEACON LOGIC: Task Mentions ---
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

  // --- NEW: Acknowledge Secure Note ---
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
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31'))
    .slice(0, 3);

  const totalNotifications = myTaskMentions.length + secureMentions.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* THE BEACON (Notification Center) */}
      {totalNotifications > 0 && (
          <div className="relative bg-white border-l-4 border-amber-400 rounded-r-xl shadow-soft p-5 animate-in slide-in-from-top-4 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
                <Bell size={80} />
              </div>
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                      <span className="absolute flex h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                        <Bell size={20} />
                      </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Attention Needed</h3>
                    <p className="text-slate-500 text-xs">You have {totalNotifications} new update{totalNotifications > 1 ? 's' : ''}.</p>
                  </div>
              </div>

              <div className="space-y-3 relative z-10">
                  {/* Task Mentions */}
                  {myTaskMentions.map((m, i) => (
                      <div key={`task-${i}`} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors hover:bg-amber-50">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">Task Update</span>
                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{m.taskTitle}</span>
                              </div>
                              <p className="text-sm text-slate-600 italic">"{m.note}"</p>
                          </div>
                          <button 
                            onClick={() => onViewChange('tasks')}
                            className="w-full md:w-auto text-xs bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-bold hover:bg-amber-50 transition-colors shadow-sm"
                          >
                            Review
                          </button>
                      </div>
                  ))}

                  {/* Secure Mentions */}
                  {secureMentions.map((note) => (
                      <div key={note.id} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-amber-50">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide flex items-center gap-1">
                                  <Lock size={10} /> Secure Note
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 italic">Content encrypted in Vault.</p>
                          </div>
                          <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => onViewChange('keyinfo')}
                                className="flex-1 md:flex-none text-xs text-slate-600 hover:text-teal-600 font-bold underline px-2"
                            >
                                View Vault
                            </button>
                            <button 
                                onClick={() => handleAcknowledgeSecure(note.id)}
                                className="flex-1 md:flex-none text-xs bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-bold hover:bg-amber-50 transition-colors shadow-sm"
                            >
                                Clear
                            </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-teal-400 opacity-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-100 font-medium text-lg">
              {greeting.icon}
              <span>{greeting.text}, {myName}.</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight max-w-xl">
              {totalNotifications > 0 ? "Let's clear those notifications first." : 
               urgentTasks.length > 0 ? "A few priority items need your attention today." : "Everything is on track. Take a deep breath."}
            </h2>
          </div>
           <button 
            onClick={() => onViewChange('tasks')}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
          >
            Open Task Board <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-slate-300"></div>
             <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">My Tasks</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{tasks.filter(t => t.assigneeId === currentUser.uid && t.status !== 'Done').length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-5 text-rose-500"><Activity size={60} /></div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
             <div className="text-rose-500 text-xs font-bold uppercase tracking-wider">Attention</div>
          </div>
          <div className="text-3xl font-bold text-rose-600">{urgentTasks.length}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-teal-500"></div>
             <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{tasks.filter(t => t.status !== 'Done').length}</div>
        </div>

        <div 
            onClick={() => onViewChange('wellness')}
            className="bg-teal-50 p-6 rounded-2xl border border-teal-100 shadow-inner flex flex-col justify-center items-center text-center cursor-pointer hover:bg-teal-100 transition-colors group"
        >
          <Activity size={28} className="text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-teal-800 text-sm font-bold">Wellness Check</div>
        </div>
      </div>
      
      {/* LOWER SECTION */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* UPCOMING LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" />
            Up Next
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {upcomingTasks.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center gap-3">
                 <div className="p-3 bg-slate-50 rounded-full text-slate-300"><CheckCircle2 size={32} /></div>
                 <p className="text-slate-400">All clear! No upcoming tasks.</p>
               </div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onViewChange('tasks')}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${task.status === 'Waiting' ? 'bg-rose-500' : 'bg-teal-500'}`}></div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm md:text-base group-hover:text-teal-700 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold">{task.assignee}</span> • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-200 group-hover:text-teal-500 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* QUICK ACTIONS */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            Quick Actions
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
             <button onClick={() => onViewChange('tasks')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Add New Task</span>
                <div className="bg-white w-8 h-8 rounded-lg border border-slate-200 group-hover:border-teal-200 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors">+</div>
             </button>
             <button onClick={() => onViewChange('keyinfo')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Find Provider Info</span>
                <div className="bg-white w-8 h-8 rounded-lg border border-slate-200 group-hover:border-amber-200 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">?</div>
             </button>
             <button onClick={() => onViewChange('wellness')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Emergency Numbers</span>
                <div className="bg-white w-8 h-8 rounded-lg border border-slate-200 group-hover:border-rose-200 flex items-center justify-center text-slate-400 group-hover:text-rose-600 transition-colors">!</div>
             </button>
          </div>
        </div>
       </div>
    </div>
  );
}

export default Dashboard;
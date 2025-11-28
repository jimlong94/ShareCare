// src/components/Dashboard.jsx - WITH THE BEACON

import React from 'react';
import { Sun, Moon, Coffee, CheckCircle2, Calendar, ArrowRight, Activity, Bell } from 'lucide-react';

function Dashboard({ tasks, currentUser, members, onViewChange }) {
  
  const myName = currentUser.email.split('@')[0]; 
  const hour = new Date().getHours();
  
  // Greeting Logic
  let greeting = { text: 'Good Morning', icon: <Sun size={24} /> };
  if (hour >= 12 && hour < 17) greeting = { text: 'Good Afternoon', icon: <Sun size={24} /> };
  if (hour >= 17) greeting = { text: 'Good Evening', icon: <Moon size={24} /> };
  if (hour >= 22 || hour < 5) greeting = { text: 'You should be sleeping', icon: <Coffee size={24} /> };

  // --- THE BEACON LOGIC ---
  // Scan all tasks for updates where I am mentioned but haven't acknowledged
  const myMentions = [];
  tasks.forEach(task => {
      if (task.updates) {
          task.updates.forEach(update => {
              if (update.mentions?.includes(currentUser.uid) && !update.acknowledgedBy?.includes(currentUser.uid)) {
                  myMentions.push({ taskId: task.id, taskTitle: task.title, note: update.text, user: update.user });
              }
          });
      }
  });

  // --- Filtering ---
  const urgentTasks = tasks.filter(t => t.status === 'Waiting'); 
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31'))
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* THE BEACON (Notification Center) */}
      {myMentions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-card p-4 shadow-sm animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                      <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-amber-500 text-white p-1.5 rounded-full"><Bell size={16} /></div>
                  </div>
                  <h3 className="font-bold text-amber-900">Attention Needed</h3>
              </div>
              <div className="space-y-2">
                  {myMentions.map((m, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-amber-100 flex justify-between items-center shadow-sm">
                          <div>
                              <p className="text-xs font-bold text-amber-600 uppercase mb-0.5">Mentioned in "{m.taskTitle}"</p>
                              <p className="text-sm text-slate-700 truncate max-w-[200px] md:max-w-md">"{m.note}"</p>
                          </div>
                          <button 
                            onClick={() => onViewChange('tasks')}
                            className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold hover:bg-amber-200 transition-colors"
                          >
                            Reply
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-card p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* ... (Keep existing hero content) ... */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-100 font-medium mb-1">
              {greeting.icon}
              <span>{greeting.text}, {myName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {myMentions.length > 0 ? "Check your notifications above." : 
               urgentTasks.length > 0 ? `There are ${urgentTasks.length} items needing attention.` : "Everything is looking manageable today."}
            </h2>
          </div>
          {/* ... (Keep existing button) ... */}
           <button 
            onClick={() => onViewChange('tasks')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white px-5 py-2.5 rounded-btn font-bold transition-all active:scale-95"
          >
            Go to Board
          </button>
        </div>
      </div>

      {/* ... (Keep Stats Grid & Rest of Dashboard) ... */}
      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ... (Copy existing stats blocks) ... */}
         <div className="bg-white p-4 rounded-card border border-slate-100 shadow-soft">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">My Tasks</div>
          <div className="text-2xl font-bold text-slate-800">{tasks.filter(t => t.assigneeId === currentUser.uid).length}</div>
        </div>
        <div className="bg-white p-4 rounded-card border border-slate-100 shadow-soft">
          <div className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">Waiting/Urgent</div>
          <div className="text-2xl font-bold text-rose-500">{urgentTasks.length}</div>
        </div>
        <div className="bg-white p-4 rounded-card border border-slate-100 shadow-soft">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Active</div>
          <div className="text-2xl font-bold text-slate-800">{tasks.length}</div>
        </div>
        <div className="bg-teal-50 p-4 rounded-card border border-teal-100 shadow-inner flex flex-col justify-center items-center text-center cursor-pointer hover:bg-teal-100 transition-colors" onClick={() => onViewChange('wellness')}>
          <Activity size={24} className="text-teal-600 mb-1" />
          <div className="text-teal-800 text-xs font-bold">Wellness Check</div>
        </div>
      </div>
      
      {/* ... (Copy rest of upcoming tasks and quick actions from previous file) ... */}
      {/* Just putting a placeholder here for the rest of the file to save space, assuming you keep the original logic for lists */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UPCOMING TASKS */}
        <div className="lg:col-span-2 space-y-4">
            {/* ... (Same as before) ... */}
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" />
            Up Next
          </h3>
          <div className="bg-white rounded-card border border-slate-100 shadow-soft divide-y divide-slate-50 overflow-hidden">
            {upcomingTasks.length === 0 ? (
               <div className="p-8 text-center text-slate-400">No upcoming tasks. You are all clear!</div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onViewChange('tasks')}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'Waiting' ? 'bg-rose-500' : 'bg-teal-500'}`}></div>
                    <div>
                      <p className="font-bold text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        Assigned to <span className="font-semibold">{task.assignee}</span> • Due {task.dueDate || 'ASAP'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* QUICK ACTIONS */}
        <div className="space-y-4">
             {/* ... (Same as before) ... */}
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            Quick Actions
          </h3>
          <div className="bg-white rounded-card border border-slate-100 shadow-soft p-4 space-y-3">
             <button onClick={() => onViewChange('tasks')} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Add New Task</span>
                <div className="bg-white p-1 rounded border border-slate-200 group-hover:border-teal-200 text-slate-400 group-hover:text-teal-600">+</div>
             </button>
             <button onClick={() => onViewChange('keyinfo')} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Find Provider Info</span>
                <div className="bg-white p-1 rounded border border-slate-200 group-hover:border-amber-200 text-slate-400 group-hover:text-amber-600">?</div>
             </button>
             <button onClick={() => onViewChange('wellness')} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-all border border-slate-100 group">
                <span className="font-semibold text-sm">Emergency Numbers</span>
                <div className="bg-white p-1 rounded border border-slate-200 group-hover:border-rose-200 text-slate-400 group-hover:text-rose-600">!</div>
             </button>
          </div>
        </div>
       </div>
    </div>
  );
}

export default Dashboard;
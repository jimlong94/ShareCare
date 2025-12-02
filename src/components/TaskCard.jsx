// src/components/TaskCard.jsx
import React from 'react';
import { Calendar, User, MessageSquare, Edit2, Trash2, CalendarPlus, Clock, CheckCircle2 } from 'lucide-react';
import { generateCalendarLinks } from '../utils/calendar';

const TaskCard = ({ task, role, onClick, onEdit, onDelete }) => {
  const isActionable = role === 'Admin' || role === 'Editor';
  const isUrgent = task.status === 'Waiting';
  const isDone = task.status === 'Done';

  // --- LOGIC: Calendar (Preserved) ---
  const calendarLinks = task.dueDate ? generateCalendarLinks(task) : null;

  const handleAddToCalendar = (e) => {
    e.stopPropagation();
    if (!calendarLinks) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && calendarLinks.icsUrl) {
       window.location.href = calendarLinks.icsUrl;
    } else {
       window.open(calendarLinks.googleUrl, '_blank');
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    // 3 AM Principle: "Tomorrow" is easier to read than "Dec 12" (Future enhancement, sticking to locale for now)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // --- STYLES: The 3 AM Palette ---
  const getCardTheme = () => {
    if (isDone) return 'bg-slate-50 border-slate-100 opacity-60 grayscale';
    if (isUrgent) return 'bg-rose-50/40 border-rose-100 hover:border-rose-200'; // Soft Alert
    return 'bg-white border-slate-100 hover:border-teal-200 shadow-sm hover:shadow-md'; // Standard
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'Waiting': return 'bg-rose-100 text-rose-700';
      case 'Done': return 'bg-slate-200 text-slate-600';
      case 'In progress': return 'bg-amber-100 text-amber-700';
      default: return 'bg-teal-50 text-teal-700';
    }
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className={`
        group relative flex flex-col justify-between
        rounded-3xl p-6 border transition-all duration-300 cursor-pointer
        ${getCardTheme()}
      `}
    >
      {/* 1. HEADER: Category & Status */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {task.category}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadge()}`}>
          {task.status}
        </span>
      </div>

      {/* 2. BODY: Title & Snippet */}
      <div className="mb-6 space-y-2">
        <h3 className={`text-xl font-bold leading-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {task.title}
        </h3>
        
        {/* Note Snippet (Only if exists) */}
        {task.updates && task.updates.length > 0 && (
          <div className="flex items-start gap-2 text-slate-500">
            <MessageSquare size={14} className="mt-1 shrink-0 opacity-50" />
            <p className="text-xs line-clamp-1 italic opacity-80">
              "{task.updates[task.updates.length - 1].text}"
            </p>
          </div>
        )}
      </div>

      {/* 3. FOOTER: Metadata & Actions */}
      <div className="mt-auto pt-4 border-t border-slate-100/50 flex items-center justify-between">
        
        {/* Left: Assignee */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <User size={14} />
          </div>
          <span className="text-xs font-bold text-slate-600 max-w-[80px] truncate">
            {task.assignee || "Unassigned"}
          </span>
        </div>

        {/* Right: Date & Actions */}
        <div className="flex items-center gap-2">
            {task.dueDate && (
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium ${isUrgent && !isDone ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
                    <Clock size={12} />
                    <span>{formatDate(task.dueDate)}</span>
                    
                    {/* Add to Calendar (Mini Button) */}
                    <button 
                        onClick={handleAddToCalendar}
                        className="ml-1 p-1 -mr-1 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-teal-600 transition-all"
                        title="Add to Calendar"
                    >
                        <CalendarPlus size={12} />
                    </button>
                </div>
            )}
            
            {/* Admin Actions (Visible on Hover/Focus) */}
            {isActionable && !isDone && (
                <div className="flex gap-1 ml-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => onEdit(task)}
                        className="p-2 rounded-full text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(task.id, task.title)}
                        className="p-2 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
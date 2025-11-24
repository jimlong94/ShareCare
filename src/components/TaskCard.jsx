import React from 'react';
import { Calendar, User, MessageSquare, Edit2, Trash2 } from 'lucide-react';

const TaskCard = ({ task, role, onClick, onEdit, onDelete }) => {
  const isActionable = role === 'Admin' || role === 'Editor';

  // Helper for Status Colors (Using Tailwind classes)
  const getStatusColor = (status) => {
    switch (status) {
      case 'In progress': return 'bg-amber-100 text-amber-700';
      case 'Waiting': return 'bg-rose-100 text-rose-700';
      case 'Delegated': return 'bg-sky-100 text-sky-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-white rounded-card p-6 shadow-soft border border-slate-100 cursor-pointer 
                 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-200 
                 flex flex-col gap-4 relative overflow-hidden"
    >
      
      {/* HEADER: Title & Status */}
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      {/* META: Date & Assignee */}
      <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <span>{task.assignee}</span>
        </div>
        
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>

      {/* CONTEXT: Latest Note Snippet */}
      {task.updates && task.updates.length > 0 && task.updates[0]?.text && (
        <div className="bg-teal-50 p-3 rounded-btn flex items-start gap-2">
          <MessageSquare size={16} className="text-teal-600 shrink-0 mt-0.5" />
          <p className="text-sm text-teal-800 italic line-clamp-2">
            "{task.updates[0].text}"
          </p>
        </div>
      )}

      {/* FOOTER: Category & Actions */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          {task.category}
        </span>
        
        {isActionable && (
          <div className="flex gap-2">
            <button 
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            >
              <Edit2 size={18} />
            </button>
            <button 
              className="p-2 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id, task.title); }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
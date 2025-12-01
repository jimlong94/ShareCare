// src/components/TaskCard.jsx
import React from 'react';
import { Calendar, User, MessageSquare, Edit2, Trash2, Clock, CheckCircle2 } from 'lucide-react';

const TaskCard = ({ task, role, onClick, onEdit, onDelete }) => {
  const isActionable = role === 'Admin' || role === 'Editor';
  const isUrgent = task.status === 'Waiting';
  const isDone = task.status === 'Done';

  // Dynamic Styles based on Status
  const getStatusStyle = () => {
    if (isDone) return 'border-l-4 border-l-slate-300 bg-slate-50 opacity-75';
    if (isUrgent) return 'border-l-4 border-l-rose-500 bg-rose-50/20'; // Soft red tint for urgent
    return 'border-l-4 border-l-teal-500 bg-white';
  };

  const getStatusBadge = () => {
    if (isDone) return 'bg-slate-200 text-slate-600';
    if (isUrgent) return 'bg-rose-100 text-rose-700 font-bold';
    return 'bg-teal-50 text-teal-700 font-medium';
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className={`
        rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer 
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 
        flex flex-col gap-4 relative overflow-hidden group
        ${getStatusStyle()}
      `}
    >
      
      {/* HEADER: Status & Title */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getStatusBadge()}`}>
              {task.status}
            </span>
            <h3 className={`text-lg font-bold leading-tight ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                {task.title}
            </h3>
        </div>
        {/* Category Icon/Initial placeholder could go here */}
      </div>

      {/* META INFO */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <User size={14} className="text-slate-400" />
          <span className="font-medium text-slate-700 truncate max-w-[100px]">{task.assignee}</span>
        </div>
        
        {task.dueDate && (
          <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-rose-600 font-semibold' : ''}`}>
            <Calendar size={14} />
            <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* CONTEXT: Latest Note Snippet */}
      {task.updates && task.updates.length > 0 && task.updates[0]?.text && (
        <div className="bg-slate-50/80 p-3 rounded-lg flex items-start gap-2.5 border border-slate-100/50 mt-1">
          <MessageSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 italic line-clamp-2 leading-relaxed">
            "{task.updates[0].text}"
          </p>
        </div>
      )}

      {/* FOOTER: Actions */}
      <div className="mt-auto pt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {task.category}
        </span>
        
        {isActionable && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button 
              className="p-2 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
              onClick={() => onEdit(task)}
              title="Edit Task"
            >
              <Edit2 size={16} />
            </button>
            <button 
              className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              onClick={() => onDelete(task.id, task.title)}
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
// src/components/HelpModal.jsx
import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Calendar, Shield, Heart, Bell, HelpCircle } from 'lucide-react';

function HelpModal({ onClose }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const guides = [
    {
      title: "The Task Board",
      subtitle: "Who is doing what, and when.",
      icon: <Calendar size={24} className="text-teal-600" />,
      content: (
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>Think of this as the family's shared "To-Do" list. No more group texts asking "Did mom take her meds?"</p>
          <ul className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <li className="flex gap-2"><span className="font-bold text-teal-600">1.</span> Tap <span className="font-bold">"+ New Task"</span> to add an appointment or chore.</li>
            <li className="flex gap-2"><span className="font-bold text-teal-600">2.</span> Assign it to a family member (or leave it open for anyone).</li>
            <li className="flex gap-2"><span className="font-bold text-teal-600">3.</span> When finished, tap the task and change status to <span className="font-bold text-slate-800">Done</span>.</li>
          </ul>
        </div>
      )
    },
    {
      title: "The Secure Vault",
      subtitle: "Passwords, Combos, and Legal Docs.",
      icon: <Shield size={24} className="text-teal-600" />,
      content: (
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>This is where we hide the sensitive stuff. It is encrypted, meaning even the app developers cannot read it.</p>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900">
            <strong>Pro Tip:</strong> You will need the <strong>Family Master PIN</strong> to open this. If you are the Admin, write it down somewhere safe!
          </div>
          <p>Use this for Wi-Fi passwords, door codes, insurance policy numbers, or the location of the physical Will.</p>
        </div>
      )
    },
    {
      title: "Caregiver Wellness",
      subtitle: "Put your oxygen mask on first.",
      icon: <Heart size={24} className="text-teal-600" />,
      content: (
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>Caregiving is exhausting. This section is just for you.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the <strong>Breathing Tool</strong> to calm down in stressful moments.</li>
            <li>Check the <strong>Burnout List</strong> to see if you need a break.</li>
            <li>Find <strong>Crisis Numbers</strong> instantly if things get too heavy.</li>
          </ul>
        </div>
      )
    },
    {
      title: "Activity & Updates",
      subtitle: "See what's happening without asking.",
      icon: <Bell size={24} className="text-teal-600" />,
      content: (
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>The "Beacon" (the bell icon on your Dashboard) lights up when someone adds a note or completes a task.</p>
          <p>Click any notification to jump straight to that task and say "Thanks!" or ask a question.</p>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-full text-teal-700">
                <HelpCircle size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800">How to use this App</h2>
                <p className="text-xs text-slate-500">A quick guide to The Zen Family Planner</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
            {guides.map((guide, index) => {
                const isOpen = openSection === index;
                return (
                    <div 
                        key={index} 
                        className={`
                            border rounded-2xl transition-all duration-300 overflow-hidden
                            ${isOpen ? 'border-teal-200 bg-white shadow-md' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}
                        `}
                    >
                        <button 
                            onClick={() => toggleSection(index)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-teal-50' : 'bg-white'}`}>
                                    {guide.icon}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-base ${isOpen ? 'text-teal-900' : 'text-slate-700'}`}>
                                        {guide.title}
                                    </h3>
                                    <p className="text-xs text-slate-500">{guide.subtitle}</p>
                                </div>
                            </div>
                            {isOpen ? <ChevronUp size={20} className="text-teal-500"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>
                        
                        {/* Expandable Content */}
                        <div 
                            className={`
                                px-4 transition-all duration-300 ease-in-out border-t border-teal-50
                                ${isOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}
                            `}
                        >
                            {guide.content}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl text-center">
            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
            >
                Got it, thanks!
            </button>
        </div>

      </div>
    </div>
  );
}

export default HelpModal;
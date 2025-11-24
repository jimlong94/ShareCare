// src/components/WellnessCenter.jsx
import React from 'react';
import { Heart, Phone, AlertTriangle, Wind } from 'lucide-react';

function WellnessCenter() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-rose-100 text-rose-500 rounded-full mb-2">
          <Heart size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Caregiver Wellness</h2>
        <p className="text-slate-500">You cannot pour from an empty cup. Take a moment for yourself.</p>
      </div>

      {/* Emergency Support Box */}
      <div className="bg-rose-50 border border-rose-100 rounded-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="text-rose-600" />
          <h3 className="text-lg font-bold text-rose-800">Immediate Support</h3>
        </div>
        <p className="text-rose-700 mb-6 text-sm">
          If you are in crisis, these resources are available 24/7.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <a href="tel:988" className="bg-rose-600 text-white px-5 py-2.5 rounded-btn font-bold shadow-sm hover:bg-rose-700 transition-colors">
            Call 988 (Suicide & Crisis)
          </a>
          <a href="tel:1-800-662-4357" className="bg-white text-rose-600 border border-rose-200 px-5 py-2.5 rounded-btn font-bold hover:bg-rose-50 transition-colors">
            SAMHSA Helpline
          </a>
        </div>
      </div>

      {/* Burnout Checklist */}
      <div className="bg-white border border-slate-200 rounded-card p-6 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">The Burnout Checklist</h3>
        </div>
        
        <p className="text-slate-600 mb-4 font-medium">Are you experiencing any of the following?</p>
        <ul className="space-y-3 mb-6">
          {[
            'Running on "autopilot" or feeling numb?',
            'Easily irritated by minor requests?',
            'Disrupted sleep (too much or too little)?',
            'Neglecting your own medical appointments?',
            'Withdrawing from friends/hobbies?'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
          If you checked more than 2, please consider asking the family to take over one "Red" category task this week.
        </p>
      </div>

      {/* Breathing Exercise */}
      <div className="bg-teal-50 border border-teal-100 rounded-card p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Wind className="text-teal-600" />
          <h3 className="text-lg font-bold text-teal-800">4-7-8 Breathing</h3>
        </div>
        <ol className="space-y-4">
          {[
            { step: 1, text: "Inhale through nose", time: "4s" },
            { step: 2, text: "Hold breath", time: "7s" },
            { step: 3, text: "Exhale forcefully through mouth", time: "8s" },
            { step: 4, text: "Repeat 4 times", time: "" },
          ].map((s) => (
            <li key={s.step} className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-teal-100/50">
              <span className="text-teal-900 font-medium">{s.step}. {s.text}</span>
              {s.time && <span className="text-xs font-bold bg-teal-200 text-teal-800 px-2 py-1 rounded">{s.time}</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default WellnessCenter;
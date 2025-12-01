// src/components/WellnessCenter.jsx
import React from 'react';
import { Heart, Phone, AlertTriangle, Wind, Check } from 'lucide-react';

function WellnessCenter() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex p-4 bg-rose-100 text-rose-500 rounded-full mb-2 shadow-sm ring-4 ring-rose-50">
          <Heart size={36} fill="currentColor" className="opacity-90" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Caregiver Wellness</h2>
        <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
          You cannot pour from an empty cup. Take a moment for yourself.
        </p>
      </div>

      {/* Emergency Support Box */}
      <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Phone size={20} /></div>
          <h3 className="text-xl font-bold text-rose-900">Immediate Support</h3>
        </div>
        <p className="text-rose-800 mb-6 text-sm md:text-base opacity-90">
          If you are in crisis or feeling overwhelmed, these confidential resources are available 24/7.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="tel:988" className="flex-1 bg-rose-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-transform active:scale-95 text-center">
            Call 988 (Crisis Line)
          </a>
          <a href="tel:1-800-662-4357" className="flex-1 bg-white text-rose-600 border border-rose-200 px-6 py-4 rounded-xl font-bold hover:bg-rose-50 transition-colors text-center shadow-sm">
            SAMHSA Helpline
          </a>
        </div>
      </div>

      {/* Breathing Exercise - The "Calm Down" Card */}
      <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-8 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-100 rounded-full opacity-50 blur-3xl"></div>

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><Wind size={20} /></div>
          <h3 className="text-xl font-bold text-teal-900">4-7-8 Breathing</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            <ol className="space-y-4 flex-1 w-full">
            {[
                { step: 1, text: "Inhale through nose", time: "4s" },
                { step: 2, text: "Hold breath", time: "7s" },
                { step: 3, text: "Exhale forcefully", time: "8s" },
                { step: 4, text: "Repeat cycle 4 times", time: "" },
            ].map((s) => (
                <li key={s.step} className="flex items-center justify-between bg-white/80 p-4 rounded-xl border border-teal-100/50 shadow-sm">
                <span className="text-teal-900 font-medium flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{s.step}</span> 
                    {s.text}
                </span>
                {s.time && <span className="text-xs font-bold bg-teal-200 text-teal-800 px-2 py-1 rounded-md">{s.time}</span>}
                </li>
            ))}
            </ol>
            
            {/* Visual Aid */}
            <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-4 border-teal-200 flex items-center justify-center animate-pulse-slow">
                    <div className="text-teal-400 font-bold text-xs uppercase tracking-widest">Breathe</div>
                </div>
            </div>
        </div>
      </div>

      {/* Burnout Checklist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertTriangle size={20} /></div>
          <h3 className="text-xl font-bold text-slate-800">Burnout Check-in</h3>
        </div>
        
        <p className="text-slate-600 mb-6 font-medium">Check if you are experiencing any of the following:</p>
        <ul className="space-y-3 mb-8">
          {[
            'Feeling numb or running on "autopilot"',
            'Easily irritated by minor requests',
            'Disrupted sleep (too much or too little)',
            'Neglecting your own medical appointments',
            'Withdrawing from friends/hobbies'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-600">
              <div className="mt-1 min-w-[20px] h-5 rounded border border-slate-300 flex items-center justify-center group cursor-pointer hover:border-amber-400 transition-colors">
                  {/* Mock Checkbox Visual */}
                  <div className="w-3 h-3 rounded-sm bg-amber-400 opacity-0 group-hover:opacity-20"></div>
              </div>
              <span className="text-sm md:text-base leading-snug">{item}</span>
            </li>
          ))}
        </ul>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 text-sm flex gap-3 items-start">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
            <p>If you checked more than 2, please consider asking the family to take over one "Red" category task this week.</p>
        </div>
      </div>

    </div>
  );
}

export default WellnessCenter;
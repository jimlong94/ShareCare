// src/components/OnboardingWizard.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { encryptData } from '../utils/crypto'; 
import { CheckCircle2, ShieldAlert, Users, LogOut, ArrowRight, Lock, Leaf } from 'lucide-react';

function OnboardingWizard() {
  const { completeOnboarding, logout, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [canProceed, setCanProceed] = useState(false);
  
  // Step 4 State (PIN Creation)
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userProfile?.role === 'Admin';
  const totalSteps = isAdmin ? 4 : 3;

  // --- RED ZONE: LOGIC PRESERVED ---
  const createGenesisRecord = async () => {
    if (!userProfile?.groupId) return;
    const genesisData = { name: "Vault Initialized", location: "System Secure Storage", contact: "Admin" };
    const encryptedPayload = {
      groupId: userProfile.groupId,
      createdAt: new Date(),
      name: encryptData(genesisData.name, pin),
      location: encryptData(genesisData.location, pin),
      contact: encryptData(genesisData.contact, pin),
      isGenesis: true 
    };
    await addDoc(collection(db, 'key_documents'), encryptedPayload);
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setCanProceed(false); 
    } else {
      if (isAdmin && step === 4) {
        if (pin.length < 4) { alert("PIN must be at least 4 characters."); return; }
        if (pin !== confirmPin) { alert("PINs do not match."); return; }
        
        try {
          setIsSaving(true);
          await createGenesisRecord(); 
          await completeOnboarding();
        } catch (e) {
          console.error(e);
          alert("Error securing vault. Please try again.");
          setIsSaving(false);
        }
      } else {
        completeOnboarding();
      }
    }
  };
  // ---------------------------------

  const steps = {
    1: {
      title: "Welcome to Zen Family Planner",
      subtitle: "Let's set some ground rules to keep things calm and organized.",
      icon: <Leaf size={32} className="text-teal-600" />,
      content: (
        <div className="space-y-4 text-slate-600">
            <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl text-teal-900 text-sm font-medium">
                This is a logistics tool, designed to help your family coordinate care without the chaos.
            </div>
            <ul className="space-y-3 text-sm md:text-base">
                <li className="flex gap-3 items-start"><CheckCircle2 className="shrink-0 text-teal-500" size={20}/> We do not provide medical advice.</li>
                <li className="flex gap-3 items-start"><CheckCircle2 className="shrink-0 text-teal-500" size={20}/> You are responsible for the accuracy of tasks.</li>
                <li className="flex gap-3 items-start"><CheckCircle2 className="shrink-0 text-teal-500" size={20}/> Be kind to each other in the notes.</li>
            </ul>
        </div>
      ),
      label: "I agree to the Terms of Service",
      requiresCheck: true
    },
    2: {
      title: "Privacy & Safety",
      subtitle: "This app is for logistics, NOT medical records.",
      icon: <ShieldAlert size={32} className="text-rose-500" />,
      content: (
        <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-rose-900 text-sm font-bold flex gap-3 items-start">
                <ShieldAlert className="shrink-0 mt-0.5" size={20} />
                <div>
                    CRITICAL: This app is NOT HIPAA Compliant.
                </div>
            </div>
            <p className="text-slate-700 font-semibold">Strictly Prohibited Uploads:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 marker:text-rose-400">
                <li>Photos of medical charts, X-rays, or ID cards.</li>
                <li>Detailed diagnosis reports or treatment plans.</li>
                <li>Social Security Numbers in task descriptions.</li>
            </ul>
        </div>
      ),
      label: "I promise NOT to upload medical records",
      requiresCheck: true
    },
    3: {
      title: "Family Transparency",
      subtitle: "Coordinating care requires everyone to be on the same page.",
      icon: <Users size={32} className="text-amber-500" />,
      content: (
        <div className="space-y-4 text-slate-600">
            <p className="text-lg font-medium text-slate-800">No secrets in the Hub.</p>
            <p className="text-sm leading-relaxed">
                Any Task or Note you create will be <strong>instantly visible</strong> to every member of your Family Group. This ensures no one doubles up on work or misses an appointment.
            </p>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-900 text-sm italic">
                "Many hands make light work."
            </div>
        </div>
      ),
      label: "I understand my inputs are shared with the group",
      requiresCheck: true
    },
    4: {
      title: "Secure the Vault",
      subtitle: "Create a Master PIN for your sensitive documents.",
      icon: <Lock size={32} className="text-slate-700" />,
      content: (
        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
            <p className="text-sm text-slate-500">
                This PIN will encrypt your "Key Info" (Wills, DNRs, etc). <br/>
                <strong>If you lose this PIN, the data is lost forever.</strong>
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Create Family Master PIN</label>
                    <input 
                        type="password" 
                        autoComplete="new-password"
                        value={pin}
                        onChange={(e) => { const val = e.target.value.trim(); setPin(val); setCanProceed(val.length >= 4 && val === confirmPin); }}
                        className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                        placeholder="••••"
                        maxLength={8}
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Confirm PIN</label>
                    <input 
                        type="password" 
                        autoComplete="new-password"
                        value={confirmPin}
                        onChange={(e) => { const val = e.target.value.trim(); setConfirmPin(val); setCanProceed(pin.length >= 4 && pin === val); }}
                        className={`w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-3 bg-white border-2 rounded-xl focus:outline-none transition-all ${pin && confirmPin && pin === confirmPin ? 'border-teal-500 ring-2 ring-teal-50' : 'border-slate-200 focus:border-slate-400'}`}
                        placeholder="••••"
                        maxLength={8}
                    />
                </div>
            </div>
        </form>
      ),
      label: "I have written this PIN down physically",
      requiresCheck: true // Force them to check a box saying they wrote it down
    }
  };

  const currentStepData = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Top Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-100 rounded-full shadow-sm">
                        {currentStepData.icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{currentStepData.title}</h2>
                        <p className="text-xs text-slate-500">{currentStepData.subtitle}</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden sm:block">
                    Step {step} / {totalSteps}
                </span>
            </div>
            {/* Progress Line */}
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
            </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
            {currentStepData.content}

            {/* Agreement Checkbox */}
            {currentStepData.requiresCheck && (
                <div 
                    onClick={() => setCanProceed(!canProceed)}
                    className={`
                        mt-8 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                        ${canProceed ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}
                    `}
                >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${canProceed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 bg-white'}`}>
                        {canProceed && <CheckCircle2 size={16} strokeWidth={4} />}
                    </div>
                    <span className={`font-bold ${canProceed ? 'text-teal-800' : 'text-slate-600'}`}>
                        {currentStepData.label}
                    </span>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
          <button 
             onClick={logout}
             className="text-slate-400 hover:text-rose-500 text-sm font-medium flex items-center gap-2 transition-colors px-2"
          >
            <LogOut size={16} /> Logout
          </button>
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={!canProceed || isSaving} 
            className={`
                px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm
                ${(canProceed && !isSaving) 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Setting up Vault...' : (step === totalSteps ? "Finish Setup" : "Next Step")} 
            {!isSaving && <ArrowRight size={18} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default OnboardingWizard;
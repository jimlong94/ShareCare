// src/components/OnboardingWizard.jsx - UPDATED WITH PIN CREATION

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { encryptData } from '../utils/crypto'; // 👈 Requires crypto.js
import { CheckCircle2, ShieldAlert, Users, LogOut, ArrowRight, Lock, Key } from 'lucide-react';

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

  const createGenesisRecord = async () => {
    if (!userProfile?.groupId) return;
    
    // 1. Create a dummy "Welcome" record to initialize encryption
    const genesisData = {
      name: "Vault Initialized",
      location: "System Secure Storage",
      contact: "Admin",
    };

    // 2. Encrypt it immediately with the new PIN
    const encryptedPayload = {
      groupId: userProfile.groupId,
      createdAt: new Date(),
      name: encryptData(genesisData.name, pin),
      location: encryptData(genesisData.location, pin),
      contact: encryptData(genesisData.contact, pin),
      isGenesis: true // Optional flag for UI handling later
    };

    // 3. Write to Firestore
    await addDoc(collection(db, 'key_documents'), encryptedPayload);
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setCanProceed(false); 
    } else {
      // FINAL STEP LOGIC
      if (isAdmin && step === 4) {
        if (pin.length < 4) { alert("PIN must be at least 4 characters."); return; }
        if (pin !== confirmPin) { alert("PINs do not match."); return; }
        
        try {
          setIsSaving(true);
          await createGenesisRecord(); // 👈 Lock the vault
          await completeOnboarding();
        } catch (e) {
          console.error(e);
          alert("Error securing vault. Please try again.");
          setIsSaving(false);
        }
      } else {
        // Non-Admins or Standard completion
        completeOnboarding();
      }
    }
  };

  const steps = {
    1: {
      title: "Terms of Service",
      icon: <CheckCircle2 size={28} className="text-teal-600" />,
      content: (
        <div className="space-y-4 text-slate-600">
            <p className="font-medium text-slate-800">Welcome to ShareCare. Before we begin, you must agree to our operating rules.</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>This service is a <strong>logistics coordination tool</strong> only.</li>
                <li>We do not provide medical advice or emergency services.</li>
                <li>You are responsible for the accuracy of the tasks you create.</li>
                <li>Accounts found abusing the system will be terminated.</li>
            </ul>
        </div>
      ),
      label: "I agree to the Terms of Service.",
      requiresCheck: true
    },
    2: {
      title: "Data & Privacy (Non-HIPAA)",
      icon: <ShieldAlert size={28} className="text-rose-500" />,
      content: (
        <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg text-rose-800 text-sm font-bold flex gap-2">
                <ShieldAlert className="shrink-0" size={20} />
                CRITICAL WARNING: This app is NOT HIPAA Compliant.
            </div>
            <p className="text-slate-700 text-sm font-semibold">You are strictly prohibited from uploading:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                <li>Photos of medical charts or X-rays.</li>
                <li>Detailed diagnosis reports or treatment plans.</li>
                <li>Social Security Numbers or Insurance ID images.</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">We store tasks as <strong>raw text</strong>. By proceeding, you consent to this.</p>
        </div>
      ),
      label: "I confirm I will NOT upload medical records.",
      requiresCheck: true
    },
    3: {
      title: "Family Group Sharing",
      icon: <Users size={28} className="text-amber-500" />,
      content: (
        <div className="space-y-4 text-slate-600">
            <p className="font-medium text-slate-800">ShareCare is designed for transparency.</p>
            <p className="text-sm">
                Any Task or Note you create will be <strong>instantly visible</strong> to every member of your "Family Hub."
            </p>
            <p className="text-sm bg-amber-50 p-3 rounded border border-amber-100 text-amber-900">
                Please confirm you understand that other family members (Editors and Users) will see the information you post here.
            </p>
        </div>
      ),
      label: "I consent to share my inputs with my Family Hub.",
      requiresCheck: true
    },
    
    // ... inside steps object ...
    4: {
      title: "Create Master PIN",
      icon: <Lock size={28} className="text-slate-700" />,
      content: (
        <form 
            onSubmit={(e) => { e.preventDefault(); /* Prevent refresh */ }} 
            className="space-y-4 text-slate-600"
        >
            <p className="font-medium text-slate-800">Secure your Key Info Vault.</p>
            {/* ... rest of the text ... */}
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 mt-4">
                {/* INPUT 1: FAMILY MASTER PIN */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Family Master PIN</label>
                    <input 
                        type="password" 
                        autoComplete="new-password" // 👈 Helps browser managers
                        value={pin}
                        onChange={(e) => { 
                          const val = e.target.value.trim(); 
                          setPin(val); 
                          setCanProceed(val.length >= 4 && val === confirmPin); 
                        }}
                        className="w-full p-3 border border-slate-300 rounded bg-white font-mono tracking-widest text-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="****"
                    />
                </div>
                
                {/* INPUT 2: CONFIRM PIN */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Confirm PIN</label>
                    <input 
                        type="password" 
                        autoComplete="new-password"
                        value={confirmPin}
                        onChange={(e) => { 
                          const val = e.target.value.trim();
                          setConfirmPin(val); 
                          setCanProceed(pin.length >= 4 && pin === val); 
                        }}
                        className="w-full p-3 border border-slate-300 rounded bg-white font-mono tracking-widest text-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="****"
                    />
                </div>
            </div>
            {/* ... rest of footer ... */}
        </form>
      ),
      label: "I have recorded this PIN in a safe place.",
      requiresCheck: false 
    }
  };

  const currentStepData = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 w-full bg-slate-100">
            <div className={`h-full bg-teal-500 transition-all duration-300`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>

        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-full border border-slate-100">
                    {currentStepData.icon}
                </div>
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step} of {totalSteps}</span>
                    <h2 className="text-xl font-bold text-slate-800">{currentStepData.title}</h2>
                </div>
            </div>
            
            {/* Content Body */}
            <div className="min-h-[200px] bg-white rounded-lg">
                {currentStepData.content}
            </div>

            {/* Checkbox Agreement (Only for steps 1-3) */}
            {currentStepData.requiresCheck && (
                <div className="mt-6 p-4 bg-slate-50 rounded-btn border border-slate-100 hover:border-teal-200 transition-colors cursor-pointer" onClick={() => setCanProceed(!canProceed)}>
                    <label className="flex items-start gap-3 cursor-pointer pointer-events-none">
                        <input
                            type="checkbox"
                            checked={canProceed}
                            readOnly
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-semibold text-slate-700 leading-snug">
                            {currentStepData.label}
                        </span>
                    </label>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
          <button 
             onClick={logout}
             className="text-slate-400 hover:text-rose-500 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} /> Cancel & Logout
          </button>
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={!canProceed || isSaving} 
            className={`
                px-6 py-3 rounded-btn font-bold flex items-center gap-2 transition-all
                ${(canProceed && !isSaving) 
                    ? 'bg-teal-600 text-white shadow-soft hover:bg-teal-700 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Securing...' : (step === totalSteps ? "Complete Setup" : "Next Step")} 
            {!isSaving && step < totalSteps && <ArrowRight size={18} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default OnboardingWizard;
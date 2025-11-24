// src/components/OnboardingWizard.jsx
import React, { useState } from 'react';
//import './NewTaskModal.css'; // Reusing modal styles
import { useAuth } from '../AuthContext';

function OnboardingWizard() {
  const { completeOnboarding, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [canProceed, setCanProceed] = useState(false);

  // Handlers
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      setCanProceed(false); // Reset checkbox for next step
    } else {
      // Final Step: Write to DB
      completeOnboarding();
    }
  };

  // Content for the 3 distinct steps 
  const steps = {
    1: {
      title: "Step 1: Terms of Service",
      icon: "📜",
      content: (
        <>
            <p>Welcome to <strong>ShareCare</strong>. Before we begin, you must agree to our operating rules.</p>
            <ul style={{textAlign: 'left', fontSize: '0.9rem', color: '#555'}}>
                <li>This service is a <strong>logistics coordination tool</strong>.</li>
                <li>We do not provide medical advice or emergency services.</li>
                <li>You are responsible for the accuracy of the tasks you create.</li>
                <li>Accounts found abusing the system will be terminated.</li>
            </ul>
        </>
      ),
      label: "I agree to the Terms of Service."
    },
    2: {
      title: "Step 2: Data & Privacy (Non-HIPAA)",
      icon: "⚠️",
      content: (
        <>
            <p style={{color: 'var(--color-danger)', fontWeight: 'bold'}}>
                CRITICAL WARNING: This app is NOT HIPAA Compliant.
            </p>
            <p>You are strictly prohibited from uploading:</p>
            <ul style={{textAlign: 'left', fontSize: '0.9rem', color: '#555'}}>
                <li>Photos of medical charts or X-rays.</li>
                <li>Detailed diagnosis reports or treatment plans.</li>
                <li>Social Security Numbers or Insurance ID images.</li>
            </ul>
            <p>We store your tasks as <strong>raw text</strong>. By proceeding, you consent to this data collection method.</p>
        </>
      ),
      label: "I consent to collecting text data and confirm I will NOT upload medical records."
    },
    3: {
      title: "Step 3: Family Group Sharing",
      icon: "👨‍👩‍👧‍👦",
      content: (
        <>
            <p>ShareCare is designed for transparency.</p>
            <p>
                Any Task or Note you create will be <strong>instantly visible</strong> to every member of your "Family Hub."
            </p>
            <p>
                Please confirm you understand that other family members (Editors and Users) will see the information you post here.
            </p>
        </>
      ),
      label: "I consent to share my inputs with the authorized members of my Family Hub."
    }
  };

  const currentStepData = steps[step];

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{maxWidth: '550px'}}>
        
        {/* Progress Bar */}
        <div style={{display: 'flex', gap: '5px', marginBottom: '20px'}}>
            {[1, 2, 3].map(num => (
                <div key={num} style={{
                    flex: 1, 
                    height: '6px', 
                    borderRadius: '3px',
                    backgroundColor: num <= step ? 'var(--color-primary)' : '#eee'
                }}></div>
            ))}
        </div>

        <div className="modal-header" style={{border: 'none', paddingBottom: 0}}>
          <h2 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>{currentStepData.icon}</span> {currentStepData.title}
          </h2>
        </div>
        
        <div className="modal-body" style={{ minHeight: '180px' }}>
          {currentStepData.content}
          
          <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef' 
          }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '12px' }}>
                    <input
                        type="checkbox"
                        checked={canProceed}
                        onChange={(e) => setCanProceed(e.target.checked)}
                        style={{ marginTop: '4px', width: '18px', height: '18px' }} 
                    />
                    <span style={{fontWeight: '600', fontSize: '0.95rem'}}>
                        {currentStepData.label}
                    </span>
                </label>
            </div>
        </div>
        
        <div className="modal-footer" style={{justifyContent: 'space-between', marginTop: '20px'}}>
          <button 
             className="btn btn-secondary" 
             onClick={logout}
          >
            Cancel & Logout
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canProceed} 
            style={{paddingLeft: '30px', paddingRight: '30px'}}
          >
            {step === 3 ? "Complete Setup" : "Next Step →"}
          </button>
        </div>
        
        <div style={{textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: '#999'}}>
            Step {step} of 3
        </div>

      </div>
    </div>
  );
}

export default OnboardingWizard;
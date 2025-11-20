// src/components/HipaaModal.jsx - UPDATED for INLINE CHECKBOX
import React, { useState } from 'react';
import './NewTaskModal.css';
import { useAuth } from '../AuthContext'; // 👈 NEW IMPORT

const HIPAA_ACCEPTED_KEY = 'sharecare_hipaa_accepted';

function HipaaModal() { // 👈 REMOVE onAgree prop
  const [isChecked, setIsChecked] = useState(false);
  const { saveHipaaAcceptance } = useAuth(); // 👈 Use auth function

  const handleAgree = () => {
    if (isChecked) {
      // 1. Write acceptance flag to Firestore and update local state
      saveHipaaAcceptance();
      // 2. The component will unmount because App.jsx state will change
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Critical Data Warning</h2>
        </div>
        
        <div className="modal-body" style={{ paddingBottom: '2rem' }}>
          <p style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>
            This application does not conform to HIPAA standards and is not intended to store protected health information.
          </p>
          <p>
            <span style={{ fontWeight: 'bold' }}>ShareCare</span> is a project management tool for coordinating general caregiver tasks and information, <span style={{ textDecoration: 'underline' }}>NOT a medical record system</span>.
          </p>
          <p>
            <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>DO NOT</span> store Protected Health Information (PHI), such as diagnoses, medical notes, treatment details, or social security numbers, in this application. Storing PHI is a violation of the app's terms of use and puts the user at risk.
          </p>
          
          <div style={{ marginTop: '1.5rem' }} className="form-group">
                {/* FIX: Use alignItems: 'center' and remove unnecessary input margin/padding */}
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', lineHeight: '1.4' }}>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        // Simplified input style: only necessary margin
                        style={{ marginRight: '10px', flexShrink: 0, width: '20px', height: '20px' }} 
                    />
                    <span>
                        I understand and agree that <span style={{ fontWeight: 'bold' }}>ShareCare</span> is not HIPAA-compliant and I will not store PHI.
                    </span>
                </label>
            </div>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleAgree}
            disabled={!isChecked} 
          >
            I Understand and Agree
          </button>
        </div>
      </div>
    </div>
  );
}

export default HipaaModal;
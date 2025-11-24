// src/components/InviteModal.jsx

import React, { useState } from 'react';
//import './NewTaskModal.css'; // Reusing modal styles
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function InviteModal({ onClose, currentGroupId }) {
  const { currentUser } = useAuth();
  const [invitedRole, setInvitedRole] = useState('Editor');
  const [inviteToken, setInviteToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInvite = async () => {
    setError(null);
    setLoading(true);

    if (!currentGroupId) {
      setError("Cannot generate invite: Group ID is missing.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the invite document in Firestore
      const inviteData = {
        groupId: currentGroupId,
        invitedRole: invitedRole,
        createdBy: currentUser.email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        status: 'pending',
      };

      const docRef = await addDoc(collection(db, "invites"), inviteData);
      
      // 2. Generate a simple link/token using the document ID
      const token = docRef.id;
      setInviteToken(`Invite Code: ${token} | Role: ${invitedRole}`);

    } catch (e) {
      console.error("Error generating invite: ", e);
      setError("Failed to generate invite. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite New Team Member</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <p>
            Invite tokens are valid for 7 days. Once a member joins, they will be linked to Hub ID: **{currentGroupId}**.
          </p>
          
          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="invite-role">Assign Role</label>
            <select
              id="invite-role"
              value={invitedRole}
              onChange={(e) => setInvitedRole(e.target.value)}
            >
              <option value="Editor">Editor (Create, Assign, Edit tasks)</option>
              <option value="User">User (Add notes to assigned tasks only)</option>
            </select>
          </div>

          {/* Error Display */}
          {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
          
          {/* Output Display */}
          {inviteToken && (
            <div className="form-group" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9', wordWrap: 'break-word' }}>
              <label>Invitation Token (Share this message):</label>
              <p style={{ fontWeight: 'bold', margin: '0' }}>{inviteToken}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                *Note: The actual invite link would use this token in a URL.
              </p>
            </div>
          )}

          {/* Button */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateInvite}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Invite Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteModal;
// src/components/KeyInfo.jsx - CLEAN PRODUCTION VERSION

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs, limit, writeBatch } from 'firebase/firestore';
import { encryptData, decryptData } from '../utils/crypto';

function KeyInfo({ groupId, userRole }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); 
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({}); 

  // --- Real-time Listener ---
  useEffect(() => {
    if (!isUnlocked || !groupId) return;

    const collectionName = activeTab === 'documents' ? 'key_documents' : 'key_providers';
    const q = query(collection(db, collectionName), where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setItems(data);
    });

    return () => unsubscribe();
  }, [isUnlocked, groupId, activeTab]);

  // --- Handlers ---

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert("PIN must be at least 4 characters");
      return;
    }

    try {
        // Canary Check: Fetch 1 item to validate the PIN against
        const docQuery = query(collection(db, 'key_documents'), where('groupId', '==', groupId), limit(1));
        const provQuery = query(collection(db, 'key_providers'), where('groupId', '==', groupId), limit(1));
        
        const [docSnap, provSnap] = await Promise.all([getDocs(docQuery), getDocs(provQuery)]);
        
        let testCipher = null;

        if (!docSnap.empty) testCipher = docSnap.docs[0].data().name;
        else if (!provSnap.empty) testCipher = provSnap.docs[0].data().name;

        // If data exists, attempt decryption to verify PIN
        if (testCipher) {
            const result = decryptData(testCipher, pin);
            // Check for the specific error string returned by crypto.js
            if (result.includes("Decryption Failed")) {
                alert("Incorrect PIN. Access Denied.");
                setPin(''); 
                return; 
            }
        }

        // If no data exists (First Use) OR decryption passed:
        setIsUnlocked(true);

    } catch (error) {
        console.error("Validation Error:", error);
        alert("System error verifying PIN. Please try again.");
    }
  };

  // Emergency Wipe Function (Admin Only)
  const handleEmergencyReset = async () => {
    const confirmMsg = "⚠️ WARNING: This will DELETE ALL encrypted Key Info items (Documents & Providers) for this group. This cannot be undone. Use this only if you have lost your PIN or need to reset the encryption.";
    if (!window.confirm(confirmMsg)) return;

    try {
      const batch = writeBatch(db);
      
      const docQuery = query(collection(db, 'key_documents'), where('groupId', '==', groupId));
      const provQuery = query(collection(db, 'key_providers'), where('groupId', '==', groupId));

      const [docSnap, provSnap] = await Promise.all([getDocs(docQuery), getDocs(provQuery)]);

      docSnap.forEach((doc) => batch.delete(doc.ref));
      provSnap.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
      alert("Secure database reset. You may now set a new PIN.");
      setPin('');
    } catch (e) {
      console.error("Reset failed", e);
      alert("Failed to reset database.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId) return;

    let payload = { groupId, createdAt: new Date() };

    // Encrypt fields before saving to Firestore
    if (activeTab === 'documents') {
      payload = {
        ...payload,
        name: encryptData(newItem.name, pin),
        location: encryptData(newItem.location, pin),
        contact: encryptData(newItem.contact, pin),
      };
    } else {
      payload = {
        ...payload,
        name: encryptData(newItem.name, pin),
        role: encryptData(newItem.role, pin),
        address: encryptData(newItem.address, pin), 
        phone: encryptData(newItem.phone, pin),     
      };
    }

    try {
      const collectionName = activeTab === 'documents' ? 'key_documents' : 'key_providers';
      await addDoc(collection(db, collectionName), payload);
      setNewItem({}); 
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save secure info.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this secure item?")) return;
    const collectionName = activeTab === 'documents' ? 'key_documents' : 'key_providers';
    await deleteDoc(doc(db, collectionName, id));
  };

  // Decrypt address for Google Maps link
  const openMap = (encryptedAddress) => {
    const address = decryptData(encryptedAddress, pin);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  if (!isUnlocked) {
    return (
      <div className="key-info-locked">
        <h3>🔒 Secure Key Info Hub</h3>
        <p>Enter the Family PIN to decrypt sensitive information.</p>
        <form onSubmit={handleUnlock} className="auth-form" style={{maxWidth: '300px', margin: '0 auto'}}>
          <input 
            type="password" 
            placeholder="Enter Session PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ padding: '10px', fontSize: '1.2rem', width: '100%', marginBottom: '10px' }}
          />
          <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Unlock Vault</button>
        </form>
        <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>
          * This PIN is not stored. If you lose it, you cannot decrypt the data.
        </p>
        
        {/* RESET BUTTON FOR ADMIN ONLY */}
        {(userRole === 'Admin') && (
            <button 
                onClick={handleEmergencyReset}
                style={{marginTop: '20px', color: 'red', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem'}}
            >
                [Admin] Reset Secure Database
            </button>
        )}
      </div>
    );
  }

  const canEdit = userRole === 'Admin' || userRole === 'Editor';

  return (
    <div className="key-info-container">
      <div className="key-info-header">
        <h2>Key Info Hub</h2>
        <button className="btn btn-secondary" onClick={() => setIsUnlocked(false)}>Lock 🔒</button>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
        <button 
          className={`tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          🩺 Provider Directory
        </button>
      </div>

      <div className="secure-list">
        {items.map(item => (
          <div key={item.id} className="secure-card">
            {activeTab === 'documents' ? (
              <>
                <h4>{decryptData(item.name, pin)}</h4>
                <p><strong>Location:</strong> {decryptData(item.location, pin)}</p>
                <p><strong>Contact:</strong> {decryptData(item.contact, pin)}</p>
              </>
            ) : (
              <>
                <h4>
                  {decryptData(item.name, pin)} 
                  <span className="role-badge">{decryptData(item.role, pin)}</span>
                </h4>
                
                <div className="provider-actions">
                    <span>{decryptData(item.address, pin)}</span>
                    <button className="btn-icon" onClick={() => openMap(item.address)}>🗺️ Map</button>
                </div>
                <div className="provider-actions">
                    <span>{decryptData(item.phone, pin)}</span>
                    <a href={`tel:${decryptData(item.phone, pin)}`} className="btn-icon">📞 Call</a>
                </div>
              </>
            )}
            
            {canEdit && (
               <button className="btn-delete-text" onClick={() => handleDelete(item.id)}>Delete</button>
            )}
          </div>
        ))}
        
        {items.length === 0 && <p className="empty-text">No secure records found.</p>}
      </div>

      {canEdit && (
        <form onSubmit={handleSave} className="secure-form">
          <h4>Add New {activeTab === 'documents' ? 'Document' : 'Provider'}</h4>
          
          <input 
            placeholder="Name (e.g. Will, Dr. Smith)" 
            value={newItem.name || ''}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
            required
          />

          {activeTab === 'documents' ? (
            <>
              <input 
                placeholder="Physical Location (e.g. Blue Safe)" 
                value={newItem.location || ''}
                onChange={e => setNewItem({...newItem, location: e.target.value})}
                required
              />
              <input 
                placeholder="Contact Person" 
                value={newItem.contact || ''}
                onChange={e => setNewItem({...newItem, contact: e.target.value})}
              />
            </>
          ) : (
            <>
              <input 
                placeholder="Role (e.g. GP, Dentist - No Medical specifics)" 
                value={newItem.role || ''}
                onChange={e => setNewItem({...newItem, role: e.target.value})}
                required
              />
              <input 
                placeholder="Address" 
                value={newItem.address || ''}
                onChange={e => setNewItem({...newItem, address: e.target.value})}
                required
              />
              <input 
                placeholder="Phone" 
                value={newItem.phone || ''}
                onChange={e => setNewItem({...newItem, phone: e.target.value})}
                required
              />
            </>
          )}
          
          <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>Encrypt & Save</button>
        </form>
      )}
    </div>
  );
}

export default KeyInfo;
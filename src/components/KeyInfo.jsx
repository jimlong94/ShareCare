// src/components/KeyInfo.jsx - FINAL EXPANDED

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  getDocs, 
  limit, 
  writeBatch 
} from 'firebase/firestore';
import { encryptData, decryptData } from '../utils/crypto';
import { 
  Lock, Unlock, MapPin, Phone, FileText, User, Plus, Trash2, 
  Share, StickyNote, CheckCircle2, AlertCircle, RefreshCw, AtSign 
} from 'lucide-react';

function KeyInfo({ groupId, userRole, members = [] }) {
  const { currentUser } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); 
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({}); 
  const [taggedUsers, setTaggedUsers] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- Real-time Listener ---
  useEffect(() => {
    if (!isUnlocked || !groupId) return;

    let collectionName = 'key_documents';
    if (activeTab === 'providers') collectionName = 'key_providers';
    if (activeTab === 'notes') collectionName = 'key_notes';

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

  // --- Vault Unlock Logic ---
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin.length < 4) { 
      alert("PIN must be at least 4 characters"); 
      return; 
    }
    setLoading(true);

    try {
        const docQuery = query(collection(db, 'key_documents'), where('groupId', '==', groupId), limit(1));
        const provQuery = query(collection(db, 'key_providers'), where('groupId', '==', groupId), limit(1));
        const noteQuery = query(collection(db, 'key_notes'), where('groupId', '==', groupId), limit(1));
        
        const [docSnap, provSnap, noteSnap] = await Promise.all([
            getDocs(docQuery), 
            getDocs(provQuery), 
            getDocs(noteQuery)
        ]);
        
        let testCipher = null;
        if (!docSnap.empty) testCipher = docSnap.docs[0].data().name;
        else if (!provSnap.empty) testCipher = provSnap.docs[0].data().name;
        else if (!noteSnap.empty) testCipher = noteSnap.docs[0].data().title; 

        if (testCipher) {
            const result = decryptData(testCipher, pin);
            if (result.includes("Decryption Failed")) {
                alert("Incorrect PIN. Access Denied.");
                setPin(''); 
                setLoading(false);
                return; 
            }
        }
        setIsUnlocked(true);
    } catch (error) {
        console.error("Validation Error:", error);
        alert("System error verifying PIN.");
    } finally {
        setLoading(false);
    }
  };

  const handleEmergencyReset = async () => {
    if (userRole !== 'Admin') return;
    
    const confirmText = "RESET-VAULT";
    const userConfirm = window.prompt(
        `⚠️ EMERGENCY RESET ⚠️\n\nThis will DELETE ALL secure documents, providers, and notes.\n\nType "${confirmText}" to confirm:`
    );
    
    if (!userConfirm || userConfirm.toUpperCase() !== confirmText) { 
        alert("Reset cancelled."); 
        return; 
    }

    setLoading(true);
    try {
        const batch = writeBatch(db);
        const collections = ['key_documents', 'key_providers', 'key_notes'];
        
        for (const colName of collections) {
            const q = query(collection(db, colName), where('groupId', '==', groupId));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        }

        await batch.commit();
        alert("Vault reset. Set a new PIN.");
        setIsUnlocked(true); 
        setPin(''); 
        setItems([]); 
    } catch (e) { 
        console.error(e); 
        alert(`Reset failed: ${e.message}`); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- Share Logic ---
  const handleShareItem = async (item) => {
    let text = "";
    
    if (activeTab === 'documents') {
        const name = decryptData(item.name, pin);
        const loc = decryptData(item.location, pin);
        const contact = item.contact ? decryptData(item.contact, pin) : 'N/A';
        text = `📄 ${name}\n📍 Location: ${loc}\n👤 Contact: ${contact}`;
    } else if (activeTab === 'providers') {
        const name = decryptData(item.name, pin);
        const role = decryptData(item.role, pin);
        const phone = decryptData(item.phone, pin);
        const addr = decryptData(item.address, pin);
        text = `👨‍⚕️ ${name} (${role})\n📞 ${phone}\n📍 ${addr}`;
    } else if (activeTab === 'notes') {
        const title = decryptData(item.title, pin);
        const content = decryptData(item.content, pin);
        text = `🔐 Secure Note: ${title}\n\n${content}`;
    }

    if (navigator.share) {
        try { await navigator.share({ text }); } catch (err) { console.log("Share cancelled"); }
    } else {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    }
  };

  const handleShareList = async () => {
    if (activeTab !== 'providers') return;
    let text = "🏥 SHARECARE PROVIDER LIST\n\n";
    items.forEach(item => {
        text += `• ${decryptData(item.name, pin)} (${decryptData(item.role, pin)})\n`;
        text += `  📞 ${decryptData(item.phone, pin)}\n`;
        text += `  📍 ${decryptData(item.address, pin)}\n\n`;
    });
    text += "Generated securely by ShareCare.";
    
    if (navigator.share) {
        try { await navigator.share({ title: 'Care Provider List', text }); } catch (err) { }
    } else {
        navigator.clipboard.writeText(text);
        alert("List copied to clipboard!");
    }
  };

  // --- Save & Delete ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    if (!pin || pin.length < 4) { alert("Session PIN invalid."); return; }

    let payload = { groupId, createdAt: new Date() };
    let targetCollection = 'key_documents';

    if (activeTab === 'documents') {
      payload = { 
        ...payload, 
        name: encryptData(newItem.name, pin), 
        location: encryptData(newItem.location, pin), 
        contact: encryptData(newItem.contact, pin) 
      };
    } else if (activeTab === 'providers') {
      targetCollection = 'key_providers';
      payload = { 
        ...payload, 
        name: encryptData(newItem.name, pin), 
        role: encryptData(newItem.role, pin), 
        address: encryptData(newItem.address, pin), 
        phone: encryptData(newItem.phone, pin) 
      };
    } else if (activeTab === 'notes') {
      targetCollection = 'key_notes';
      payload = {
        ...payload,
        title: encryptData(newItem.title, pin),
        content: encryptData(newItem.content, pin),
        mentions: taggedUsers, 
        acknowledgedBy: []
      };
    }

    try {
      await addDoc(collection(db, targetCollection), payload);
      setNewItem({}); 
      setTaggedUsers([]); 
    } catch (err) { console.error(err); alert("Failed to save."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this secure item?")) return;
    let col = activeTab === 'documents' ? 'key_documents' : activeTab === 'providers' ? 'key_providers' : 'key_notes';
    await deleteDoc(doc(db, col, id));
  };

  // --- Helpers ---
  const getHealthStats = () => {
    const essentials = ['Will', 'Power of Attorney', 'DNR', 'Insurance', 'Medication List'];
    const found = new Set();
    items.forEach(item => {
        const name = decryptData(item.name, pin).toLowerCase();
        essentials.forEach(e => { if (name.includes(e.toLowerCase())) found.add(e); });
    });
    const missing = essentials.filter(e => !found.has(e));
    const score = Math.round((found.size / essentials.length) * 100);
    return { score, missing, found };
  };

  const openMap = (encryptedAddress) => {
    const address = decryptData(encryptedAddress, pin);
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const toggleTag = (member) => {
    if (taggedUsers.includes(member.id)) {
        setTaggedUsers(prev => prev.filter(id => id !== member.id));
    } else {
        setTaggedUsers(prev => [...prev, member.id]);
    }
  };

  const canEdit = userRole === 'Admin' || userRole === 'Editor';
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all";

  // --- LOCKED VIEW ---
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-10 animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-card shadow-soft p-8 text-center border border-slate-100">
          <div className="inline-flex p-4 bg-slate-100 text-slate-500 rounded-full mb-4">
            <Lock size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Secure Key Info Hub</h3>
          <p className="text-slate-500 mb-6 text-sm">Enter your Family PIN to decrypt sensitive information.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Session PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
              autoFocus 
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-btn shadow-sm transition-transform active:scale-95"
            >
              {loading ? "Verifying..." : "Unlock Vault"}
            </button>
          </form>

          {userRole === 'Admin' && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleEmergencyReset} 
                    className="text-xs text-rose-400 hover:text-rose-600 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
                  >
                    <RefreshCw size={12} /> Forgot PIN? (Admin Reset)
                  </button>
              </div>
          )}
        </div>
      </div>
    );
  }

  // --- UNLOCKED VIEW ---
  const health = activeTab === 'documents' ? getHealthStats() : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-teal-50 p-4 rounded-card border border-teal-100">
        <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm"><Unlock size={20}/></div>
            <span className="font-bold text-teal-900">Vault Unlocked</span>
        </div>
        <div className="flex gap-2">
            {activeTab === 'providers' && items.length > 0 && (
                <button 
                  onClick={handleShareList} 
                  className="flex items-center gap-2 text-sm font-bold text-teal-700 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-teal-100 shadow-sm"
                >
                  <Share size={16} /> Share List
                </button>
            )}
            <button 
              onClick={() => { setIsUnlocked(false); setPin(''); }} 
              className="text-sm font-semibold text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Lock 🔒
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
            { id: 'documents', label: 'Documents', icon: <FileText size={16}/> }, 
            { id: 'providers', label: 'Providers', icon: <User size={16}/> }, 
            { id: 'notes', label: 'Secure Notes', icon: <StickyNote size={16}/> }
        ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setNewItem({}); setTaggedUsers([]); }} 
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      {/* Health Check */}
      {activeTab === 'documents' && health && (
        <div className="bg-white p-5 rounded-card border border-slate-100 shadow-soft flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold text-slate-700 text-sm">Vault Readiness</h4>
                    <span className={`text-xl font-bold ${health.score === 100 ? 'text-teal-600' : 'text-amber-500'}`}>{health.score}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${health.score === 100 ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${health.score}%` }}></div>
                </div>
            </div>
            {health.missing.length > 0 ? (
                <div className="flex-1 w-full bg-rose-50 border border-rose-100 p-3 rounded-lg">
                    <p className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-1"><AlertCircle size={14}/> Missing Essentials:</p>
                    <div className="flex flex-wrap gap-2">{health.missing.map(m => (<span key={m} className="text-[10px] uppercase font-bold bg-white text-rose-600 px-2 py-1 rounded border border-rose-100">{m}</span>))}</div>
                </div>
            ) : (
                <div className="flex-1 w-full bg-teal-50 border border-teal-100 p-3 rounded-lg flex items-center gap-3"><CheckCircle2 className="text-teal-600" /><p className="text-sm font-bold text-teal-800">All essentials found. Great job!</p></div>
            )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => {
            const isMentioned = activeTab === 'notes' && item.mentions?.includes(currentUser.uid);
            return (
              <div key={item.id} className={`
                relative group p-5 rounded-card shadow-soft border transition-all hover:-translate-y-0.5
                ${activeTab === 'notes' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}
                ${isMentioned ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
              `}>
                
                {/* SHARE SINGLE ITEM */}
                <button 
                    onClick={() => handleShareItem(item)}
                    className="absolute top-4 right-10 text-slate-300 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-1.5 rounded-full"
                    title="Share this item"
                >
                    <Share size={16} />
                </button>

                {canEdit && (
                   <button 
                    onClick={() => handleDelete(item.id)} 
                    className="absolute top-4 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-1.5 rounded-full"
                   >
                    <Trash2 size={16} />
                   </button>
                )}

                {/* Documents Content */}
                {activeTab === 'documents' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="text-slate-400 shrink-0" />
                      <h4 className="font-bold text-slate-800">{decryptData(item.name, pin)}</h4>
                    </div>
                    <div className="pl-9 space-y-1 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-400 text-xs uppercase">Location:</span> {decryptData(item.location, pin)}</p>
                        {item.contact && <p><span className="font-semibold text-slate-400 text-xs uppercase">Contact:</span> {decryptData(item.contact, pin)}</p>}
                    </div>
                  </div>
                )}
                
                {/* Providers Content */}
                {activeTab === 'providers' && (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="text-teal-600 shrink-0" />
                        <h4 className="font-bold text-slate-800">{decryptData(item.name, pin)}</h4>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">{decryptData(item.role, pin)}</span>
                    </div>
                    <div className="pl-8 space-y-2">
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm border border-slate-100">
                          <span className="truncate flex-1 mr-2">{decryptData(item.address, pin)}</span>
                          <button onClick={() => openMap(item.address)} className="text-teal-600 hover:bg-white p-1.5 rounded shadow-sm transition-all" title="Open Maps"><MapPin size={16}/></button>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm border border-slate-100">
                          <span className="font-mono text-slate-700">{decryptData(item.phone, pin)}</span>
                          <a href={`tel:${decryptData(item.phone, pin)}`} className="text-teal-600 hover:bg-white p-1.5 rounded shadow-sm transition-all" title="Call"><Phone size={16}/></a>
                        </div>
                    </div>
                  </div>
                )}
                
                {/* Notes Content */}
                {activeTab === 'notes' && (
                  <div className="space-y-2">
                     <div className="flex justify-between items-start">
                         <h4 className="font-bold text-amber-900 border-b border-amber-200 pb-2 mb-2 flex items-center gap-2">
                           <StickyNote size={16} className="text-amber-600"/>
                           {decryptData(item.title, pin)}
                         </h4>
                         {isMentioned && <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold">@YOU</span>}
                     </div>
                     <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed font-medium">{decryptData(item.content, pin)}</p>
                  </div>
                )}
              </div>
            );
        })}
      </div>
      
      {/* ADD ITEM FORM */}
      {canEdit && (
        <form onSubmit={handleSave} className="bg-slate-50 p-6 rounded-card border border-slate-200 mt-8">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold">
            <Plus size={20} />
            <h4 className="capitalize">Add Encrypted {activeTab.slice(0, -1)}</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {activeTab === 'documents' && (
                <>
                <input placeholder="Document Name (e.g. Will)" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required className={inputClass} />
                <input placeholder="Physical Location (e.g. Blue Safe)" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} required className={inputClass} />
                <input placeholder="Contact Person (Optional)" value={newItem.contact || ''} onChange={e => setNewItem({...newItem, contact: e.target.value})} className={`${inputClass} md:col-span-2`} />
                </>
            )}
            {activeTab === 'providers' && (
                <>
                <input placeholder="Name (e.g. Dr. Smith)" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required className={inputClass} />
                <input placeholder="Role (e.g. Cardiologist)" value={newItem.role || ''} onChange={e => setNewItem({...newItem, role: e.target.value})} required className={inputClass} />
                <input placeholder="Address" value={newItem.address || ''} onChange={e => setNewItem({...newItem, address: e.target.value})} required className={inputClass} />
                <input placeholder="Phone" value={newItem.phone || ''} onChange={e => setNewItem({...newItem, phone: e.target.value})} required className={inputClass} />
                </>
            )}
            {activeTab === 'notes' && (
                <>
                <input placeholder="Note Title" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} required className={`${inputClass} md:col-span-2 font-bold`} />
                <textarea placeholder="Secret content..." value={newItem.content || ''} onChange={e => setNewItem({...newItem, content: e.target.value})} required rows={4} className={`${inputClass} md:col-span-2 resize-none`} />
                <div className="md:col-span-2 bg-white p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                      <AtSign size={12}/> Tag Family Members (They will be notified)
                    </p>
                    {members.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => (
                                <button 
                                  key={m.id} 
                                  type="button" 
                                  onClick={() => toggleTag(m)} 
                                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 
                                    ${taggedUsers.includes(m.id) ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                >
                                    {taggedUsers.includes(m.id) ? <CheckCircle2 size={12}/> : <User size={12}/>}{m.name}
                                </button>
                            ))}
                        </div>
                    ) : ( 
                      <p className="text-xs text-slate-400 italic">Invite members to tag them here.</p> 
                    )}
                </div>
                </>
            )}
          </div>
          
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-btn hover:bg-slate-800 transition-colors font-semibold shadow-soft flex items-center gap-2">
              <Lock size={16} /> Encrypt & Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default KeyInfo;
// src/components/KeyInfo.jsx
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
  Share, StickyNote, CheckCircle2, AlertCircle, RefreshCw, AtSign, Info, Shield, Key 
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

  const docTypes = ['Will', 'Power of Attorney', 'DNR', 'Insurance', 'Medication List', 'Misc'];
  // ---------------------------------------------------------
  // 👇 SOFT PLUG SIGNATURE
  const SHARE_SIGNATURE = "\n\n— via The Zen Family Planner\nzenfamilyplanner.com";
  // ---------------------------------------------------------

  // --- LOGIC ZONE (PRESERVED) ---
  useEffect(() => {
    if (!isUnlocked || !groupId) return;
    let collectionName = 'key_documents';
    if (activeTab === 'providers') collectionName = 'key_providers';
    if (activeTab === 'notes') collectionName = 'key_notes';
    const q = query(collection(db, collectionName), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [isUnlocked, groupId, activeTab]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin.length < 4) { alert("PIN must be at least 4 characters"); return; }
    setLoading(true);
    try {
        const docQuery = query(collection(db, 'key_documents'), where('groupId', '==', groupId), limit(1));
        const provQuery = query(collection(db, 'key_providers'), where('groupId', '==', groupId), limit(1));
        const noteQuery = query(collection(db, 'key_notes'), where('groupId', '==', groupId), limit(1));
        const [docSnap, provSnap, noteSnap] = await Promise.all([getDocs(docQuery), getDocs(provQuery), getDocs(noteQuery)]);
        
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
    const userConfirm = window.prompt(`⚠️ EMERGENCY RESET ⚠️\n\nThis will DELETE ALL secure documents, providers, and notes.\n\nType "${confirmText}" to confirm:`);
    if (!userConfirm || userConfirm.toUpperCase() !== confirmText) { alert("Reset cancelled."); return; }
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
        setIsUnlocked(true); setPin(''); setItems([]); 
    } catch (e) { console.error(e); alert(`Reset failed: ${e.message}`); } finally { setLoading(false); }
  };

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
    
    // Add Signature
    text += SHARE_SIGNATURE;

    if (navigator.share) { try { await navigator.share({ text }); } catch (err) { } } 
    else { navigator.clipboard.writeText(text); alert("Copied to clipboard!"); }
  };

  // 👇 UPDATED SHARE LIST FUNCTION
  const handleShareList = async () => {
    if (activeTab !== 'providers') return;
    let text = "🏥 PROVIDER LIST\n\n";
    items.forEach(item => {
        text += `• ${decryptData(item.name, pin)} (${decryptData(item.role, pin)})\n`;
        text += `  📞 ${decryptData(item.phone, pin)}\n`;
        text += `  📍 ${decryptData(item.address, pin)}\n\n`;
    });
    
    // Add Signature
    text += `— via The Zen Family Planner\nzenfamilyplanner.com`;

    if (navigator.share) { try { await navigator.share({ title: 'Care Provider List', text }); } catch (err) { } } 
    else { navigator.clipboard.writeText(text); alert("List copied to clipboard!"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    if (!pin || pin.length < 4) { alert("Session PIN invalid."); return; }
    let payload = { groupId, createdAt: new Date() };
    let targetCollection = 'key_documents';
    if (activeTab === 'documents') {
      payload = { ...payload, name: encryptData(newItem.name, pin), location: encryptData(newItem.location, pin), contact: encryptData(newItem.contact, pin) };
    } else if (activeTab === 'providers') {
      targetCollection = 'key_providers';
      payload = { ...payload, name: encryptData(newItem.name, pin), role: encryptData(newItem.role, pin), address: encryptData(newItem.address, pin), phone: encryptData(newItem.phone, pin) };
    } else if (activeTab === 'notes') {
      targetCollection = 'key_notes';
      payload = { ...payload, title: encryptData(newItem.title, pin), content: encryptData(newItem.content, pin), mentions: taggedUsers, acknowledgedBy: [] };
    }
    try { await addDoc(collection(db, targetCollection), payload); setNewItem({}); setTaggedUsers([]); } catch (err) { console.error(err); alert("Failed to save."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this secure item?")) return;
    let col = activeTab === 'documents' ? 'key_documents' : activeTab === 'providers' ? 'key_providers' : 'key_notes';
    await deleteDoc(doc(db, col, id));
  };

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
    window.open(`http://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const toggleTag = (member) => {
    if (taggedUsers.includes(member.id)) setTaggedUsers(prev => prev.filter(id => id !== member.id));
    else setTaggedUsers(prev => [...prev, member.id]);
  };

  const canEdit = userRole === 'Admin' || userRole === 'Editor';
  const inputBase = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400";

  // --- UI RENDER ---

  // 1. LOCKED VIEW
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-12 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-teal-700"></div>
          
          <div className="inline-flex p-5 bg-teal-50 text-teal-600 rounded-full mb-6 ring-4 ring-teal-50/50">
            <Lock size={48} />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Secure Vault</h3>
          <p className="text-slate-500 mb-8 text-sm max-w-xs mx-auto">
            This information is encrypted end-to-end. Enter your family Master PIN to access.
          </p>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative">
                <input 
                    type="password" 
                    placeholder="••••" 
                    value={pin} 
                    onChange={(e) => setPin(e.target.value)} 
                    className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-slate-800"
                    autoFocus 
                    maxLength={10}
                />
            </div>
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? "Verifying..." : <><Unlock size={20} /> Unlock Vault</>}
            </button>
          </form>

          {userRole === 'Admin' && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                  <button onClick={handleEmergencyReset} className="text-xs text-slate-400 hover:text-rose-500 font-medium flex items-center justify-center gap-1.5 mx-auto transition-colors">
                    <RefreshCw size={12} /> Forgot PIN? (Emergency Reset)
                  </button>
              </div>
          )}
        </div>
      </div>
    );
  }

  // 2. UNLOCKED VIEW
  const health = activeTab === 'documents' ? getHealthStats() : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-teal-100 text-teal-700 p-2.5 rounded-xl"><Shield size={24}/></div>
            <div>
                <span className="block text-xs font-bold text-teal-600 uppercase tracking-wider">Vault Status</span>
                <span className="font-bold text-slate-800 flex items-center gap-2">Unlocked & Decrypted <Unlock size={14} className="text-slate-400"/></span>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            {activeTab === 'providers' && items.length > 0 && (
                <button onClick={handleShareList} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2.5 rounded-xl transition-colors border border-teal-100">
                    <Share size={16} /> Share List
                </button>
            )}
            <button onClick={() => { setIsUnlocked(false); setPin(''); }} className="flex-1 md:flex-none text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors">
                Lock 🔒
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {[{ id: 'documents', label: 'Documents', icon: FileText }, { id: 'providers', label: 'Providers', icon: User }, { id: 'notes', label: 'Secure Notes', icon: StickyNote }].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
                <button 
                    key={tab.id} 
                    onClick={() => { setActiveTab(tab.id); setNewItem({}); setTaggedUsers([]); }} 
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                        ${isActive ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                    `}
                >
                    <Icon size={18} /> {tab.label}
                </button>
            )
        })}
      </div>

      {/* Stats Bar (Docs Only) */}
      {activeTab === 'documents' && health && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">Essential Documents <Info size={14} className="text-slate-400"/></h4>
                    <span className={`text-xl font-bold ${health.score === 100 ? 'text-teal-600' : 'text-amber-500'}`}>{health.score}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ease-out rounded-full ${health.score === 100 ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${health.score}%` }}></div>
                </div>
            </div>
            {health.missing.length > 0 ? (
                <div className="flex-1 w-full bg-rose-50 border border-rose-100 p-4 rounded-xl">
                    <p className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-1"><AlertCircle size={14}/> Missing Essentials:</p>
                    <div className="flex flex-wrap gap-2">{health.missing.map(m => (<span key={m} className="text-[10px] uppercase font-bold bg-white text-rose-600 px-2 py-1 rounded border border-rose-100 shadow-sm">{m}</span>))}</div>
                </div>
            ) : (
                <div className="flex-1 w-full bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center gap-3"><CheckCircle2 className="text-teal-600" /><p className="text-sm font-bold text-teal-800">All essentials found. Great job!</p></div>
            )}
        </div>
      )}

      {/* The List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => {
            const isMentioned = activeTab === 'notes' && item.mentions?.includes(currentUser.uid);
            return (
              <div key={item.id} className={`relative group p-6 rounded-2xl shadow-sm border transition-all hover:-translate-y-1 hover:shadow-md ${activeTab === 'notes' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'} ${isMentioned ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                        onClick={() => handleShareItem(item)}
                        className="text-slate-400 hover:text-teal-600 p-2 rounded-full hover:bg-white transition-colors"
                        title="Share"
                    >
                        <Share size={18} />
                    </button>
                    {canEdit && (
                        <button 
                            onClick={() => handleDelete(item.id)} 
                            className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-white transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Content Renderers */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 pr-16">
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><FileText size={24}/></div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{decryptData(item.name, pin)}</h4>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600 space-y-1">
                        <p className="flex gap-2"><MapPin size={16} className="shrink-0 text-slate-400"/> {decryptData(item.location, pin)}</p>
                        {item.contact && <p className="flex gap-2"><User size={16} className="shrink-0 text-slate-400"/> {decryptData(item.contact, pin)}</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'providers' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 pr-16">
                        <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><User size={24}/></div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{decryptData(item.name, pin)}</h4>
                            <span className="inline-block mt-1 text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{decryptData(item.role, pin)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <button onClick={() => openMap(item.address)} className="w-full flex items-center text-left gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:text-teal-700 transition-colors group/btn">
                            <MapPin size={18} className="text-slate-400 group-hover/btn:text-teal-500"/>
                            <span className="text-sm truncate">{decryptData(item.address, pin)}</span>
                        </button>
                        <a href={`tel:${decryptData(item.phone, pin)}`} className="w-full flex items-center text-left gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:text-teal-700 transition-colors group/btn">
                            <Phone size={18} className="text-slate-400 group-hover/btn:text-teal-500"/>
                            <span className="text-sm font-mono">{decryptData(item.phone, pin)}</span>
                        </a>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-3">
                     <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200/50">
                         <StickyNote size={18} className="text-amber-600"/>
                         <h4 className="font-bold text-amber-900">{decryptData(item.title, pin)}</h4>
                     </div>
                     <p className="text-sm text-amber-900/80 whitespace-pre-wrap leading-relaxed font-medium font-sans">
                        {decryptData(item.content, pin)}
                     </p>
                     
                     {isMentioned && (
                        <div className="pt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                                <AtSign size={10} /> YOU ARE MENTIONED
                            </span>
                        </div>
                     )}
                  </div>
                )}
              </div>
            );
        })}
      </div>
      
      {/* Add New Form */}
      {canEdit && (
        <form onSubmit={handleSave} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mt-8">
          <div className="flex items-center gap-3 mb-6 text-slate-700 font-bold border-b border-slate-200 pb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Plus size={20} /></div>
            <h4 className="capitalize">Add New {activeTab.slice(0, -1)}</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            {activeTab === 'documents' && (
                <>
                <div className="relative">
                    <select 
                        value={docTypes.includes(newItem.name) ? newItem.name : (newItem.name ? 'Misc' : '')} 
                        onChange={(e) => {
                            if (e.target.value === 'Misc') setNewItem({...newItem, name: ''});
                            else setNewItem({...newItem, name: e.target.value});
                        }}
                        className={inputBase}
                    >
                        <option value="" disabled>Select Document Type</option>
                        {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {(!docTypes.includes(newItem.name) && newItem.name !== undefined) && (
                        <input 
                            placeholder="Enter Custom Name" 
                            value={newItem.name} 
                            onChange={e => setNewItem({...newItem, name: e.target.value})} 
                            required 
                            className={`${inputBase} mt-3`} 
                            autoFocus
                        />
                    )}
                </div>
                <input placeholder="Physical Location (e.g. Blue Safe)" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} required className={inputBase} />
                <input placeholder="Contact Person (Optional)" value={newItem.contact || ''} onChange={e => setNewItem({...newItem, contact: e.target.value})} className={`${inputBase} md:col-span-2`} />
                </>
            )}

            {activeTab === 'providers' && (
                <>
                <input placeholder="Name (e.g. Dr. Smith)" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required className={inputBase} />
                <input placeholder="Role (e.g. Cardiologist)" value={newItem.role || ''} onChange={e => setNewItem({...newItem, role: e.target.value})} required className={inputBase} />
                <input placeholder="Address" value={newItem.address || ''} onChange={e => setNewItem({...newItem, address: e.target.value})} required className={inputBase} />
                <input placeholder="Phone" value={newItem.phone || ''} onChange={e => setNewItem({...newItem, phone: e.target.value})} required className={inputBase} />
                </>
            )}

            {activeTab === 'notes' && (
                <>
                <input placeholder="Note Title" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} required className={`${inputBase} md:col-span-2 font-bold`} />
                <textarea placeholder="Secure Content..." value={newItem.content || ''} onChange={e => setNewItem({...newItem, content: e.target.value})} required rows={4} className={`${inputBase} md:col-span-2 resize-none`} />
                
                <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1"><AtSign size={12}/> Notify Team Members</p>
                    {members.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => (
                                <button key={m.id} type="button" onClick={() => toggleTag(m)} className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${taggedUsers.includes(m.id) ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{taggedUsers.includes(m.id) ? <CheckCircle2 size={14}/> : <User size={14}/>}{m.name}</button>
                            ))}
                        </div>
                    ) : ( <p className="text-xs text-slate-400 italic">Invite members to tag them here.</p> )}
                </div>
                </>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-200 flex items-center gap-2">
                <Lock size={18} /> Encrypt & Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default KeyInfo;

import React, { useState, useEffect, useRef } from 'react';
import { Category, PaymentMethod } from '../types';

interface ManageModalProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onUpdateCategories: (categories: Category[]) => void;
  onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
  onClose: () => void;
}

const ManageModal: React.FC<ManageModalProps> = ({ categories, paymentMethods, onUpdateCategories, onUpdatePaymentMethods, onClose }) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'payments'>('expense');
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('📦');
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!newItemName.trim()) return;

    if (editingId) {
      if (activeTab === 'payments') {
        onUpdatePaymentMethods(paymentMethods.map(p => 
          p.id === editingId ? { ...p, name: newItemName, icon: newItemIcon } : p
        ));
      } else {
        onUpdateCategories(categories.map(c => 
          c.id === editingId ? { ...c, name: newItemName, icon: newItemIcon } : c
        ));
      }
      setEditingId(null);
    } else {
      if (activeTab === 'payments') {
        const newPM: PaymentMethod = {
          id: Math.random().toString(36).substr(2, 9),
          name: newItemName,
          icon: newItemIcon,
        };
        onUpdatePaymentMethods([...paymentMethods, newPM]);
      } else {
        const newCat: Category = {
          id: Math.random().toString(36).substr(2, 9),
          name: newItemName,
          icon: newItemIcon,
          color: 'bg-slate-500',
          type: activeTab as 'income' | 'expense',
          isCustom: true
        };
        onUpdateCategories([...categories, newCat]);
      }
    }
    setNewItemName('');
    setNewItemIcon('📦');
  };

  const startEdit = (item: Category | PaymentMethod) => {
    setEditingId(item.id);
    setNewItemName(item.name);
    setNewItemIcon(item.icon);
    setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItemName('');
    setNewItemIcon('📦');
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === 'payments') {
      onUpdatePaymentMethods(paymentMethods.filter(p => p.id !== id));
    } else {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
    if (editingId === id) cancelEdit();
  };

  const baseIcons = ['💰', '📈', '💻', '🎁', '🍔', '🛍️', '🚗', '🎬', '🏥', '🛒', '💡', '📦', '💵', '💳', '🏦', '📱', '✈️', '🏠', '🎮', '🎓', '🏋️', '🔌', '🧴'];
  const displayIcons = Array.from(new Set([...baseIcons, newItemIcon]));

  useEffect(() => {
    cancelEdit();
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 border border-transparent dark:border-zinc-800 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Manage Assets</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 p-2 transition-colors font-bold">✕</button>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl">
            <button onClick={() => setActiveTab('expense')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-600'}`}>EXPENSES</button>
            <button onClick={() => setActiveTab('income')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'income' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-600'}`}>INCOME</button>
            <button onClick={() => setActiveTab('payments')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'payments' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-600'}`}>ACCOUNTS</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div className={`space-y-3 p-5 rounded-3xl transition-all duration-300 ${editingId ? 'bg-blue-50 dark:bg-blue-900/10 ring-2 ring-blue-500/20' : 'bg-slate-50 dark:bg-black/50'}`}>
            <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                {editingId ? 'Rename Asset' : 'Add New'}
                </label>
                {editingId && (
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full animate-pulse">EDITING</span>
                )}
            </div>
            <div className="flex gap-2">
              <select 
                value={newItemIcon} 
                onChange={e => setNewItemIcon(e.target.value)} 
                className="bg-white dark:bg-zinc-900 border-0 rounded-xl px-2 text-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 appearance-none cursor-pointer text-slate-900 dark:text-zinc-100 border border-transparent dark:border-zinc-800"
              >
                {displayIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
              <input 
                ref={inputRef}
                type="text" 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={activeTab === 'payments' ? "Account name..." : "Category name..."} 
                className="flex-1 bg-white dark:bg-zinc-900 border-0 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 font-medium text-slate-900 dark:text-zinc-100 border border-transparent dark:border-zinc-800" 
              />
              <button 
                onClick={handleSave} 
                className="bg-blue-600 text-white px-4 h-10 rounded-xl font-bold text-xs flex items-center justify-center shadow-lg active:scale-95 transition-all uppercase tracking-tight"
              >
                {editingId ? 'Save' : 'Add'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {(activeTab === 'payments' ? paymentMethods : categories.filter(c => c.type === activeTab)).map(item => {
              const isEditing = editingId === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => startEdit(item)}
                  className={`flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border rounded-2xl group cursor-pointer transition-all hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-sm ${isEditing ? 'border-blue-500 ring-2 ring-blue-500/10 scale-[1.02] shadow-md' : 'border-slate-100 dark:border-zinc-800'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${isEditing ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-50 dark:bg-black'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${isEditing ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>{item.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(item); }} 
                      className={`p-2 rounded-lg transition-all ${isEditing ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-300 dark:text-zinc-600 hover:text-blue-500'}`}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => deleteItem(item.id, e)} 
                      className="p-2 text-slate-300 dark:text-zinc-600 hover:text-red-500 rounded-lg transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageModal;

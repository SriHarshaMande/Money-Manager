
import React, { useState } from 'react';
import { Category, PaymentMethod } from '../types';

interface ManageModalProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onUpdateCategories: (categories: Category[]) => void;
  onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
  onClose: () => void;
}

const ManageModal: React.FC<ManageModalProps> = ({ categories, paymentMethods, onUpdateCategories, onUpdatePaymentMethods, onClose }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'payments'>('categories');
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('📦');

  const addItem = () => {
    if (!newItemName.trim()) return;

    if (activeTab === 'categories') {
      const newCat: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName,
        icon: newItemIcon,
        color: 'bg-slate-500',
        isCustom: true
      };
      onUpdateCategories([...categories, newCat]);
    } else {
      const newPM: PaymentMethod = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName,
        icon: newItemIcon,
      };
      onUpdatePaymentMethods([...paymentMethods, newPM]);
    }
    setNewItemName('');
    setNewItemIcon('📦');
  };

  const deleteItem = (id: string) => {
    if (activeTab === 'categories') {
      onUpdateCategories(categories.filter(c => c.id !== id));
    } else {
      onUpdatePaymentMethods(paymentMethods.filter(p => p.id !== id));
    }
  };

  const icons = ['💰', '🍔', '🛍️', '🚗', '🎬', '🏥', '🛒', '💡', '📦', '💵', '💳', '🏦', '📱', '✈️', '🏠', '🎮'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Manage Assets</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'payments' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              Payment Methods
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Section */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add New</p>
            <div className="flex gap-2">
              <select 
                value={newItemIcon} 
                onChange={e => setNewItemIcon(e.target.value)}
                className="bg-white border-0 rounded-xl px-2 text-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
              <input 
                type="text" 
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder={`Name of ${activeTab === 'categories' ? 'Category' : 'Method'}...`}
                className="flex-1 bg-white border-0 rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={addItem}
                className="bg-blue-600 text-white w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-2">
            {activeTab === 'categories' ? (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl group">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
                  <button 
                    onClick={() => deleteItem(cat.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              paymentMethods.map(pm => (
                <div key={pm.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl group">
                  <span className="text-xl">{pm.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{pm.name}</span>
                  <button 
                    onClick={() => deleteItem(pm.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageModal;

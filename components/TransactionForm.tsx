
import React, { useState, useRef, useMemo } from 'react';
import { TransactionType, Transaction, Category, PaymentMethod } from '../types';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  initialData?: Transaction;
  allTransactions?: Transaction[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onCancel, 
  categories, 
  paymentMethods, 
  initialData,
  allTransactions = []
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  
  // Filtering categories by type
  const availableCategories = useMemo(() => 
    categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense')), 
    [categories, type]
  );

  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId || availableCategories[0]?.id || ''
  );
  const [paymentMethodId, setPaymentMethodId] = useState<string>(initialData?.paymentMethodId || paymentMethods[0]?.id || '');
  const [note, setNote] = useState<string>(initialData?.note || '');
  const [isReturned, setIsReturned] = useState<boolean>(initialData?.isReturned || false);
  const [returnedDate, setReturnedDate] = useState<string>(
    initialData?.returnedDate ? initialData.returnedDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  
  const initialDateObj = initialData?.date ? new Date(initialData.date) : new Date();
  const [date, setDate] = useState<string>(initialDateObj.toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(initialDateObj.toTimeString().split(' ')[0].slice(0, 5));
  
  const [showSuggestions, setShowSuggestions] = useState(false);

  const noteContexts = useMemo(() => {
    const contexts: Record<string, Transaction> = {};
    const sorted = [...allTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach(t => {
      if (t.note.trim()) {
        contexts[t.note.trim().toLowerCase()] = t;
      }
    });
    return contexts;
  }, [allTransactions]);

  const filteredSuggestions = useMemo(() => {
    const query = note.trim().toLowerCase();
    if (!query) return [];
    
    return (Object.values(noteContexts) as Transaction[])
      .filter(t => t.note.toLowerCase().includes(query))
      .sort((a, b) => b.note.length - a.note.length)
      .slice(0, 5);
  }, [note, noteContexts]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'lent') {
      const newAvailable = categories.filter(c => c.type === (newType === 'income' ? 'income' : 'expense'));
      if (newAvailable.length > 0) setCategoryId(newAvailable[0].id);
    }
  };

  const selectSuggestion = (t: Transaction) => {
    setNote(t.note);
    if (t.type === type) {
        setCategoryId(t.categoryId || '');
        setPaymentMethodId(t.paymentMethodId);
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    const fullTimestamp = new Date(`${date}T${time}:00`).toISOString();
    
    onSave({
      amount: parseFloat(amount),
      type,
      categoryId: type === 'lent' ? undefined : categoryId,
      paymentMethodId,
      note,
      date: fullTimestamp,
      images: initialData?.images || [],
      isReturned: type === 'lent' ? isReturned : undefined,
      returnedDate: (type === 'lent' && isReturned) ? new Date(returnedDate).toISOString() : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh] border border-white/20">
        <div className="p-8 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{initialData ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={onCancel} className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 font-bold">✕</button>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>OUT</button>
            <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}>IN</button>
            <button type="button" onClick={() => handleTypeChange('lent')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${type === 'lent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>LENT</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Amount</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border-0 rounded-3xl py-6 pl-14 pr-6 text-3xl font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {type !== 'lent' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none appearance-none text-sm font-bold text-slate-700">
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                 <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Lent to (Person Name)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} required placeholder="Who did you lend to?" className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-bold" />
                 </div>
              )}

              {type !== 'lent' && (
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Asset / Account</label>
                    <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none appearance-none text-sm font-bold text-slate-700">
                    {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                    ))}
                    </select>
                </div>
              )}
            </div>

            {type === 'lent' && (
              <div className="bg-indigo-50/50 p-6 rounded-3xl space-y-4 border border-indigo-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${isReturned ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {isReturned ? '✓' : '⌛'}
                    </div>
                    <span className="text-sm font-bold text-slate-700">Has been returned?</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isReturned} 
                    onChange={e => setIsReturned(e.target.checked)}
                    className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </div>
                {isReturned && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Return Date</label>
                    <input type="date" value={returnedDate} onChange={e => setReturnedDate(e.target.value)} className="w-full bg-white border-0 rounded-xl p-3 text-sm font-bold shadow-sm" />
                  </div>
                )}
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Source Asset</label>
                    <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full bg-white border-0 rounded-xl p-3 focus:ring-4 focus:ring-blue-100 outline-none appearance-none text-sm font-bold text-slate-700 shadow-sm">
                    {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                    ))}
                    </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-bold" />
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-bold" />
            </div>

            {type !== 'lent' && (
              <div className="relative">
                <input 
                  type="text" 
                  value={note} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Note..." 
                  className="w-full bg-slate-50 border-0 rounded-2xl p-5 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium" 
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-[100%] left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      {filteredSuggestions.map((t, idx) => (
                        <button key={idx} type="button" onClick={() => selectSuggestion(t)} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all flex items-center justify-between group">
                          <span className="truncate">{t.note}</span>
                          <span className="text-blue-300 text-xs">↵</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 py-5 font-bold text-slate-400 hover:bg-slate-50 rounded-3xl transition-colors">Discard</button>
              <button type="submit" className="flex-1 py-5 font-black bg-blue-600 text-white hover:bg-blue-700 rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-widest text-xs">Confirm</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;

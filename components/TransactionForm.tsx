
import React, { useState, useRef } from 'react';
import { TransactionType, Transaction, Category, PaymentMethod } from '../types';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onCancel, categories, paymentMethods, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || categories[0]?.id || '');
  const [paymentMethodId, setPaymentMethodId] = useState<string>(initialData?.paymentMethodId || paymentMethods[0]?.id || '');
  const [note, setNote] = useState<string>(initialData?.note || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  
  const initialDateObj = initialData?.date ? new Date(initialData.date) : new Date();
  const [date, setDate] = useState<string>(initialDateObj.toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(initialDateObj.toTimeString().split(' ')[0].slice(0, 5));
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isVehicleRelated = selectedCategory?.name.toLowerCase().includes('fuel') || 
                          selectedCategory?.name.toLowerCase().includes('transport');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFuelTemplate = () => {
    setNote("10L @ 102 - 45000KM");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    const fullTimestamp = new Date(`${date}T${time}:00`).toISOString();
    
    onSave({
      amount: parseFloat(amount),
      type,
      categoryId,
      paymentMethodId,
      note,
      date: fullTimestamp,
      images,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh] border border-white/20">
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{initialData ? 'Update Record' : 'New Entry'}</h2>
            <button onClick={onCancel} className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 font-bold">✕</button>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button onClick={() => setType('expense')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>EXPENSE</button>
            <button onClick={() => setType('income')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}>INCOME</button>
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
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none appearance-none text-sm font-bold text-slate-700">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Asset</label>
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none appearance-none text-sm font-bold text-slate-700">
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Time</label>
                <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-bold text-slate-700" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Note</label>
                {isVehicleRelated && (
                  <button type="button" onClick={handleFuelTemplate} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">QUICK LOG TEMPLATE</button>
                )}
              </div>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={isVehicleRelated ? "Example: 10L @ 102 - 12000KM" : "Brief description..."} className="w-full bg-slate-50 border-0 rounded-2xl p-5 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Receipts / Evidence</label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden group shadow-md">
                    <img src={img} alt="receipt" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity">DELETE</button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all font-light text-4xl">+</button>
                <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
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

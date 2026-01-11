
import React, { useState, useMemo } from 'react';
import { Transaction, PartialReturn } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface LentViewProps {
  transactions: Transaction[];
  onToggleReturned: (id: string) => void;
  onAddPartial: (id: string, partial: PartialReturn) => void;
  onEdit: (t: Transaction) => void;
}

const LentView: React.FC<LentViewProps> = ({ transactions, onToggleReturned, onAddPartial, onEdit }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'returned'>('pending');
  const [activePartialId, setActivePartialId] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialDate, setPartialDate] = useState(new Date().toISOString().split('T')[0]);

  const lentTransactions = useMemo(() => {
    const list = transactions.filter(t => t.type === 'lent');
    if (filter === 'pending') return list.filter(t => !t.isReturned);
    if (filter === 'returned') return list.filter(t => t.isReturned);
    return list;
  }, [transactions, filter]);

  const summary = useMemo(() => {
    const list = transactions.filter(t => t.type === 'lent');
    const total = list.reduce((sum, t) => sum + t.amount, 0);
    
    const getReturnedAmount = (t: Transaction) => {
      if (t.isReturned) return t.amount;
      return (t.partialReturns || []).reduce((s, p) => s + p.amount, 0);
    };

    const returned = list.reduce((sum, t) => sum + getReturnedAmount(t), 0);
    const pending = total - returned;
    
    return { total, pending, returned };
  }, [transactions]);

  const handleAddPartialSubmit = (id: string) => {
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    onAddPartial(id, {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      date: new Date(partialDate).toISOString()
    });
    
    setPartialAmount('');
    setActivePartialId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[3rem] p-8 text-white shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Outstanding</p>
        <h2 className="text-4xl font-black mb-6">{formatCurrency(summary.pending)}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Lent</p>
            <p className="text-lg font-bold">{formatCurrency(summary.total)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Returned</p>
            <p className="text-lg font-bold text-green-300 dark:text-green-400">{formatCurrency(summary.returned)}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-200/50 dark:bg-zinc-900 p-1 rounded-2xl transition-colors">
        {(['pending', 'returned', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
              filter === f ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-zinc-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {lentTransactions.length > 0 ? (
          lentTransactions.map(t => {
            const returnedAmount = (t.partialReturns || []).reduce((s, p) => s + p.amount, 0);
            const remaining = t.amount - returnedAmount;
            const progress = (returnedAmount / t.amount) * 100;

            return (
              <div key={t.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner ${t.isReturned ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                    {t.isReturned ? '✓' : '🤝'}
                  </div>
                  
                  <div className="flex-1 min-w-0" onClick={() => onEdit(t)}>
                    <h4 className="font-bold text-slate-800 dark:text-zinc-100 truncate">{t.note}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                      Lent: {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-black text-lg ${t.isReturned ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-zinc-100'}`}>
                        {formatCurrency(t.amount)}
                    </span>
                    {!t.isReturned && (
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/10 px-2 py-0.5 rounded-full uppercase">
                        Bal: {formatCurrency(remaining)}
                      </span>
                    )}
                  </div>
                </div>

                {!t.isReturned && (
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-700 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    {activePartialId === t.id ? (
                      <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-3xl space-y-3 border border-slate-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
                        <div className="flex gap-2">
                           <input 
                             type="number" 
                             value={partialAmount}
                             onChange={e => setPartialAmount(e.target.value)}
                             placeholder="Amount"
                             className="flex-1 bg-white dark:bg-zinc-900 border-0 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 shadow-sm text-slate-900 dark:text-zinc-100"
                           />
                           <input 
                             type="date" 
                             value={partialDate}
                             onChange={e => setPartialDate(e.target.value)}
                             className="flex-1 bg-white dark:bg-zinc-900 border-0 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 shadow-sm text-slate-900 dark:text-zinc-100"
                           />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setActivePartialId(null)}
                            className="flex-1 py-2 text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleAddPartialSubmit(t.id)}
                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
                          >
                            Save Payment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                         <button 
                           onClick={() => setActivePartialId(t.id)}
                           className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full uppercase tracking-tight hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                         >
                           + Add Payment
                         </button>
                         <div className="flex gap-1.5">
                            <button 
                              onClick={() => onToggleReturned(t.id)}
                              className="text-[10px] font-black text-slate-400 dark:text-zinc-600 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full uppercase tracking-tight hover:text-green-500 transition-colors"
                            >
                              Mark Full
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {t.partialReturns && t.partialReturns.length > 0 && (
                   <div className="border-t border-slate-50 dark:border-zinc-800 pt-3 space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest px-1">Payment History</p>
                      <div className="space-y-1.5">
                         {t.partialReturns.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-slate-50/50 dark:bg-black/20 p-2 rounded-xl text-[11px] font-medium border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 transition-colors">
                               <span className="text-slate-500 dark:text-zinc-500">
                                 {new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                               </span>
                               <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatCurrency(p.amount)}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {t.isReturned && t.returnedDate && (
                  <p className="text-[9px] text-green-500 dark:text-green-600 font-bold uppercase italic text-center">
                    Fully Returned on {new Date(t.returnedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-zinc-800">
            <div className="text-5xl mb-4 opacity-20">💸</div>
            <p className="text-slate-400 dark:text-zinc-600 text-sm font-bold uppercase tracking-widest">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LentView;

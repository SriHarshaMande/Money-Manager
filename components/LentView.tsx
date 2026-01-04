
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface LentViewProps {
  transactions: Transaction[];
  onToggleReturned: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

const LentView: React.FC<LentViewProps> = ({ transactions, onToggleReturned, onEdit }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'returned'>('pending');

  const lentTransactions = useMemo(() => {
    const list = transactions.filter(t => t.type === 'lent');
    if (filter === 'pending') return list.filter(t => !t.isReturned);
    if (filter === 'returned') return list.filter(t => t.isReturned);
    return list;
  }, [transactions, filter]);

  const summary = useMemo(() => {
    const list = transactions.filter(t => t.type === 'lent');
    const total = list.reduce((sum, t) => sum + t.amount, 0);
    const pending = list.filter(t => !t.isReturned).reduce((sum, t) => sum + t.amount, 0);
    const returned = list.filter(t => t.isReturned).reduce((sum, t) => sum + t.amount, 0);
    return { total, pending, returned };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-xl relative overflow-hidden">
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
            <p className="text-lg font-bold text-green-300">{formatCurrency(summary.returned)}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-2xl">
        {(['pending', 'returned', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
              filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {lentTransactions.length > 0 ? (
          lentTransactions.map(t => (
            <div key={t.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
              <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner ${t.isReturned ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                {t.isReturned ? '✓' : '🤝'}
              </div>
              
              <div className="flex-1 min-w-0" onClick={() => onEdit(t)}>
                <h4 className="font-bold text-slate-800 truncate">{t.note}</h4>
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {t.isReturned && t.returnedDate && (
                    <p className="text-[9px] text-green-500 font-bold uppercase italic">
                        Returned on {new Date(t.returnedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <span className={`font-black text-lg ${t.isReturned ? 'text-green-600' : 'text-slate-900'}`}>
                    {formatCurrency(t.amount)}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={!!t.isReturned} 
                    onChange={() => onToggleReturned(t.id)} 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="text-5xl mb-4 opacity-20">💸</div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LentView;

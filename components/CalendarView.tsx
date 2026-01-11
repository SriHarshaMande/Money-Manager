
import React, { useState, useMemo } from 'react';
import { Transaction, Category, PaymentMethod } from '../types';

interface CalendarViewProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onEditTransaction: (t: Transaction) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ transactions, categories, paymentMethods, onEditTransaction }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const transactionsForCurrentMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate]);

  const displayedTransactions = useMemo(() => {
    if (!selectedDate) return transactionsForCurrentMonth;
    return transactionsForCurrentMonth.filter(t => {
      const d = new Date(t.date);
      return d.toDateString() === selectedDate.toDateString();
    });
  }, [transactionsForCurrentMonth, selectedDate]);

  const getDayTypes = (date: Date) => {
    const daily = transactions.filter(t => new Date(t.date).toDateString() === date.toDateString());
    return {
      hasIncome: daily.some(t => t.type === 'income'),
      hasExpense: daily.some(t => t.type === 'expense' || t.type === 'lent')
    };
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{monthName}</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{yearName}</p>
          </div>
          <div className="flex gap-2 bg-slate-50 dark:bg-black p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all rounded-lg text-slate-400">←</button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Today</button>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all rounded-lg text-slate-400">→</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <span key={day} className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-10"></div>;
            
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const { hasIncome, hasExpense } = getDayTypes(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`h-12 flex flex-col items-center justify-center rounded-2xl relative transition-all ${
                  isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-black text-slate-700 dark:text-zinc-400'
                } ${isToday && !isSelected ? 'border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                <div className="flex gap-0.5 mt-1">
                  {hasIncome && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></div>}
                  {hasExpense && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`}></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-4 pb-20">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            {selectedDate 
              ? `${selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} Records` 
              : `${monthName} Summary`}
          </h3>
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{displayedTransactions.length} items</span>
        </div>

        <div className="space-y-3">
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map(t => {
              const category = categories.find(c => c.id === t.categoryId);
              const tDate = new Date(t.date);
              return (
                <div 
                  key={t.id} 
                  onClick={() => onEditTransaction(t)}
                  className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer border border-transparent dark:border-zinc-800/50 hover:border-blue-100 dark:hover:border-blue-900"
                >
                  <div className={`w-12 h-12 rounded-2xl ${t.type === 'lent' ? 'bg-indigo-500' : (category?.color || 'bg-slate-200 dark:bg-zinc-800')} flex items-center justify-center text-xl`}>
                    {t.type === 'lent' ? '🤝' : (category?.icon || '📦')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">{t.note || category?.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      {tDate.toLocaleDateString([], { day: 'numeric', month: 'short' })} • {tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${t.type === 'expense' || t.type === 'lent' ? 'text-slate-900 dark:text-zinc-100' : 'text-green-600 dark:text-green-400'}`}>
                      {t.type === 'expense' || t.type === 'lent' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-zinc-900/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
              <div className="text-4xl mb-3 opacity-30">🗓️</div>
              <p className="text-slate-400 dark:text-zinc-600 text-sm font-medium italic">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

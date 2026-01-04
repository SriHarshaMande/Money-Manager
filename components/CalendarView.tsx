
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
    // Padding for start of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  // All transactions for the currently viewed month, sorted descending by date
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

  // If a specific day is clicked, filter the monthly list further
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
      hasExpense: daily.some(t => t.type === 'expense')
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
      {/* Calendar Grid Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
            <p className="text-xs text-slate-400 font-medium">{yearName}</p>
          </div>
          <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm transition-all rounded-lg text-slate-400">←</button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">Today</button>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm transition-all rounded-lg text-slate-400">→</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</span>
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
                  isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50 text-slate-700'
                } ${isToday && !isSelected ? 'border border-blue-200' : ''}`}
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

      {/* Monthly/Daily List Section */}
      <div className="flex-1 space-y-4 pb-20">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {selectedDate 
              ? `${selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} Records` 
              : `${monthName} Summary`}
            {!selectedDate && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">DESC</span>}
          </h3>
          <span className="text-xs text-slate-400 font-medium">{displayedTransactions.length} items</span>
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
                  className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer group hover:border-blue-100 border border-transparent"
                >
                  <div className={`w-12 h-12 rounded-2xl ${category?.color || 'bg-slate-200'} flex items-center justify-center text-xl`}>
                    {category?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{t.note || category?.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400 font-medium">
                        {tDate.toLocaleDateString([], { day: 'numeric', month: 'short' })} • {tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${t.type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                    {t.images && t.images.length > 0 && <span className="text-[9px] font-bold text-blue-400">📷 {t.images.length}</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="text-4xl mb-3 opacity-30">🗓️</div>
              <p className="text-slate-400 text-sm font-medium">No records found for this selection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

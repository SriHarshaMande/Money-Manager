
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, Category } from '../types';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

type Period = 'day' | 'week' | 'month' | 'custom';

const StatsView: React.FC<StatsViewProps> = ({ transactions, categories }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  
  // Date range state
  const [viewDate, setViewDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const safeCategories = Array.isArray(categories) ? categories : [];

  const dateRange = useMemo(() => {
    const start = new Date(viewDate);
    const end = new Date(viewDate);

    if (period === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start, end };
  }, [period, viewDate, customStart, customEnd]);

  const filteredTransactions = useMemo(() => {
    const { start, end } = dateRange;
    const safeT = Array.isArray(transactions) ? transactions : [];
    
    return safeT.filter(t => {
      const d = new Date(t.date);
      const inRange = d >= start && d <= end;
      if (!inRange) return false;
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;
      return true;
    });
  }, [transactions, dateRange, selectedCategoryId]);

  const categoryBreakdown = useMemo(() => {
    // Only calculate category breakdown if 'all' is selected
    if (selectedCategoryId !== 'all') return [];

    const totals = filteredTransactions
      .filter(t => t.type === typeFilter)
      .reduce((acc: any, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
      }, {});

    const totalAmount = Object.values(totals).reduce((sum: number, val: any) => sum + val, 0) as number;

    return Object.keys(totals).map(catId => {
      const cat = safeCategories.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || 'Other',
        value: totals[catId],
        percentage: totalAmount > 0 ? (totals[catId] / totalAmount) * 100 : 0,
        color: cat?.color || 'bg-slate-500',
        icon: cat?.icon || '📦'
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, typeFilter, safeCategories, selectedCategoryId]);

  const noteBreakdown = useMemo(() => {
    // Only calculate note breakdown if a specific category is selected
    if (selectedCategoryId === 'all') return [];

    const totals = filteredTransactions
      .filter(t => t.type === typeFilter)
      .reduce((acc: any, t) => {
        const note = t.note.trim() || 'Unspecified';
        acc[note] = (acc[note] || 0) + t.amount;
        return acc;
      }, {});

    const totalAmount = Object.values(totals).reduce((sum: number, val: any) => sum + val, 0) as number;

    return Object.keys(totals).map(note => ({
      name: note,
      value: totals[note],
      percentage: totalAmount > 0 ? (totals[note] / totalAmount) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, typeFilter, selectedCategoryId]);

  const barData = useMemo(() => {
    const groups: any = {};
    filteredTransactions.forEach(t => {
      const label = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!groups[label]) groups[label] = { name: label, income: 0, expense: 0 };
      if (t.type === 'income') groups[label].income += t.amount;
      else groups[label].expense += t.amount;
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredTransactions]);

  const navigateDate = (direction: number) => {
    const next = new Date(viewDate);
    if (period === 'day') next.setDate(next.getDate() + direction);
    else if (period === 'week') next.setDate(next.getDate() + (direction * 7));
    else if (period === 'month') next.setMonth(next.getMonth() + direction);
    setViewDate(next);
  };

  const getRangeLabel = () => {
    const { start, end } = dateRange;
    if (period === 'day') return start.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    if (period === 'month') return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getColorHex = (twClass: string) => {
    const colors: Record<string, string> = {
      'bg-orange-500': '#f97316', 'bg-pink-500': '#ec4899', 'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#a855f7', 'bg-red-500': '#ef4444', 'bg-emerald-500': '#10b981',
      'bg-yellow-500': '#eab308', 'bg-green-600': '#16a34a', 'bg-indigo-600': '#4f46e5',
      'bg-slate-500': '#64748b',
    };
    return colors[twClass] || '#94a3b8';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
  };

  const selectedCategory = useMemo(() => 
    safeCategories.find(c => c.id === selectedCategoryId),
    [selectedCategoryId, safeCategories]
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Dynamic Date Selection Header */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {(['day', 'week', 'month', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {period !== 'custom' ? (
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => navigateDate(-1)} 
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 active:scale-90 transition-transform"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">{getRangeLabel()}</p>
              <button 
                onClick={() => setViewDate(new Date())}
                className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter hover:underline"
              >
                Go to Today
              </button>
            </div>
            <button 
              onClick={() => navigateDate(1)} 
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 active:scale-90 transition-transform"
            >
              →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">From</label>
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">To</label>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Horizontal Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategoryId === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          All Categories
        </button>
        {safeCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategoryId === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Main Breakdown Section */}
      <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className={`w-2 h-6 rounded-full ${typeFilter === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></span>
            {selectedCategoryId === 'all' ? 'Total Breakdown' : `${selectedCategory?.name} Details`}
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setTypeFilter('expense')} 
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${typeFilter === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => setTypeFilter('income')} 
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${typeFilter === 'income' ? 'bg-white shadow-sm text-green-500' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>
        </div>

        {selectedCategoryId === 'all' ? (
          <>
            <div className="h-[220px] w-full">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <span className="text-4xl mb-2 opacity-30">📉</span>
                  <p className="text-xs font-medium">No {typeFilter} in this range</p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-sm shadow-sm`}>{cat.icon}</span>
                      <span className="font-bold text-slate-700">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(cat.value)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{cat.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`w-12 h-12 rounded-2xl ${selectedCategory?.color} flex items-center justify-center text-2xl shadow-sm`}>{selectedCategory?.icon}</span>
                <div>
                  <h4 className="font-bold text-slate-800">{selectedCategory?.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Category</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${typeFilter === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                  {formatCurrency(noteBreakdown.reduce((sum, n) => sum + n.value, 0))}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Note-level Distribution</h5>
              {noteBreakdown.length > 0 ? noteBreakdown.map((note, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[60%]">{note.name}</span>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(note.value)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{note.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${selectedCategory?.color || 'bg-blue-500'} rounded-full transition-all duration-700`}
                      style={{ width: `${note.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-300">
                  <p className="text-xs font-medium italic">No detailed notes for this selection</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Trend Overview */}
      <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
          Activity Trend
        </h3>
        <div className="h-[200px] w-full">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <span className="text-4xl mb-2 opacity-30">📊</span>
               <p className="text-xs font-medium">No activity for trend chart</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StatsView;

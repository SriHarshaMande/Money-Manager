
import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { Transaction, Category, TransactionType } from '../types';
import { calculateFuelStats, FuelAnalysisResult, formatCurrency } from '../utils/financeUtils';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';

const StatsView: React.FC<StatsViewProps> = ({ transactions, categories }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  
  const [fuelData, setFuelData] = useState<FuelAnalysisResult | null>(null);

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
    } else if (period === 'quarter') {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'all') {
      return { start: new Date(0), end: new Date(8640000000000000) };
    } else {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start, end };
  }, [period, viewDate, customStart, customEnd]);

  const isTypeMatch = (t: Transaction, filter: 'income' | 'expense') => {
    if (filter === 'expense') {
      return t.type === 'expense' || (t.type === 'lent' && !t.isReturned);
    }
    return t.type === 'income';
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = dateRange;
    const safeT = Array.isArray(transactions) ? transactions : [];
    
    return safeT.filter(t => {
      const d = new Date(t.date);
      const inRange = d >= start && d <= end;
      if (!inRange) return false;
      
      if (selectedCategoryId !== 'all') {
        if (selectedCategoryId === 'lent-virtual-cat') {
            return t.type === 'lent';
        }
        if (t.categoryId !== selectedCategoryId) return false;
      }
      return true;
    });
  }, [transactions, dateRange, selectedCategoryId]);

  const totalRangeAmount = useMemo(() => {
    return filteredTransactions
      .filter(t => isTypeMatch(t, typeFilter))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions, typeFilter]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === 'lent-virtual-cat') {
        return { id: 'lent-virtual-cat', name: 'Money Lent', icon: '🤝', color: 'bg-indigo-500', type: 'expense' } as Category;
    }
    return safeCategories.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId, safeCategories]);

  const categoryTrendData = useMemo(() => {
    if (selectedCategoryId === 'all') return [];
    
    const trend = [];
    const now = new Date(viewDate);
    
    if (period === 'year' || period === 'all') {
      const baseYear = period === 'all' ? new Date().getFullYear() : now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const targetYear = baseYear - i;
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            const matchesCategory = selectedCategoryId === 'lent-virtual-cat' ? t.type === 'lent' : t.categoryId === selectedCategoryId;
            return tDate.getFullYear() === targetYear && matchesCategory && isTypeMatch(t, typeFilter);
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label: targetYear.toString(), amount: total });
      }
    } else if (period === 'day') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            const matchesCategory = selectedCategoryId === 'lent-virtual-cat' ? t.type === 'lent' : t.categoryId === selectedCategoryId;
            return tDate.toDateString() === d.toDateString() && matchesCategory && isTypeMatch(t, typeFilter);
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label, amount: total });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        const month = d.getMonth();
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            const matchesCategory = selectedCategoryId === 'lent-virtual-cat' ? t.type === 'lent' : t.categoryId === selectedCategoryId;
            return tDate.getFullYear() === year && tDate.getMonth() === month && matchesCategory && isTypeMatch(t, typeFilter);
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label: monthLabel, amount: total });
      }
    }
    return trend;
  }, [selectedCategoryId, transactions, typeFilter, period, viewDate]);

  useEffect(() => {
    const isVehicleRelated = selectedCategory?.name.toLowerCase().includes('fuel') || 
                            selectedCategory?.name.toLowerCase().includes('transport');
    
    if (isVehicleRelated && transactions.length > 0) {
      const result = calculateFuelStats(transactions);
      setFuelData(result);
    } else {
      setFuelData(null);
    }
  }, [selectedCategoryId, transactions, selectedCategory]);

  const categoryBreakdown = useMemo(() => {
    if (selectedCategoryId !== 'all') return [];
    const totals = filteredTransactions
      .filter(t => isTypeMatch(t, typeFilter))
      .reduce((acc: any, t) => {
        const catId = t.categoryId || (t.type === 'lent' ? 'lent-virtual-cat' : 'unknown-cat');
        acc[catId] = (acc[catId] || 0) + t.amount;
        return acc;
      }, {});

    const totalAmount = Object.values(totals).reduce((sum: number, val: any) => sum + val, 0) as number;

    return Object.keys(totals).map(catId => {
      let cat = safeCategories.find(c => c.id === catId);
      if (!cat && catId === 'lent-virtual-cat') {
          cat = { id: 'lent-virtual-cat', name: 'Money Lent', icon: '🤝', color: 'bg-indigo-500', type: 'expense' };
      }
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

  const getColorHex = (twClass: string) => {
    const colors: Record<string, string> = {
      'bg-orange-500': '#f97316', 'bg-pink-500': '#ec4899', 'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#a855f7', 'bg-red-500': '#ef4444', 'bg-emerald-500': '#10b981',
      'bg-yellow-500': '#eab308', 'bg-green-600': '#16a34a', 'bg-indigo-600': '#4f46e5',
      'bg-indigo-500': '#6366f1', 'bg-slate-500': '#64748b',
    };
    return colors[twClass] || '#94a3b8';
  };

  const navigatePeriod = (direction: number) => {
    if (period === 'all') return;
    const d = new Date(viewDate);
    if (period === 'day') d.setDate(d.getDate() + direction);
    else if (period === 'week') d.setDate(d.getDate() + direction * 7);
    else if (period === 'month') d.setMonth(d.getMonth() + direction);
    else if (period === 'quarter') d.setMonth(d.getMonth() + direction * 3);
    else if (period === 'year') d.setFullYear(d.getFullYear() + direction);
    setViewDate(d);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4 transition-colors">
        <div className="flex bg-slate-100 dark:bg-black p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['day', 'week', 'month', 'quarter', 'year', 'all', 'custom'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${period === p ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-zinc-600'}`}>{p}</button>
          ))}
        </div>
        {period !== 'custom' && period !== 'all' && (
          <div className="flex items-center justify-between px-2">
            <button onClick={() => navigatePeriod(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-black rounded-full text-slate-400 dark:text-zinc-600 text-lg active:scale-90 transition-transform">←</button>
            <div className="text-center font-bold text-slate-800 dark:text-zinc-100 text-sm italic">
              View Filter Active
            </div>
            <button onClick={() => navigatePeriod(1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-black rounded-full text-slate-400 dark:text-zinc-600 text-lg active:scale-90 transition-transform">→</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">{typeFilter === 'expense' ? 'Total Expenses' : 'Total Income'}</p>
          <h2 className={`text-3xl font-black ${typeFilter === 'expense' ? 'text-slate-900 dark:text-zinc-100' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(totalRangeAmount)}</h2>
        </div>
        <div className="flex bg-slate-100 dark:bg-black p-1 rounded-2xl">
           <button onClick={() => setTypeFilter('expense')} className={`px-4 py-2 text-[10px] font-bold rounded-xl ${typeFilter === 'expense' ? 'bg-white dark:bg-zinc-800 shadow-sm text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-zinc-600'}`}>Expense</button>
           <button onClick={() => setTypeFilter('income')} className={`px-4 py-2 text-[10px] font-bold rounded-xl ${typeFilter === 'income' ? 'bg-white dark:bg-zinc-800 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-zinc-600'}`}>Income</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
        <button onClick={() => setSelectedCategoryId('all')} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all ${selectedCategoryId === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800'}`}>All Categories</button>
        {safeCategories.filter(c => c.type === typeFilter).map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`px-4 py-2.5 rounded-full text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800'}`}>
            <span>{cat.icon}</span><span>{cat.name}</span>
          </button>
        ))}
      </div>

      {selectedCategoryId !== 'all' && (
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Historical Trend</h3>
           </div>
           <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={categoryTrendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#111', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(val: number) => [formatCurrency(val), 'Amount']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>
      )}

      <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-zinc-100 mb-6">Distribution</h3>
        
        {categoryBreakdown.length > 0 ? (
          <div className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                    {categoryBreakdown.map((e, i) => <Cell key={`cell-${i}`} fill={getColorHex(e.color)} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#111', color: '#fff' }}
                    formatter={(v: number) => formatCurrency(v)} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryBreakdown.map(cat => (
                <div key={cat.id} className="group cursor-pointer" onClick={() => setSelectedCategoryId(cat.id)}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 dark:text-zinc-200">
                    <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(cat.color) }}></span>
                      {cat.icon} {cat.name}
                    </span>
                    <span>{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 dark:bg-black rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} transition-all duration-500`} style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center py-10 text-slate-300 dark:text-zinc-700 text-xs italic">No data found for this period</p>
        )}
      </section>
    </div>
  );
};

export default StatsView;


import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { Transaction, Category } from '../types';
import { calculateFuelStats, FuelAnalysisResult, formatCurrency } from '../utils/financeUtils';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

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

  const totalRangeAmount = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === typeFilter)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions, typeFilter]);

  const selectedCategory = useMemo(() => 
    safeCategories.find(c => c.id === selectedCategoryId),
    [selectedCategoryId, safeCategories]
  );

  const categoryTrendData = useMemo(() => {
    if (selectedCategoryId === 'all') return [];
    
    const trend = [];
    const now = new Date(viewDate);
    
    // Determine granularity and count based on period
    if (period === 'year') {
      // Show last 5 years
      for (let i = 4; i >= 0; i--) {
        const targetYear = now.getFullYear() - i;
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === targetYear && t.categoryId === selectedCategoryId && t.type === typeFilter;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label: targetYear.toString(), amount: total });
      }
    } else if (period === 'quarter') {
      // Show last 6 quarters
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const q = Math.floor(d.getMonth() / 3) + 1;
        const y = d.getFullYear();
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            const tQ = Math.floor(tDate.getMonth() / 3) + 1;
            return tDate.getFullYear() === y && tQ === q && t.categoryId === selectedCategoryId && t.type === typeFilter;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label: `Q${q} ${y}`, amount: total });
      }
    } else if (period === 'day') {
      // Show last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate.toDateString() === d.toDateString() && t.categoryId === selectedCategoryId && t.type === typeFilter;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label, amount: total });
      }
    } else if (period === 'week') {
      // Show last 6 weeks
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
        const dayOfWeek = d.getDay();
        const startOfWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59);
        const label = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startOfWeek && tDate <= endOfWeek && t.categoryId === selectedCategoryId && t.type === typeFilter;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        trend.push({ label, amount: total });
      }
    } else {
      // Default: Last 6 Months (for 'month' or 'custom')
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        const month = d.getMonth();
        const total = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month && t.categoryId === selectedCategoryId && t.type === typeFilter;
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
  }, [selectedCategoryId, transactions]);

  const categoryBreakdown = useMemo(() => {
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

  const getColorHex = (twClass: string) => {
    const colors: Record<string, string> = {
      'bg-orange-500': '#f97316', 'bg-pink-500': '#ec4899', 'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#a855f7', 'bg-red-500': '#ef4444', 'bg-emerald-500': '#10b981',
      'bg-yellow-500': '#eab308', 'bg-green-600': '#16a34a', 'bg-indigo-600': '#4f46e5',
      'bg-slate-500': '#64748b',
    };
    return colors[twClass] || '#94a3b8';
  };

  const navigatePeriod = (direction: number) => {
    const d = new Date(viewDate);
    if (period === 'day') d.setDate(d.getDate() + direction);
    else if (period === 'week') d.setDate(d.getDate() + direction * 7);
    else if (period === 'month') d.setMonth(d.getMonth() + direction);
    else if (period === 'quarter') d.setMonth(d.getMonth() + direction * 3);
    else if (period === 'year') d.setFullYear(d.getFullYear() + direction);
    setViewDate(d);
  };

  const getPeriodLabel = () => {
    if (period === 'day') return viewDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    if (period === 'week') {
      const { start, end } = dateRange;
      return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    }
    if (period === 'month') return viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (period === 'quarter') {
      const quarter = Math.floor(viewDate.getMonth() / 3) + 1;
      return `Q${quarter} ${viewDate.getFullYear()}`;
    }
    if (period === 'year') return viewDate.getFullYear().toString();
    return 'Custom Range';
  };

  const getTrendTitle = () => {
    switch(period) {
      case 'year': return 'Yearly Trend';
      case 'quarter': return 'Quarterly Trend';
      case 'week': return 'Weekly Trend';
      case 'day': return 'Daily Trend';
      default: return 'Monthly Trend';
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 space-y-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['day', 'week', 'month', 'quarter', 'year', 'custom'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{p}</button>
          ))}
        </div>
        {period !== 'custom' ? (
          <div className="flex items-center justify-between px-2">
            <button onClick={() => navigatePeriod(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 text-lg active:scale-90 transition-transform">←</button>
            <div className="text-center font-bold text-slate-800 text-sm">
              {getPeriodLabel()}
            </div>
            <button onClick={() => navigatePeriod(1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 text-lg active:scale-90 transition-transform">→</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-50 p-3 rounded-2xl text-xs font-bold border-0 outline-none" />
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-50 p-3 rounded-2xl text-xs font-bold border-0 outline-none" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{typeFilter === 'expense' ? 'Total Expenses' : 'Total Income'}</p>
          <h2 className={`text-3xl font-black ${typeFilter === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>{formatCurrency(totalRangeAmount)}</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
           <button onClick={() => setTypeFilter('expense')} className={`px-4 py-2 text-[10px] font-bold rounded-xl ${typeFilter === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-slate-500'}`}>Expense</button>
           <button onClick={() => setTypeFilter('income')} className={`px-4 py-2 text-[10px] font-bold rounded-xl ${typeFilter === 'income' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>Income</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
        <button onClick={() => setSelectedCategoryId('all')} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all ${selectedCategoryId === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>All Categories</button>
        {safeCategories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`px-4 py-2.5 rounded-full text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>
            <span>{cat.icon}</span><span>{cat.name}</span>
          </button>
        ))}
      </div>

      {selectedCategoryId !== 'all' && (
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4 animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-800">{getTrendTitle()}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Historical View</p>
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
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                    formatter={(val: number) => [formatCurrency(val), 'Amount']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>
      )}

      {fuelData && (
        <section className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl animate-in fade-in slide-in-from-top duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">⛽ Fuel Analytics</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Processed from Expense Records</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg. Mileage</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{fuelData.avgMileage?.toFixed(1)}</span>
                <span className="text-xs opacity-50">km/L</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cost per KM</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">₹{fuelData.avgCostPerKm?.toFixed(2)}</span>
                <span className="text-xs opacity-50">/km</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl">
              <p className="text-xs leading-relaxed italic opacity-90">"{fuelData.efficiencySummary}"</p>
            </div>
            {fuelData.logPoints && fuelData.logPoints.length > 0 && (
              <div className="h-[140px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelData.logPoints}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                      formatter={(val: number) => [`${val.toFixed(1)} km/L`, 'Mileage']}
                    />
                    <Line type="monotone" dataKey="mileage" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-6">{selectedCategoryId === 'all' ? 'Category Breakdown' : `Details for ${selectedCategory?.name}`}</h3>
        
        {selectedCategoryId === 'all' ? (
          <div className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                    {categoryBreakdown.map((e, i) => <Cell key={`cell-${i}`} fill={getColorHex(e.color)} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => formatCurrency(v)} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryBreakdown.map(cat => (
                <div key={cat.id} className="group">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(cat.color) }}></span>
                      {cat.icon} {cat.name}
                    </span>
                    <span>{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} transition-all duration-500`} style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </div>
              ))}
              {categoryBreakdown.length === 0 && <p className="text-center py-10 text-slate-300 text-xs italic">No data found</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {noteBreakdown.map((note, idx) => (
                <div key={idx} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 truncate max-w-[70%]">{note.name}</span>
                    <span>{formatCurrency(note.value)}</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full bg-blue-500 transition-all duration-500`} style={{ width: `${note.percentage}%` }}></div>
                  </div>
                </div>
             ))}
             {noteBreakdown.length === 0 && <p className="text-center py-16 text-slate-300 text-xs italic">No items found</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default StatsView;


import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, Category } from '../types';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

const StatsView: React.FC<StatsViewProps> = ({ transactions, categories }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      
      // Period check
      let inPeriod = false;
      if (period === 'day') inPeriod = d.toDateString() === now.toDateString();
      else if (period === 'week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        inPeriod = d >= startOfWeek;
      } else {
        inPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      
      if (!inPeriod) return false;

      // Category filter
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;

      return true;
    });
  }, [transactions, period, selectedCategoryId]);

  const categoryBreakdown = useMemo(() => {
    const totals = filteredTransactions
      .filter(t => t.type === typeFilter)
      .reduce((acc: any, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
      }, {});

    const totalAmount = Object.values(totals).reduce((sum: number, val: any) => sum + val, 0) as number;

    return Object.keys(totals).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || 'Other',
        value: totals[catId],
        percentage: totalAmount > 0 ? (totals[catId] / totalAmount) * 100 : 0,
        color: cat?.color || 'bg-slate-400',
        icon: cat?.icon || '📦'
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, typeFilter, categories]);

  const barData = useMemo(() => {
    const groups: any = {};
    // Only show trend for the selected type to keep it clean if filtered, otherwise show both
    filteredTransactions.forEach(t => {
      const label = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!groups[label]) groups[label] = { name: label, income: 0, expense: 0 };
      if (t.type === 'income') groups[label].income += t.amount;
      else groups[label].expense += t.amount;
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredTransactions]);

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

  return (
    <div className="space-y-8 pb-24">
      {/* Top Filter Bar */}
      <div className="space-y-4">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategoryId === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategoryId === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts */}
      <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className={`w-2 h-6 rounded-full ${typeFilter === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></span>
            Categorisation
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setTypeFilter('expense')} 
              className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${typeFilter === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => setTypeFilter('income')} 
              className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${typeFilter === 'income' ? 'bg-white shadow-sm text-green-500' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>
        </div>

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
              <p className="text-xs font-medium">No {typeFilter} data</p>
            </div>
          )}
        </div>

        {/* Detailed Category List */}
        <div className="mt-8 space-y-4">
          {categoryBreakdown.map((cat, idx) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-sm`}>{cat.icon}</span>
                  <span className="font-bold text-slate-700">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(cat.value)}</p>
                  <p className="text-[10px] text-slate-400">{cat.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                  style={{ width: `${cat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trend Chart */}
      <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
          Period Trends
        </h3>
        <div className="h-[240px] w-full">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <span className="text-4xl mb-2 opacity-30">📊</span>
               <p className="text-xs font-medium">No trend data available</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StatsView;

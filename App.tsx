
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, FinancialInsight } from './types';
import { CATEGORIES, INITIAL_TRANSACTIONS } from './constants';
import TransactionForm from './components/TransactionForm';
import Insights from './components/Insights';
import { analyzeFinances, scanReceipt } from './services/geminiService';

const App: React.FC = () => {
  // Load transactions from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch (e) {
      console.error("Failed to load transactions", e);
      return INITIAL_TRANSACTIONS;
    }
  });

  // Load insights from localStorage
  const [insights, setInsights] = useState<FinancialInsight[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_insights');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load insights", e);
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fintrack_insights', JSON.stringify(insights));
  }, [insights]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const chartData = useMemo(() => {
    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any, t) => {
        const cat = CATEGORIES.find(c => c.id === t.categoryId);
        const name = cat ? cat.name : 'Other';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {});

    return Object.keys(expenseByCategory).map(name => ({
      name,
      value: expenseByCategory[name],
      color: CATEGORIES.find(c => c.name === name)?.color || 'bg-slate-400'
    }));
  }, [transactions]);

  const handleAddTransaction = (newT: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newT,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTransactions(prev => [transaction, ...prev]);
    setShowForm(false);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const fetchInsights = useCallback(async () => {
    if (transactions.length === 0) return;
    setLoadingInsights(true);
    const data = await analyzeFinances(transactions, CATEGORIES);
    if (data) setInsights(data);
    setLoadingInsights(false);
  }, [transactions]);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await scanReceipt(base64);
        if (result) {
          const matchedCategory = CATEGORIES.find(c => 
            c.name.toLowerCase().includes(result.category.toLowerCase()) || 
            result.category.toLowerCase().includes(c.name.toLowerCase())
          ) || CATEGORIES[9];

          handleAddTransaction({
            amount: result.amount,
            type: 'expense',
            categoryId: matchedCategory.id,
            date: result.date || new Date().toISOString(),
            note: result.merchant ? `Scanned: ${result.merchant}` : 'Scanned Receipt'
          });
        }
      } catch (err) {
        console.error("Receipt scan failed", err);
        alert("Failed to scan receipt. Please try again.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setTransactions([]);
      setInsights([]);
      localStorage.removeItem('fintrack_transactions');
      localStorage.removeItem('fintrack_insights');
    }
  };

  // Helper to map tailwind colors to hex for Recharts
  const getColorHex = (twClass: string) => {
    const colors: Record<string, string> = {
      'bg-orange-500': '#f97316',
      'bg-pink-500': '#ec4899',
      'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#a855f7',
      'bg-red-500': '#ef4444',
      'bg-emerald-500': '#10b981',
      'bg-yellow-500': '#eab308',
      'bg-green-600': '#16a34a',
      'bg-indigo-600': '#4f46e5',
      'bg-slate-500': '#64748b',
    };
    return colors[twClass] || '#cbd5e1';
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col max-w-lg mx-auto bg-slate-50 shadow-xl overflow-hidden md:my-8 md:rounded-[3rem] md:border-[12px] md:border-slate-800 relative">
      {/* Header */}
      <header className="bg-blue-600 text-white pt-10 pb-16 px-6 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 flex justify-between items-center mb-8">
          <div>
            <p className="text-blue-100 text-sm font-medium">Available Balance</p>
            <h1 className="text-4xl font-bold">${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
             <span className="text-2xl">📊</span>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Income</p>
            </div>
            <p className="text-xl font-bold">${stats.income.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Expenses</p>
            </div>
            <p className="text-xl font-bold">${stats.expenses.toLocaleString()}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 -mt-8 flex-1 space-y-8 z-20 pb-20">
        
        {/* Weekly Spending Chart */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800">Spending Breakdown</h2>
          </div>
          <div className="h-[240px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <span className="text-4xl mb-2">📉</span>
                <p className="text-sm">No data to display</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
             {chartData.slice(0, 4).map((entry, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${entry.color}`}></div>
                 <span className="text-[10px] text-slate-500 truncate">{entry.name}</span>
               </div>
             ))}
          </div>
        </section>

        {/* AI Insights */}
        <Insights 
          insights={insights} 
          loading={loadingInsights} 
          onRefresh={fetchInsights} 
        />

        {/* Transactions List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Recent History</h2>
          </div>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((t) => {
                const category = CATEGORIES.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm group hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-2xl ${category?.color || 'bg-slate-200'} flex items-center justify-center text-xl shadow-inner`}>
                      {category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{t.note || category?.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                        {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                      </p>
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                 <div className="text-4xl mb-2">💸</div>
                 <p className="text-slate-400">No transactions yet</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 md:absolute md:bottom-8 z-30 flex flex-col gap-3">
        <label className={`w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 border border-slate-100 ${scanning ? 'animate-pulse' : ''}`}>
           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} disabled={scanning} />
           <span className="text-2xl">{scanning ? '⌛' : '📷'}</span>
        </label>
        <button 
          onClick={() => setShowForm(true)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 flex items-center justify-center text-3xl font-light transition-all hover:scale-110 active:scale-95"
        >
          +
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:absolute bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40">
        <button className="flex flex-col items-center gap-1 text-blue-600">
           <span className="text-xl">🏠</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
           <span className="text-xl">📅</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Calendar</span>
        </button>
        <div className="w-12 h-1 invisible"></div>
        <button className="flex flex-col items-center gap-1 text-slate-400">
           <span className="text-xl">📉</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Charts</span>
        </button>
        <button onClick={clearData} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors">
           <span className="text-xl">🗑️</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Clear</span>
        </button>
      </nav>

      {/* Form Overlay */}
      {showForm && (
        <TransactionForm 
          onSave={handleAddTransaction} 
          onCancel={() => setShowForm(false)} 
        />
      )}
    </div>
  );
};

export default App;

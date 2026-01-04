
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, FinancialInsight, Category, PaymentMethod, TransactionType } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, INITIAL_TRANSACTIONS } from './constants';
import TransactionForm from './components/TransactionForm';
import ManageModal from './components/ManageModal';
import Insights from './components/Insights';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import ImportModal from './components/ImportModal';
import { analyzeFinances, scanReceipt } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'stats' | 'settings'>('home');
  
  // Load state from localStorage with robust fallback
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_categories');
      if (!saved || saved === 'undefined' || saved === 'null') return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
    } catch (e) { return DEFAULT_CATEGORIES; }
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_payment_methods');
      if (!saved || saved === 'undefined' || saved === 'null') return DEFAULT_PAYMENT_METHODS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_PAYMENT_METHODS;
    } catch (e) { return DEFAULT_PAYMENT_METHODS; }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_transactions');
      if (!saved || saved === 'undefined' || saved === 'null') return INITIAL_TRANSACTIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TRANSACTIONS;
    } catch (e) { return INITIAL_TRANSACTIONS; }
  });

  const [insights, setInsights] = useState<FinancialInsight[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_insights');
      if (!saved || saved === 'undefined' || saved === 'null') return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  // Persistence Effects
  useEffect(() => {
    if (categories) localStorage.setItem('fintrack_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    if (paymentMethods) localStorage.setItem('fintrack_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);
  useEffect(() => {
    if (transactions) localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    if (insights) localStorage.setItem('fintrack_insights', JSON.stringify(insights));
  }, [insights]);

  const stats = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const income = safeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = safeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let list = Array.isArray(transactions) ? transactions : [];
    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType);
    }
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const handleSaveTransaction = (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...data, id: t.id } : t));
      setEditingTransaction(null);
    } else {
      const transaction: Transaction = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setTransactions(prev => [transaction, ...prev]);
    }
    setShowForm(false);
  };

  const handleBulkImport = (data: { transactions: Transaction[], categories: Category[], paymentMethods: PaymentMethod[] }) => {
    setCategories(data.categories || DEFAULT_CATEGORIES);
    setPaymentMethods(data.paymentMethods || DEFAULT_PAYMENT_METHODS);
    setTransactions(prev => [...(data.transactions || []), ...prev]);
    alert(`Successfully imported ${data.transactions.length} records!`);
  };

  const deleteTransaction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

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
          const matchedCategory = categories.find(c => c.name.toLowerCase().includes(result.category.toLowerCase())) || categories[categories.length - 1];
          handleSaveTransaction({
            amount: result.amount, type: 'expense', categoryId: matchedCategory?.id || categories[0]?.id || '10', 
            paymentMethodId: paymentMethods[0]?.id || 'p1',
            date: result.date || new Date().toISOString(), note: result.merchant ? `Scanned: ${result.merchant}` : 'Scanned Receipt',
            images: [reader.result as string]
          });
        }
      } catch (err) { alert("Failed to scan receipt."); } finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleRefreshInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await analyzeFinances(transactions, categories);
      if (data) setInsights(data);
    } finally {
      setLoadingInsights(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col max-w-lg mx-auto bg-slate-50 shadow-xl overflow-hidden md:my-8 md:rounded-[3rem] md:border-[12px] md:border-slate-800 relative">
      {/* Dynamic Header */}
      {activeTab === 'home' && (
        <header className="bg-blue-600 text-white pt-10 pb-16 px-6 rounded-b-[2.5rem] relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center mb-8">
            <div>
              <p className="text-blue-100 text-sm font-medium">Available Balance</p>
              <h1 className="text-4xl font-bold">{formatCurrency(stats.balance)}</h1>
            </div>
            <button onClick={() => setShowManage(true)} className="bg-white/20 p-3 rounded-2xl backdrop-blur-md active:scale-90 transition-transform">
               <span className="text-xl">⚙️</span>
            </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold mb-1">Income</p>
              <p className="text-xl font-bold text-green-300">{formatCurrency(stats.income)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold mb-1">Expenses</p>
              <p className="text-xl font-bold text-red-300">{formatCurrency(stats.expenses)}</p>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto px-6 pt-6 pb-24 ${activeTab === 'home' ? '-mt-8 z-20' : 'z-10'}`}>
        {activeTab === 'home' && (
          <div className="space-y-8">
            <Insights insights={insights} loading={loadingInsights} onRefresh={handleRefreshInsights} />
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-lg">Recent History</h2>
                <div className="flex bg-slate-200/50 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                  <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg ${filterType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>All</button>
                  <button onClick={() => setFilterType('income')} className={`px-3 py-1.5 rounded-lg ${filterType === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>In</button>
                  <button onClick={() => setFilterType('expense')} className={`px-3 py-1.5 rounded-lg ${filterType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Out</button>
                </div>
              </div>
              <div className="space-y-4">
                {filteredTransactions.slice(0, 15).map((t) => {
                  const category = categories?.find(c => c.id === t.categoryId);
                  return (
                    <div key={t.id} onClick={() => openEditForm(t)} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className={`w-12 h-12 rounded-2xl ${category?.color || 'bg-slate-300'} flex items-center justify-center text-xl`}>{category?.icon || '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{t.note || category?.name || 'Unknown'}</h4>
                        <p className="text-xs text-slate-400 font-medium">{new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                          {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                        {t.images && t.images.length > 0 && <span className="text-[10px] text-blue-500 font-bold">📷 {t.images.length}</span>}
                      </div>
                    </div>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic text-sm">No transactions found</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView 
            transactions={transactions} 
            categories={categories} 
            paymentMethods={paymentMethods}
            onEditTransaction={openEditForm}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView transactions={transactions} categories={categories} />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm">
              <button onClick={() => setShowManage(true)} className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-700">Manage Assets</span>
                <span className="text-slate-400">⚙️</span>
              </button>
              <button onClick={() => setShowImport(true)} className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-700">Import Legacy Data</span>
                <span className="text-slate-400">📥</span>
              </button>
              <div className="border-t border-slate-100 my-2"></div>
              <button onClick={() => {if(window.confirm('Reset all data?')) {setTransactions([]); setInsights([]);}}} className="w-full text-left flex items-center justify-between p-2 text-red-500 hover:bg-red-50 rounded-xl">
                <span className="font-medium">Reset Application Data</span>
                <span>🗑️</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 md:absolute md:bottom-8 z-30 flex flex-col gap-3">
        <label className={`w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 border border-slate-100 ${scanning ? 'animate-pulse' : ''}`}>
           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} disabled={scanning} />
           <span className="text-2xl">{scanning ? '⌛' : '📷'}</span>
        </label>
        <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 flex items-center justify-center text-3xl font-light transition-all hover:scale-110 active:scale-95">
          +
        </button>
      </div>

      {/* Footer Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:absolute bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">🏠</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">📅</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Calendar</span>
        </button>
        <div className="w-12 h-1 invisible"></div>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">📉</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Stats</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">⚙️</span>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
        </button>
      </nav>

      {/* Modals */}
      {showForm && (
        <TransactionForm categories={categories} paymentMethods={paymentMethods} onSave={handleSaveTransaction} onCancel={() => { setShowForm(false); setEditingTransaction(null); }} initialData={editingTransaction || undefined} />
      )}
      {showManage && (
        <ManageModal categories={categories} paymentMethods={paymentMethods} onUpdateCategories={setCategories} onUpdatePaymentMethods={setPaymentMethods} onClose={() => setShowManage(false)} />
      )}
      {showImport && (
        <ImportModal categories={categories} paymentMethods={paymentMethods} onImport={handleBulkImport} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
};

export default App;

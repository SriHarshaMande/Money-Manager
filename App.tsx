
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, FinancialInsight, Category, PaymentMethod, TransactionType } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, INITIAL_TRANSACTIONS } from './constants';
import TransactionForm from './components/TransactionForm';
import ManageModal from './components/ManageModal';
import Insights from './components/Insights';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import LentView from './components/LentView';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import { analyzeFinances, scanReceipt } from './services/geminiService';
import { formatCurrency } from './utils/financeUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'stats' | 'lent' | 'settings'>('home');
  
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
  const [showExport, setShowExport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  useEffect(() => {
    localStorage.setItem('fintrack_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('fintrack_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem('fintrack_insights', JSON.stringify(insights));
  }, [insights]);

  const stats = useMemo(() => {
    const safeT = Array.isArray(transactions) ? transactions : [];
    const income = safeT.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    // Lent transactions are treated as expenses until returned
    const expenses = safeT.filter(t => t.type === 'expense' || (t.type === 'lent' && !t.isReturned)).reduce((sum, t) => sum + t.amount, 0);
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

  const handleToggleReturned = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const isReturning = !t.isReturned;
        return { 
          ...t, 
          isReturned: isReturning, 
          returnedDate: isReturning ? new Date().toISOString() : undefined 
        };
      }
      return t;
    }));
  };

  const handleBulkImport = (data: { transactions: Transaction[], categories: Category[], paymentMethods: PaymentMethod[] }) => {
    setCategories(data.categories || DEFAULT_CATEGORIES);
    setPaymentMethods(data.paymentMethods || DEFAULT_PAYMENT_METHODS);
    setTransactions(prev => [...(data.transactions || []), ...prev]);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
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

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col max-w-lg mx-auto bg-slate-50 shadow-2xl overflow-hidden md:my-8 md:rounded-[3.5rem] md:border-[12px] md:border-slate-900 relative">
      <div className="h-8 md:hidden"></div>

      {activeTab === 'home' && (
        <header className="bg-blue-600 text-white pt-6 pb-16 px-8 rounded-b-[3rem] relative overflow-hidden shrink-0 shadow-lg shadow-blue-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 flex justify-between items-center mb-8">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest opacity-80">Total Balance</p>
              <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(stats.balance)}</h1>
            </div>
            <button onClick={() => setShowManage(true)} className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-md active:scale-90 transition-all border border-white/20">
               <span className="text-xl">🛠️</span>
            </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">⬇️</div>
              <div>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Income</p>
                <p className="text-lg font-bold text-green-300">{formatCurrency(stats.income)}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">⬆️</div>
              <div>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Exp/Lent</p>
                <p className="text-lg font-bold text-red-300">{formatCurrency(stats.expenses)}</p>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto px-6 pt-6 pb-24 ${activeTab === 'home' ? '-mt-10 z-20' : 'z-10'}`}>
        {activeTab === 'home' && (
          <div className="space-y-8">
            <Insights insights={insights} loading={loadingInsights} onRefresh={handleRefreshInsights} />
            <section>
              <div className="flex justify-between items-center mb-5 px-1">
                <h2 className="font-bold text-slate-900 text-xl tracking-tight">Activity</h2>
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider">
                  {(['all', 'income', 'expense', 'lent'] as const).map(type => (
                    <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-xl transition-all ${filterType === type ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>
                      {type === 'all' ? 'All' : type === 'income' ? 'In' : type === 'lent' ? 'Lent' : 'Out'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3.5">
                {filteredTransactions.slice(0, 15).map((t) => {
                  const category = categories?.find(c => c.id === t.categoryId);
                  const fromAsset = paymentMethods.find(p => p.id === t.paymentMethodId);
                  
                  return (
                    <div key={t.id} onClick={() => openEditForm(t)} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-50 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group active:scale-[0.98]">
                      <div className={`w-14 h-14 rounded-2xl ${t.type === 'lent' ? 'bg-rose-500' : (category?.color || 'bg-slate-300')} flex items-center justify-center text-2xl shadow-inner`}>
                        {t.type === 'lent' ? '🤝' : (category?.icon || '📦')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate leading-tight">
                          {t.type === 'lent' ? `Lent to ${t.note}` : (t.note || category?.name || 'Unknown')}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-slate-400 font-bold uppercase">
                            {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {fromAsset?.name}
                          </p>
                          {t.isReturned && (
                            <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-black uppercase">Returned</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${t.type === 'expense' || (t.type === 'lent' && !t.isReturned) ? 'text-slate-900' : 'text-green-600'}`}>
                          {(t.type === 'expense' || (t.type === 'lent' && !t.isReturned)) ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView transactions={transactions} categories={categories} paymentMethods={paymentMethods} onEditTransaction={openEditForm} />
        )}
        {activeTab === 'stats' && (
          <StatsView transactions={transactions} categories={categories} />
        )}
        {activeTab === 'lent' && (
          <LentView transactions={transactions} onToggleReturned={handleToggleReturned} onEdit={openEditForm} />
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6 pt-4">
            <h2 className="text-3xl font-extrabold tracking-tight px-2">Settings</h2>
            <div className="bg-white rounded-[3rem] p-8 space-y-4 shadow-sm border border-slate-50">
               <button onClick={() => setShowManage(true)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-colors text-left">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl">🏷️</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">Manage Assets</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Income/Expense Categories</p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 mx-4"></div>

                <button onClick={() => setShowImport(true)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-colors text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">📥</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">Import Data</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Restore from backup</p>
                  </div>
                </button>

                <button onClick={() => setShowExport(true)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-colors text-left">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl">📤</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">Export Data</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Save CSV or JSON</p>
                  </div>
                </button>
            </div>
          </div>
        )}
      </main>

      {/* Action FABs */}
      <div className="fixed bottom-24 right-6 md:absolute md:bottom-10 md:right-10 z-30 flex flex-col gap-4">
        <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-300 flex items-center justify-center text-4xl font-light transition-all hover:scale-110 active:scale-95 border-4 border-blue-500/50">
          +
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 md:absolute bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-6 py-5 flex justify-between items-center z-40 rounded-t-[3rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">🏠</span>
           <span className="text-[9px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab('lent')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'lent' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">🤝</span>
           <span className="text-[9px] font-bold uppercase">Lent</span>
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">📅</span>
           <span className="text-[9px] font-bold uppercase">Events</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'stats' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">📈</span>
           <span className="text-[9px] font-bold uppercase">Stats</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
           <span className="text-xl">⚙️</span>
           <span className="text-[9px] font-bold uppercase">Tools</span>
        </button>
      </nav>

      {showForm && (
        <TransactionForm 
          categories={categories} 
          paymentMethods={paymentMethods} 
          onSave={handleSaveTransaction} 
          onCancel={() => { setShowForm(false); setEditingTransaction(null); }} 
          initialData={editingTransaction || undefined}
          allTransactions={transactions}
        />
      )}
      {showManage && (
        <ManageModal categories={categories} paymentMethods={paymentMethods} onUpdateCategories={setCategories} onUpdatePaymentMethods={setPaymentMethods} onClose={() => setShowManage(false)} />
      )}
      {showImport && (
        <ImportModal categories={categories} paymentMethods={paymentMethods} onImport={handleBulkImport} onClose={() => setShowImport(false)} />
      )}
      {showExport && (
        <ExportModal transactions={transactions} categories={categories} paymentMethods={paymentMethods} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
};

export default App;

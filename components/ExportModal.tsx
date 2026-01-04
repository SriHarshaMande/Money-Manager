
import React from 'react';
import { Transaction, Category, PaymentMethod } from '../types';

interface ExportModalProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ transactions, categories, paymentMethods, onClose }) => {
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportJSON = () => {
    const data = {
      transactions,
      categories,
      paymentMethods,
      exportDate: new Date().toISOString(),
      version: '2.5'
    };
    downloadFile(JSON.stringify(data, null, 2), `fintrack_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    onClose();
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Asset', 'Amount', 'Note'].join(',');
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
      const pm = paymentMethods.find(p => p.id === t.paymentMethodId)?.name || 'Unknown';
      const date = new Date(t.date).toLocaleDateString();
      return [
        `"${date}"`,
        `"${t.type}"`,
        `"${cat}"`,
        `"${pm}"`,
        t.amount,
        `"${t.note.replace(/"/g, '""')}"`
      ].join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, `fintrack_logs_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Export Your Data</h2>
          <button onClick={onClose} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors">✕</button>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-500 leading-relaxed text-center">
            Choose your preferred export format. We recommend <b>JSON</b> for backups and <b>CSV</b> for use in spreadsheets like Excel or Sheets.
          </p>

          <div className="space-y-4">
            <button 
              onClick={exportJSON}
              className="w-full flex items-center gap-4 p-5 bg-blue-50 hover:bg-blue-100 rounded-3xl transition-all border border-blue-100 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm group-active:scale-90 transition-transform">📄</div>
              <div className="text-left">
                <p className="font-bold text-slate-800">JSON Backup</p>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Recommended for Restore</p>
              </div>
            </button>

            <button 
              onClick={exportCSV}
              className="w-full flex items-center gap-4 p-5 bg-emerald-50 hover:bg-emerald-100 rounded-3xl transition-all border border-emerald-100 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm group-active:scale-90 transition-transform">📊</div>
              <div className="text-left">
                <p className="font-bold text-slate-800">CSV Spreadsheet</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Excel / Google Sheets</p>
              </div>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">
          {transactions.length} Records found
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
